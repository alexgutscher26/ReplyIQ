import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const schema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  style: z.enum(['descriptive', 'creative', 'minimal', 'social', 'professional']).default('descriptive'),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'general']).default('general'),
  includeHashtags: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { imageUrl, style, platform, includeHashtags } = schema.parse(body);

    console.log('Image caption generation request:', { imageUrl, style, platform, includeHashtags });

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const styleInstructions = {
      'descriptive': 'Create a detailed, informative caption that thoroughly describes what\'s in the image.',
      'creative': 'Write a creative, engaging caption with storytelling elements and emotional appeal.',
      'minimal': 'Generate a short, concise caption that captures the essence in few words.',
      'social': 'Create a fun, engaging social media caption with personality and relatability.',
      'professional': 'Write a professional, polished caption suitable for business or corporate use.'
    };

    const platformInstructions = {
      'instagram': 'Optimize for Instagram with emoji usage, engaging tone, and potential for high engagement.',
      'facebook': 'Create content suitable for Facebook with conversational tone and community appeal.',
      'twitter': 'Keep it concise for Twitter while being impactful and shareable.',
      'linkedin': 'Professional tone suitable for LinkedIn business networking.',
      'general': 'Create versatile content suitable for multiple platforms.'
    };

    const hashtagInstructions = includeHashtags 
      ? 'Include 3-5 relevant hashtags at the end of the caption.' 
      : 'Do not include any hashtags.';

    const prompt = `Analyze this image and create a caption with the following specifications:

Style: ${style} - ${styleInstructions[style]}
Platform: ${platform} - ${platformInstructions[platform]}
Hashtags: ${hashtagInstructions}

Generate a caption that is:
- Appropriate for the specified platform
- Matches the requested style
- Engaging and authentic
- Culturally sensitive and appropriate

Image URL: ${imageUrl}

Return only the caption text, no additional explanations or formatting.`;

    const result = await generateText({
      model: instance,
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator and image analyst. Create engaging, appropriate captions for images based on the specified requirements.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              image: imageUrl
            }
          ]
        }
      ],
      maxTokens: 200,
      temperature: 0.8,
    });

    const caption = typeof result.text === 'string' ? result.text.trim() : '';

    console.log('Generated caption:', caption);

    return NextResponse.json({ 
      caption,
      imageUrl,
      style,
      platform,
      includeHashtags
    });
  } catch (error: unknown) {
    console.error('Image caption generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    let errorMessage = 'Failed to generate image caption';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 