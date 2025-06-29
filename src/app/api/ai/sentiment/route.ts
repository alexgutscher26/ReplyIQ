import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance, getSession } from '@/server/utils';
import { db } from '@/server/db';
import { trackToolUsageServer } from '@/utils/track-tool-usage';

const sentimentSchema = z.object({
  text: z.string().min(1, 'Text is required').max(10000, 'Text is too long'),
  platform: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'general']).default('general'),
  analysisType: z.enum(['quick', 'detailed', 'comprehensive']).default('detailed'),
  includeRecommendations: z.boolean().default(true),
});

/**
 * Handles sentiment analysis requests and returns a comprehensive analysis of the input text.
 *
 * The function processes the request body, validates it against a schema, and constructs a prompt for an AI model to analyze the sentiment.
 * It then parses the AI-generated response to extract various sentiment-related data points such as overall sentiment, primary emotion,
 * tone indicators, and risk flags. Usage analytics are tracked if a user session is available. The function handles errors gracefully,
 * returning appropriate error messages and status codes.
 *
 * @param req - The NextRequest object containing the request body with text to analyze.
 * @returns A JSON response containing the sentiment analysis results or an error message.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: unknown = await req.json();
    const { text, platform, analysisType, includeRecommendations } = sentimentSchema.parse(body);

    console.log('Sentiment analysis request:', { platform, analysisType, textLength: text.length });

    // Get the session for tracking
    const session = await getSession();

    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const platformContext = {
      'twitter': 'Twitter/X platform with character limits and public discourse',
      'facebook': 'Facebook with personal and community interactions',
      'instagram': 'Instagram with visual content and lifestyle focus',
      'linkedin': 'LinkedIn professional networking platform',
      'general': 'General social media or communication context'
    };

    const prompt = `Analyze the sentiment and emotional tone of the following text for ${platformContext[platform]}.

Text to analyze: "${text}"

Analysis type: ${analysisType}
Platform: ${platform}

Please provide a comprehensive sentiment analysis in this format:

**Overall Sentiment:** [Positive/Negative/Neutral] (Confidence: X%)
**Primary Emotion:** [Main emotion detected]
**Secondary Emotions:** [Additional emotions if present]
**Tone Indicators:** [Formal/Casual/Aggressive/Friendly/Professional/etc.]
**Intensity Level:** [Low/Medium/High] (Score: X/10)
**Context Clues:** [Cultural, social, or situational context]
**Potential Triggers:** [Sensitive topics identified]
**Audience:** [Who this seems targeted toward]
${includeRecommendations ? `**Tone to Use:** [Recommended response tone]
**Key Points:** [What to address]
**Avoid:** [What to avoid]
**Strategy:** [Response approach]` : ''}
**Notes:** [Additional insights]

Consider:
- Cultural and contextual nuances
- Explicit and implicit emotional indicators
- Sarcasm, irony, or humor
- Platform-specific communication norms
- Mental health or crisis indicators`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 1000,
      temperature: 0.2,
      system: `You are an expert sentiment analysis specialist with deep understanding of human emotions and social media patterns.`
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';
    
    const analysisData = {
      overallSentiment: '',
      sentimentConfidence: 0,
      primaryEmotion: '',
      secondaryEmotions: [] as string[],
      toneIndicators: [] as string[],
      intensityLevel: '',
      intensityScore: 0,
      contextClues: '',
      potentialTriggers: [] as string[],
      audienceConsideration: '',
      responseRecommendations: {
        toneToUse: '',
        keyPoints: [] as string[],
        avoid: [] as string[],
        strategy: ''
      },
      analysisNotes: '',
      fullResponse: messageContent,
      riskFlags: [] as string[]
    };

    if (messageContent) {
      // Parse sentiment
      const sentimentMatch = /\*\*Overall Sentiment:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (sentimentMatch?.[1]) {
        analysisData.overallSentiment = sentimentMatch[1].trim();
        const confidenceMatch = /(\d+)%/.exec(sentimentMatch[1]);
        if (confidenceMatch?.[1]) {
          analysisData.sentimentConfidence = parseInt(confidenceMatch[1], 10);
        }
      }

      // Parse primary emotion
      const emotionMatch = /\*\*Primary Emotion:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (emotionMatch?.[1]) {
        analysisData.primaryEmotion = emotionMatch[1].trim();
      }

      // Parse secondary emotions
      const secondaryMatch = /\*\*Secondary Emotions:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (secondaryMatch?.[1]) {
        analysisData.secondaryEmotions = secondaryMatch[1].trim().split(',').map(e => e.trim()).filter(e => e);
      }

      // Parse tone indicators
      const toneMatch = /\*\*Tone Indicators:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (toneMatch?.[1]) {
        analysisData.toneIndicators = toneMatch[1].trim().split(/[,\/]/).map(t => t.trim()).filter(t => t);
      }

      // Parse intensity
      const intensityMatch = /\*\*Intensity Level:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (intensityMatch?.[1]) {
        analysisData.intensityLevel = intensityMatch[1].trim();
        const scoreMatch = /(\d+)\/10/.exec(intensityMatch[1]);
        if (scoreMatch?.[1]) {
          analysisData.intensityScore = parseInt(scoreMatch[1], 10);
        }
      }

      // Parse other fields
      const contextMatch = /\*\*Context Clues:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (contextMatch?.[1]) {
        analysisData.contextClues = contextMatch[1].trim();
      }

      const triggersMatch = /\*\*Potential Triggers:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (triggersMatch?.[1]) {
        analysisData.potentialTriggers = triggersMatch[1].trim().split(',').map(t => t.trim()).filter(t => t);
      }

      const audienceMatch = /\*\*Audience:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (audienceMatch?.[1]) {
        analysisData.audienceConsideration = audienceMatch[1].trim();
      }

      if (includeRecommendations) {
        const toneToUseMatch = /\*\*Tone to Use:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
        if (toneToUseMatch?.[1]) {
          analysisData.responseRecommendations.toneToUse = toneToUseMatch[1].trim();
        }

        const keyPointsMatch = /\*\*Key Points:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
        if (keyPointsMatch?.[1]) {
          analysisData.responseRecommendations.keyPoints = keyPointsMatch[1].trim().split(/[•\-]/).map(p => p.trim()).filter(p => p);
        }

        const avoidMatch = /\*\*Avoid:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
        if (avoidMatch?.[1]) {
          analysisData.responseRecommendations.avoid = avoidMatch[1].trim().split(/[•\-]/).map(a => a.trim()).filter(a => a);
        }

        const strategyMatch = /\*\*Strategy:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
        if (strategyMatch?.[1]) {
          analysisData.responseRecommendations.strategy = strategyMatch[1].trim();
        }
      }

      const notesMatch = /\*\*Notes:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (notesMatch?.[1]) {
        analysisData.analysisNotes = notesMatch[1].trim();
      }

      // Check for risk flags
      const riskKeywords = ['suicide', 'depression', 'crisis', 'help me'];
      const lowerText = text.toLowerCase();
      if (riskKeywords.some(keyword => lowerText.includes(keyword))) {
        analysisData.riskFlags.push('mental-health-concern');
      }
    }

    const responseData = {
      ...analysisData,
      originalText: text,
      platform,
      analysisType,
      includeRecommendations,
      wordCount: text.split(/\s+/).length,
      characterCount: text.length,
      timestamp: new Date().toISOString()
    };

    // Track usage analytics
    if (session?.user?.id) {
      const duration = Date.now() - startTime;
      await trackToolUsageServer(
        db,
        session.user.id,
        'sentiment-analysis',
        {
          platform,
          analysisType,
          textLength: text.length,
          hasRecommendations: includeRecommendations,
          success: true,
        },
        duration,
        result.usage?.totalTokens
      );
    }

    return NextResponse.json(responseData);

  } catch (error: unknown) {
    console.error('Sentiment analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    let errorMessage = 'Failed to analyze sentiment';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Returns a JSON response with supported platforms, analysis types, emotions, and tones.
 */
export async function GET() {
  return NextResponse.json({
    supportedPlatforms: ['twitter', 'facebook', 'instagram', 'linkedin', 'general'],
    analysisTypes: ['quick', 'detailed', 'comprehensive'],
    emotions: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'neutral'],
    tones: ['formal', 'casual', 'aggressive', 'friendly', 'professional', 'sarcastic'],
  });
} 