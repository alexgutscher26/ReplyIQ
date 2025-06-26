import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';

const schema = z.object({
  topic: z.string().min(3, 'Topic is too short'),
  platform: z.enum(['twitter', 'linkedin']),
  threadLength: z.number().min(2).max(20).default(5),
  postLength: z.enum(['short', 'medium', 'long', 'x-pro']).default('short'),
  tone: z.enum(['professional', 'casual', 'informative', 'engaging', 'humorous']).default('engaging'),
});

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { topic, platform, threadLength, postLength, tone } = schema.parse(body);

    console.log('Thread generation request:', { topic, platform, threadLength, postLength, tone });

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst();
    const ai = settings?.general?.ai;
    const enabledModels = ai?.enabledModels ?? ['gpt-3.5-turbo'];
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

    const { instance } = await getAIInstance({
      apiKey,
      enabledModels,
    });

    const postLengthInstructions = {
      'short': platform === 'twitter' ? '50-100 words (280 char limit)' : '50-100 words',
      'medium': platform === 'twitter' ? '100-150 words (X Pro: 2,200 chars)' : '100-200 words', 
      'long': platform === 'twitter' ? '200-300 words (X Pro: 4,000+ chars)' : '300-500 words',
      'x-pro': platform === 'twitter' ? '500+ words (X Pro: 25,000 chars)' : '500+ words'
    };

    const platformSpecificInstructions = platform === 'twitter' 
      ? `Create posts for Twitter/X with ${postLengthInstructions[postLength]}. Use engaging language and appropriate emojis. ${postLength !== 'short' ? 'This is for X Pro users with extended character limits.' : 'Standard Twitter character limits apply.'}`
      : `Write professional posts for LinkedIn with ${postLengthInstructions[postLength]}. Focus on value and insights. Use appropriate formatting.`;

    const prompt = `Create EXACTLY ${threadLength} posts for a thread about "${topic}" for ${platform}. 

CRITICAL: You must create exactly ${threadLength} numbered posts. No more, no less.

Platform-specific guidelines:
${platformSpecificInstructions}

Tone: ${tone}

Format your response as a numbered list where each number represents a separate post in the thread. Create posts numbered 1 through ${threadLength}:

1. [First post content with proper paragraph breaks]

2. [Second post content with proper paragraph breaks]

3. [Third post content with proper paragraph breaks]

${threadLength > 3 ? `...continue until post ${threadLength}` : ''}

IMPORTANT: Create EXACTLY ${threadLength} posts numbered 1, 2, 3, ${threadLength > 3 ? `...${threadLength}` : ''}

Formatting guidelines:
- Each post should be approximately ${postLengthInstructions[postLength]}
- Use double line breaks (paragraph breaks) between different ideas within posts, just like real social media posts
- Each post should be engaging and standalone
- Include proper spacing between paragraphs for readability
- Use emojis appropriately for ${platform}
- ${postLength === 'short' ? 'Keep posts concise and punchy' : postLength === 'x-pro' ? 'Take advantage of extended character limits for detailed, comprehensive content' : 'Balance detail with readability'}
- Format posts exactly like you would see them on the actual platform

Example formatting for a post:
"This is the first paragraph of my post.

This is the second paragraph with proper spacing.

Maybe a third point with an emoji 🚀"

Remember: Create EXACTLY ${threadLength} posts, no more, no less.`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 1500,
      temperature: 0.8,
      system: `You are an expert social media content creator specializing in creating engaging ${platform} threads. Create content that is ${tone}, valuable, and platform-appropriate.`
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';

    console.log('AI Response:', messageContent);

    // Parse the thread posts from the AI response
    const threadPosts: string[] = [];
    if (messageContent) {
      const lines = messageContent.split('\n');
      let currentPost = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (/^\d+\./.test(trimmedLine)) {
          // New numbered post
          if (currentPost) {
            threadPosts.push(currentPost.trim());
          }
          currentPost = trimmedLine.replace(/^\d+\.\s*/, '');
        } else if (currentPost !== '') {
          // Continuation of current post - preserve paragraph breaks
          if (trimmedLine === '') {
            // Empty line - add paragraph break
            if (!currentPost.endsWith('\n\n')) {
              currentPost += '\n\n';
            }
          } else {
            // Non-empty line - add with proper spacing
            if (currentPost.endsWith('\n\n')) {
              currentPost += trimmedLine;
            } else if (currentPost === trimmedLine.replace(/^\d+\.\s*/, '')) {
              currentPost += trimmedLine;
            } else {
              currentPost += '\n\n' + trimmedLine;
            }
          }
        }
      }
      
      // Add the last post
      if (currentPost) {
        threadPosts.push(currentPost.trim());
      }
    }

    console.log(`Parsed ${threadPosts.length} posts (requested: ${threadLength})`);

    return NextResponse.json({ 
      thread: threadPosts,
      topic,
      platform,
      threadLength,
      postLength,
      tone,
      totalPosts: threadPosts.length
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    let errorMessage = 'Failed to generate thread';
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 