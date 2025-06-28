import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const translateSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  sourceLanguage: z.string().default('auto'),
  targetLanguage: z.string().min(1, 'Target language is required'),
  style: z.enum(['formal', 'informal', 'social', 'professional', 'casual']).default('social'),
  context: z.enum(['general', 'social-media', 'business', 'customer-service', 'marketing']).default('social-media'),
  tone: z.enum(['maintain', 'friendly', 'professional', 'enthusiastic', 'neutral']).default('maintain'),
  includeAlternatives: z.boolean().default(false),
});

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'ms': 'Malay',
  'he': 'Hebrew',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'sw': 'Swahili',
  'af': 'Afrikaans',
  'ca': 'Catalan',
} as const;

/**
 * Handles POST requests to translate text from one language to another with specific styling and context.
 *
 * This function parses incoming request data, retrieves settings from the database, initializes an AI instance,
 * constructs a translation prompt based on provided parameters, generates a translation using the AI model,
 * and extracts primary translations, alternatives, and notes from the response. It also handles errors
 * related to invalid input or internal server issues.
 *
 * @param req - An object representing the incoming request with JSON data containing text to translate,
 *              source language, target language, style, context, tone, and an option to include alternatives.
 * @returns A JSON response containing the translated text, detected source language, translation notes,
 *          full response from the AI model, original text, character count, and word count.
 * @throws Error if there is a Zod error in parsing request data or other internal server errors.
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { text, sourceLanguage, targetLanguage, style, context, tone, includeAlternatives } = translateSchema.parse(body);

    console.log('Translation request:', { sourceLanguage, targetLanguage, style, context, tone });

    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const targetLanguageName = SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES] || targetLanguage;
    const sourceLanguageName = sourceLanguage === 'auto' 
      ? 'automatically detected language' 
      : SUPPORTED_LANGUAGES[sourceLanguage as keyof typeof SUPPORTED_LANGUAGES] || sourceLanguage;

    const styleInstructions = {
      'formal': 'Use formal language, proper grammar, and respectful tone',
      'informal': 'Use casual, conversational language with natural expressions',
      'social': 'Optimize for social media with engaging, shareable language',
      'professional': 'Use professional, business-appropriate language',
      'casual': 'Use relaxed, everyday language that feels natural'
    };

    const contextInstructions = {
      'general': 'General translation maintaining original meaning',
      'social-media': 'Optimize for social media platforms with engaging language',
      'business': 'Business communication with professional terminology',
      'customer-service': 'Customer service with helpful, polite language',
      'marketing': 'Marketing context with persuasive, engaging language'
    };

    const prompt = `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.

Text to translate: "${text}"

Style: ${style} - ${styleInstructions[style]}
Context: ${context} - ${contextInstructions[context]}
Tone: ${tone}

Guidelines:
- Maintain cultural appropriateness for the target language
- Preserve hashtags, mentions, or URLs in original form
- Use natural expressions native speakers would use
- Keep appropriate length for the context
- Maintain emotional nuance from the original

${includeAlternatives ? 'Provide the main translation and 2-3 alternative versions.' : 'Provide the best translation.'}

Response format:
**Translation:** [Your translation here]
${includeAlternatives ? '**Alternative 1:** [Alternative translation]\n**Alternative 2:** [Alternative translation]' : ''}
**Notes:** [Any important context or cultural adaptations]`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 800,
      temperature: 0.3,
      system: `You are an expert translator specializing in ${targetLanguageName}. Create natural, culturally appropriate translations for ${context} use.`
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';
    
    const translationData = {
      primaryTranslation: '',
      alternatives: [] as string[],
      detectedSourceLanguage: sourceLanguage,
      translationNotes: '',
      fullResponse: messageContent
    };

    if (messageContent) {
      const translationMatch = /\*\*Translation:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (translationMatch?.[1]) {
        translationData.primaryTranslation = translationMatch[1].trim();
      }

      if (includeAlternatives) {
        const altMatches = messageContent.matchAll(/\*\*Alternative \d+:\*\*\s*(.*?)(?=\*\*|$)/gs);
        for (const match of altMatches) {
          if (match[1]) {
            translationData.alternatives.push(match[1].trim());
          }
        }
      }

      const notesMatch = /\*\*Notes:\*\*\s*(.*?)(?=\*\*|$)/s.exec(messageContent);
      if (notesMatch?.[1]) {
        translationData.translationNotes = notesMatch[1].trim();
      }

      if (!translationData.primaryTranslation && messageContent.trim()) {
        translationData.primaryTranslation = messageContent.trim();
      }
    }

    return NextResponse.json({ 
      ...translationData,
      originalText: text,
      sourceLanguage,
      targetLanguage,
      targetLanguageName,
      style,
      context,
      tone,
      includeAlternatives,
      characterCount: translationData.primaryTranslation.length,
      wordCount: translationData.primaryTranslation.split(/\s+/).length
    });
  } catch (error: unknown) {
    console.error('Translation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    let errorMessage = 'Failed to translate text';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Returns a JSON response with supported languages and their count.
 */
export async function GET() {
  return NextResponse.json({
    supportedLanguages: SUPPORTED_LANGUAGES,
    totalLanguages: Object.keys(SUPPORTED_LANGUAGES).length
  });
} 