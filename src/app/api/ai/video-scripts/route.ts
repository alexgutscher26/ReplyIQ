import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const schema = z.object({
  topic: z.string().min(3, 'Topic is too short'),
  videoType: z.enum(['educational', 'promotional', 'entertainment', 'tutorial', 'explainer']),
  duration: z.number().min(1).max(60).default(5), // Duration in minutes
  tone: z.enum(['professional', 'casual', 'energetic', 'calm', 'humorous']).default('professional'),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'general']).default('youtube'),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { topic, videoType, duration, tone, platform } = schema.parse(body);

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const platformSpecificInstructions = {
      youtube: 'Format for YouTube with clear intro, main content sections, and call-to-action. Include timestamps and scene descriptions.',
      tiktok: 'Short, punchy script for TikTok. Focus on hooks, quick transitions, and trending elements. Keep it under 60 seconds.',
      instagram: 'Instagram-optimized script with visual cues and hashtag suggestions. Good for Reels or IGTV.',
      general: 'Versatile script suitable for multiple platforms with clear structure and engaging content.'
    };

    const videoTypeInstructions = {
      educational: 'Structure as a clear learning experience with introduction, key points, examples, and summary.',
      promotional: 'Focus on benefits, features, and strong call-to-action. Include persuasive elements.',
      entertainment: 'Emphasize humor, storytelling, and engagement. Keep audience entertained throughout.',
      tutorial: 'Step-by-step instructions with clear explanations and actionable advice.',
      explainer: 'Break down complex topics into simple, digestible segments with clear explanations.'
    };

    const prompt = `Create a ${duration}-minute ${videoType} video script about "${topic}" for ${platform}.

Video Type Guidelines:
${videoTypeInstructions[videoType]}

Platform Guidelines:
${platformSpecificInstructions[platform]}

Tone: ${tone}

Format your response with clear structure including:

**TITLE:** [Engaging video title]

**HOOK:** [First 5-10 seconds to grab attention]

**INTRODUCTION:** [Brief intro and what viewers will learn/gain]

**MAIN CONTENT:**
[Scene 1: Description]
- Key point or instruction
- Visual cues or actions needed
- Timing: [X:XX - X:XX]

[Scene 2: Description]
- Key point or instruction  
- Visual cues or actions needed
- Timing: [X:XX - X:XX]

[Continue with more scenes as needed]

**CONCLUSION:** [Wrap-up and key takeaways]

**CALL TO ACTION:** [What you want viewers to do next]

**TECHNICAL NOTES:**
- Estimated total duration: ${duration} minutes
- Key visual elements needed
- Any special equipment or setup requirements

Make sure to include proper line breaks, clear scene transitions, and actionable content that matches the ${tone} tone.`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 2000,
      temperature: 0.8,
      system: `You are an expert video scriptwriter specializing in creating engaging ${platform} content. Create scripts that are ${tone}, well-structured, and optimized for the ${videoType} format. Always include proper formatting with line breaks and clear sections.`
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';

    // Parse the script sections
    const scriptSections = {
      title: '',
      hook: '',
      introduction: '',
      mainContent: '',
      conclusion: '',
      callToAction: '',
      technicalNotes: '',
      fullScript: messageContent
    };

    if (messageContent) {
      // Extract title
      const titleMatch = /\*\*TITLE:\*\*\s*(.+?)(?=\n|$)/i.exec(messageContent);
      if (titleMatch?.[1]) scriptSections.title = titleMatch[1].trim();

      // Extract hook
      const hookMatch = /\*\*HOOK:\*\*\s*(.*?)(?=\*\*[A-Z]+:|$)/s.exec(messageContent);
      if (hookMatch?.[1]) scriptSections.hook = hookMatch[1].trim();

      // Extract introduction
      const introMatch = /\*\*INTRODUCTION:\*\*\s*(.*?)(?=\*\*[A-Z\s]+:|$)/s.exec(messageContent);
      if (introMatch?.[1]) scriptSections.introduction = introMatch[1].trim();

      // Extract main content
      const mainMatch = /\*\*MAIN CONTENT:\*\*\s*(.*?)(?=\*\*[A-Z\s]+:|$)/s.exec(messageContent);
      if (mainMatch?.[1]) scriptSections.mainContent = mainMatch[1].trim();

      // Extract conclusion
      const conclusionMatch = /\*\*CONCLUSION:\*\*\s*(.*?)(?=\*\*[A-Z\s]+:|$)/s.exec(messageContent);
      if (conclusionMatch?.[1]) scriptSections.conclusion = conclusionMatch[1].trim();

      // Extract call to action
      const ctaMatch = /\*\*CALL TO ACTION:\*\*\s*(.*?)(?=\*\*[A-Z\s]+:|$)/s.exec(messageContent);
      if (ctaMatch?.[1]) scriptSections.callToAction = ctaMatch[1].trim();

      // Extract technical notes
      const notesMatch = /\*\*TECHNICAL NOTES:\*\*\s*(.*?)(?=\*\*[A-Z\s]+:|$)/s.exec(messageContent);
      if (notesMatch?.[1]) scriptSections.technicalNotes = notesMatch[1].trim();
    }

    return NextResponse.json({
      script: scriptSections,
      topic,
      videoType,
      duration,
      tone,
      platform,
      estimatedReadingTime: Math.ceil(messageContent.length / 200) // Rough estimate: 200 chars per minute
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    let errorMessage = 'Failed to generate video script';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 