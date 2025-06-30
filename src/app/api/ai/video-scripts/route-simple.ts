import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const schema = z.object({
  topic: z.string().min(3, 'Topic is too short').max(200, 'Topic is too long'),
  videoType: z.enum(['educational', 'promotional', 'entertainment', 'tutorial', 'explainer']),
  duration: z.number().min(1).max(60).default(5),
  tone: z.enum(['professional', 'casual', 'energetic', 'calm', 'humorous']).default('professional'),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'general']).default('youtube'),
  targetAudience: z.string().optional(),
  keywords: z.string().optional(),
  includeHook: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { topic, videoType, duration, tone, platform, targetAudience, keywords, includeHook, includeCTA } = schema.parse(body);

    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const platformInstructions = {
      youtube: 'YouTube: Create compelling hooks, use timestamps, optimize for watch time',
      tiktok: 'TikTok: Hook within 3 seconds, trending audio, jump cuts every 2-3 seconds',
      instagram: 'Instagram: Vertical viewing, caption-worthy quotes, hashtags, Stories optimization',
      general: 'Multi-platform: Adaptable content, universal engagement principles'
    };

    const typeInstructions = {
      educational: 'Educational: Use LEARN model, include aha moments, analogies, knowledge checks',
      promotional: 'Promotional: Use PASTOR framework, social proof, urgency, emotional triggers',
      entertainment: 'Entertainment: Story arcs, comedic timing, relatable characters, surprise elements',
      tutorial: 'Tutorial: SHOW method, progress indicators, troubleshooting, before/after comparisons',
      explainer: 'Explainer: SIMPLE approach, digestible chunks, visual metaphors, real-world examples'
    };

    const audienceText = targetAudience ? `Target Audience: ${targetAudience}` : '';
    const keywordsText = keywords ? `Keywords: ${keywords}` : '';

    const prompt = `Create a ${duration}-minute ${videoType} video script about "${topic}" for ${platform} in ${tone} tone.

${audienceText}
${keywordsText}

Platform Guidelines: ${platformInstructions[platform]}
Content Type: ${typeInstructions[videoType]}

Create a structured script with:
${includeHook ? '- HOOK: Compelling 3-15 second opening' : ''}
- INTRODUCTION: Credibility and value preview
- MAIN CONTENT: Core value with engagement elements
- CONCLUSION: Summary with key takeaways
${includeCTA ? '- CALL TO ACTION: Clear, specific action' : ''}
- TECHNICAL NOTES: Duration, visuals, music, editing notes

Focus on engagement, retention, and platform optimization.`;

    const systemPrompt = `You are an expert video scriptwriter specializing in ${platform} content. Create engaging, platform-optimized scripts with clear structure, strong hooks, and actionable content. Include production notes and timing cues.`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 2500,
      temperature: 0.8,
      system: systemPrompt
    });

    const content = result.text || '';

    // Helper function for extracting sections
    const extractSection = (text: string, sectionName: string): string => {
      const regex = new RegExp(`\\*\\*${sectionName}:\\*\\*\\s*(.*?)(?=\\n\\*\\*|\\n\\n|$)`, 's');
      const match = regex.exec(text);
      return match?.[1]?.trim() ?? '';
    };

    // Simple parsing
    const sections = {
      title: extractSection(content, 'TITLE') || `${videoType} Script: ${topic}`,
      hook: includeHook ? extractSection(content, 'HOOK') || '' : '',
      introduction: extractSection(content, 'INTRODUCTION') || '',
      mainContent: extractSection(content, 'MAIN CONTENT') || content,
      conclusion: extractSection(content, 'CONCLUSION') || '',
      callToAction: includeCTA ? extractSection(content, 'CALL TO ACTION') || '' : '',
      technicalNotes: extractSection(content, 'TECHNICAL NOTES') || '',
      fullScript: content
    };

    return NextResponse.json({
      script: sections,
      metadata: {
        topic,
        videoType,
        duration,
        tone,
        platform,
        targetAudience,
        keywords,
        estimatedReadingTime: Math.ceil(content.length / 200),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: unknown) {
    console.error('Video script generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate video script',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 