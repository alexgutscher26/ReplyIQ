import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const storySchema = z.object({
  topic: z.string().min(3, 'Topic is too short'),
  platform: z.enum(['instagram', 'facebook', 'both']).default('instagram'),
  storyType: z.enum(['promotional', 'behind-the-scenes', 'educational', 'entertaining', 'poll', 'qa', 'lifestyle']),
  storyCount: z.number().min(1).max(10).default(5),
  tone: z.enum(['casual', 'professional', 'energetic', 'friendly', 'humorous']).default('casual'),
  includeVisualSuggestions: z.boolean().default(true),
  targetAudience: z.enum(['general', 'young-adults', 'professionals', 'parents', 'entrepreneurs']).default('general'),
});

/**
 * Handles a POST request to generate stories based on provided parameters.
 *
 * This function processes an incoming request, validates and parses the body,
 * fetches AI settings from the database, constructs a detailed prompt for story generation,
 * generates text using an AI model, and parses the generated content into individual stories.
 * It returns the parsed stories along with other request parameters.
 *
 * @param req - The NextRequest object containing the request details.
 * @returns A JSON response containing the generated stories and other relevant information.
 * @throws Error if the request body is invalid or if there's an error during story generation.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { topic, platform, storyType, storyCount, tone, includeVisualSuggestions, targetAudience } = storySchema.parse(body);

    console.log('Story generation request:', { topic, platform, storyType, storyCount, tone, targetAudience });

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const platformInstructions = {
      'instagram': 'Create content optimized for Instagram Stories with engaging visuals, interactive elements, and hashtags. Consider Instagram\'s features like polls, questions, stickers, and swipe-up actions.',
      'facebook': 'Create content for Facebook Stories focusing on community engagement, sharing-friendly content, and Facebook\'s story features like reactions and comments.',
      'both': 'Create versatile content that works well on both Instagram and Facebook Stories, focusing on universal appeal and cross-platform compatibility.'
    };

    const storyTypeInstructions = {
      'promotional': 'Create promotional content that showcases products/services without being overly salesy. Include subtle calls-to-action and value propositions.',
      'behind-the-scenes': 'Show the authentic, human side with behind-the-scenes content that builds connection and trust with the audience.',
      'educational': 'Provide valuable tips, insights, or tutorials that educate the audience while being visually engaging and easy to digest.',
      'entertaining': 'Create fun, engaging content that entertains the audience with humor, challenges, or interesting content.',
      'poll': 'Create interactive poll-based stories that engage the audience and gather feedback or opinions.',
      'qa': 'Design Q&A format stories that answer common questions or provide expert insights in an accessible format.',
      'lifestyle': 'Showcase lifestyle content that connects with the audience\'s aspirations, values, or daily experiences.'
    };

    const targetAudienceInstructions = {
      'general': 'Appeal to a broad audience with universal themes and accessible language.',
      'young-adults': 'Use trending language, pop culture references, and themes that resonate with 18-30 age group.',
      'professionals': 'Focus on career development, industry insights, and professional growth themes.',
      'parents': 'Address parenting challenges, family life, and content relevant to mothers and fathers.',
      'entrepreneurs': 'Focus on business growth, startup life, productivity, and entrepreneurial mindset.'
    };

    const visualSuggestionPrompt = includeVisualSuggestions 
      ? '\n\nFor each story, include detailed visual suggestions in the format:\n**Visual:** [Description of recommended visual, color scheme, text overlay placement, and any interactive elements]'
      : '';

    const prompt = `Create ${storyCount} engaging ${storyType} stories about "${topic}" for ${platform}.

Platform Guidelines:
${platformInstructions[platform]}

Story Type Guidelines:
${storyTypeInstructions[storyType]}

Target Audience: ${targetAudience}
${targetAudienceInstructions[targetAudience]}

Tone: ${tone}

Format each story as follows:

**Story [Number]: [Catchy Title]**
**Text Content:** [Main text/copy for the story - keep it concise and engaging, suitable for mobile viewing]
**Interactive Element:** [Suggest polls, questions, stickers, or calls-to-action appropriate for the platform]${visualSuggestionPrompt}
**Hashtags:** [Relevant hashtags for discoverability]
**Duration:** [Recommended viewing time: 3-7 seconds for quick content, 10-15 seconds for detailed content]

---

Guidelines for all stories:
- Keep text short and punchy (stories are viewed quickly)
- Include strong visual hooks in the first 2 seconds
- Use emojis appropriately to enhance engagement
- Consider mobile-first design and readability
- Include clear but subtle calls-to-action
- Make content shareable and conversation-starting
- Ensure content flows well if viewed as a sequence
- ${tone === 'humorous' ? 'Include humor that\'s appropriate and relatable' : tone === 'professional' ? 'Maintain professional standards while being engaging' : `Match the ${tone} tone throughout`}

Create exactly ${storyCount} stories that work together as a cohesive sequence while each being engaging standalone content.`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 2000,
      temperature: 0.8,
      system: `You are an expert social media content creator specializing in ${platform} stories. Create engaging, ${tone} content that performs well with ${targetAudience} audiences. Focus on ${storyType} content that drives engagement and achieves business goals.`
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';

    console.log('Generated stories:', messageContent);

    // Parse individual stories from the response
    const stories: Array<{
      title: string;
      textContent: string;
      interactiveElement: string;
      visual: string;
      hashtags: string;
      duration: string;
      fullContent: string;
    }> = [];

    if (messageContent) {
      const storyBlocks = messageContent.split('---').filter(block => block.trim());
      
      for (const block of storyBlocks) {
        const titleMatch = /\*\*Story \d+:\s*(.+?)\*\*/.exec(block);
        const textMatch = /\*\*Text Content:\*\*\s*(.*?)(?=\*\*|$)/s.exec(block);
        const interactiveMatch = /\*\*Interactive Element:\*\*\s*(.*?)(?=\*\*|$)/s.exec(block);
        const visualMatch = /\*\*Visual:\*\*\s*(.*?)(?=\*\*|$)/s.exec(block);
        const hashtagsMatch = /\*\*Hashtags:\*\*\s*(.*?)(?=\*\*|$)/s.exec(block);
        const durationMatch = /\*\*Duration:\*\*\s*(.*?)(?=\*\*|$)/s.exec(block);

        if (titleMatch?.[1]) {
          stories.push({
            title: titleMatch[1].trim(),
            textContent: textMatch?.[1]?.trim() ?? '',
            interactiveElement: interactiveMatch?.[1]?.trim() ?? '',
            visual: visualMatch?.[1]?.trim() ?? '',
            hashtags: hashtagsMatch?.[1]?.trim() ?? '',
            duration: durationMatch?.[1]?.trim() ?? '',
            fullContent: block.trim()
          });
        }
      }
    }

    console.log(`Parsed ${stories.length} stories (requested: ${storyCount})`);

    return NextResponse.json({ 
      stories,
      topic,
      platform,
      storyType,
      storyCount,
      tone,
      targetAudience,
      includeVisualSuggestions,
      totalStories: stories.length,
      fullContent: messageContent
    });
  } catch (error: unknown) {
    console.error('Story generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    let errorMessage = 'Failed to generate stories';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 