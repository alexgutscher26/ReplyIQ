import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const schema = z.object({
  content: z.string().min(5, 'Content is too short'),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { content } = schema.parse(body);

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const prompt = `Generate 5 relevant and trending hashtags for the following social media post. Only return the hashtags, separated by spaces.\n\nPost: ${content}`;
    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 60,
      temperature: 0.7,
      system: 'You are a helpful social media assistant.'
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';

    // Extract hashtags (words starting with #)
    let hashtags: string[] = [];
    if (typeof messageContent === 'string') {
      const match = messageContent.match(/#\w+/g);
      if (match && Array.isArray(match)) {
        hashtags = match;
      } else {
        hashtags = messageContent
          .split(/\s+/)
          .filter((tag) => tag.startsWith('#'));
      }
    }

    return NextResponse.json({ hashtags });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    let errorMessage = 'Failed to generate hashtags';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 