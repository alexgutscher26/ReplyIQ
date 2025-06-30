/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';
import { getAIInstance } from '@/server/utils';
import { db } from '@/server/db';
import { auth } from '@/server/auth';
import { trackToolUsageServer } from '@/utils/track-tool-usage';
import { brandVoices } from '@/server/db/schema/brand-voice-schema';
import { eq } from 'drizzle-orm';
import { ratelimit } from '@/server/utils/ratelimit';

// Enhanced schema with new features
const schema = z.object({
  topic: z.string().min(3, 'Topic is too short').max(200, 'Topic is too long'),
  videoType: z.enum(['educational', 'promotional', 'entertainment', 'tutorial', 'explainer']),
  duration: z.number().min(1).max(60).default(5), // Duration in minutes
  tone: z.enum(['professional', 'casual', 'energetic', 'calm', 'humorous']).default('professional'),
  platform: z.enum(['youtube', 'tiktok', 'instagram', 'general']).default('youtube'),
  targetAudience: z.string().optional(),
  keywords: z.string().optional(),
  includeHook: z.boolean().default(true),
  includeCTA: z.boolean().default(true),
});

// Content templates for faster generation
const contentTemplates = {
  viral_tiktok: {
    structure: "Hook (3s) → Problem/Trend (10s) → Solution/Revelation (30s) → CTA (5s)",
    hooks: ["Wait, this actually works...", "Nobody talks about this but...", "I tried this for 30 days and..."],
    engagement: ["Pattern interrupt", "Trend hijacking", "Controversy"]
  },
  youtube_tutorial: {
    structure: "Introduction (30s) → What You'll Learn (1min) → Step-by-Step (80%) → Recap (2min) → CTA (30s)",
    hooks: ["In this video, you'll learn...", "By the end of this tutorial...", "I'm going to show you exactly how..."],
    engagement: ["Clear value proposition", "Progress indicators", "Actionable steps"]
  },
  instagram_story: {
    structure: "Visual Hook (2s) → Problem/Question (8s) → Solution/Answer (30s) → CTA/Follow (5s)",
    hooks: ["Swipe to see...", "This changed everything...", "You need to try this..."],
    engagement: ["Interactive stickers", "Visual storytelling", "Story highlights"]
  }
};

// Language-specific optimizations with proper typing
type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'ru';

const languageOptimizations: Record<SupportedLanguage, { culturalContext: string; trending: string[] }> = {
  en: { culturalContext: "American/British context", trending: ["viral", "trending", "must-see"] },
  es: { culturalContext: "Hispanic/Latino context", trending: ["viral", "tendencia", "imperdible"] },
  fr: { culturalContext: "French/Francophone context", trending: ["viral", "tendance", "incontournable"] },
  de: { culturalContext: "German/DACH context", trending: ["viral", "trend", "sehenswert"] },
  it: { culturalContext: "Italian context", trending: ["virale", "tendenza", "da vedere"] },
  pt: { culturalContext: "Portuguese/Brazilian context", trending: ["viral", "tendência", "imperdível"] },
  ja: { culturalContext: "Japanese context", trending: ["バイラル", "トレンド", "必見"] },
  ko: { culturalContext: "Korean context", trending: ["바이럴", "트렌드", "필수시청"] },
  zh: { culturalContext: "Chinese context", trending: ["病毒式", "趋势", "必看"] },
  ar: { culturalContext: "Arabic/Middle Eastern context", trending: ["فيروسي", "رائج", "لا يفوت"] },
  hi: { culturalContext: "Indian/Hindi context", trending: ["वायरल", "ट्रेंडिंग", "जरूर देखें"] },
  ru: { culturalContext: "Russian context", trending: ["вирусный", "тренд", "обязательно"] }
};

// Cache for frequently requested scripts (in production, use Redis)
const scriptCache = new Map<string, { data: any; timestamp: number; expiresAt: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Type-safe user access
    const userId = session.user.id;
    const userLanguage: SupportedLanguage = 'en'; // Default to English for now

    // Rate limiting
    const { success, limit, reset, remaining } = await ratelimit.check(userId);
    
    if (!success) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        limit,
        reset: new Date(reset),
        remaining
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      });
    }

    const body: unknown = await req.json();
    const { topic, videoType, duration, tone, platform, targetAudience, keywords, includeHook, includeCTA } = schema.parse(body);

    // Generate cache key with proper language handling
    const cacheKey = JSON.stringify({
      topic,
      videoType,
      duration,
      tone,
      platform,
      targetAudience,
      keywords,
      culturalContext: languageOptimizations[userLanguage].culturalContext,
      brandVoiceId: null,
      templateId: null,
      contentGuidelines: null
    });

    // Check cache first
    const cached = scriptCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // Track usage for cached response
      await trackToolUsageServer(db, userId, 'video-script-generator', {
        cached: true,
        platform,
        videoType,
        duration,
        language: userLanguage
      });
      
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheTimestamp: cached.timestamp
      });
    }

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
      youtube: `YouTube Optimization:
- Create a compelling hook in the first 15 seconds to beat the algorithm
- Structure for 8-second attention spans with pattern interrupts every 30 seconds
- Include clear verbal and visual CTAs throughout
- Use the "PPP" framework (Preview, Proof, Payoff)
- Add timestamp suggestions for chapters
- Include scene descriptions with visual elements
- Optimize for watch time and engagement metrics
- Suggest thumbnail-worthy moments`,

      tiktok: `TikTok Optimization:
- Start with a pattern interrupt or hook within 3 seconds
- Use trending audio/music suggestions when relevant
- Include jump cuts and quick transitions (every 2-3 seconds)
- Leverage current trends and hashtag opportunities
- Create scroll-stopping moments throughout
- Include text overlay suggestions for key points
- Use the "Problem-Agitation-Solution" structure
- End with a strong hook for the next video`,

      instagram: `Instagram Optimization:
- Design for vertical viewing with strong visual storytelling
- Include caption-worthy quotes and key takeaways
- Suggest relevant hashtags and emoji usage
- Create shareable moments for Stories
- Use the "AIDA" framework (Attention, Interest, Desire, Action)
- Include interactive elements (polls, questions, challenges)
- Optimize for saves and shares
- Create aesthetically pleasing visual sequences`,

      general: `Multi-Platform Optimization:
- Create adaptable content that works across platforms
- Focus on universal engagement principles
- Include flexible timing for different formats
- Use platform-agnostic storytelling techniques
- Provide format variations and adaptation notes`
    };

    const videoTypeInstructions = {
      educational: `Educational Content Framework:
- Use the "LEARN" model: Lead with curiosity, Explain simply, Apply examples, Reinforce key points, Next steps
- Include "aha moments" and knowledge gaps
- Use analogies and metaphors for complex concepts
- Add interactive elements and knowledge checks
- Create memorable acronyms or frameworks
- Include common misconceptions to address`,

      promotional: `Promotional Content Framework:
- Use the "PASTOR" framework: Problem, Amplify, Story/Solution, Transformation, Offer, Response
- Include social proof and credibility markers
- Create urgency and scarcity when appropriate
- Use emotional triggers and benefits-focused language
- Include objection handling and risk reversal
- Add testimonial integration opportunities`,

      entertainment: `Entertainment Content Framework:
- Use story arcs with setup, conflict, and resolution
- Include comedic timing and punchline placement
- Create relatable situations and characters
- Use surprise elements and plot twists
- Include callback references and running gags
- Focus on emotional connection and shareability`,

      tutorial: `Tutorial Content Framework:
- Use the "SHOW" method: Setup, How-to steps, Outcome demonstration, Wrap-up
- Include progress indicators and milestone celebrations
- Add troubleshooting sections for common issues
- Use clear, actionable language with specific steps
- Include before/after comparisons
- Provide alternative methods when relevant`,

      explainer: `Explainer Content Framework:
- Use the "SIMPLE" approach: Scenario, Issue, Method, Process, Logic, Evaluation
- Break complex topics into digestible chunks
- Use visual metaphors and real-world examples
- Include "why this matters" moments
- Add perspective from different viewpoints
- Connect to broader implications and applications`
    };

    const toneInstructions = {
      professional: `Professional Tone Guidelines:
- Use authoritative but approachable language
- Include industry-specific terminology when appropriate
- Maintain credibility with fact-based statements
- Use confident, declarative sentences
- Include expertise indicators and credentials mentions
- Balance formality with accessibility`,

      casual: `Casual Tone Guidelines:
- Use conversational, friend-to-friend language
- Include personal anecdotes and relatable examples
- Use contractions and everyday expressions
- Create an intimate, one-on-one feeling
- Include humor and personality quirks
- Make complex topics feel approachable`,

      energetic: `Energetic Tone Guidelines:
- Use dynamic, action-oriented language
- Include excitement markers and power words
- Create momentum with short, punchy sentences
- Use superlatives and intensity modifiers
- Include motivational elements and calls to action
- Maintain high energy throughout without overwhelming`,

      calm: `Calm Tone Guidelines:
- Use soothing, reassuring language
- Include mindful pauses and breathing moments
- Create a peaceful, stress-free atmosphere
- Use gentle, flowing sentence structures
- Include grounding elements and comfort words
- Maintain steady pacing without rushing`,

      humorous: `Humorous Tone Guidelines:
- Include well-timed jokes and witty observations
- Use playful language and unexpected comparisons
- Create comedic relief at strategic points
- Include self-deprecating humor when appropriate
- Use observational comedy and relatable situations
- Balance humor with valuable content delivery`
    };

    const audienceString = targetAudience ? `\nTarget Audience: ${targetAudience}` : '';
    const keywordsString = keywords ? `\nFocus Keywords: ${keywords}` : '';

    const prompt = `Create a highly engaging ${duration}-minute ${videoType} video script about "${topic}" for ${platform}.
    
${audienceString}${keywordsString}

CONTENT FRAMEWORK:
${videoTypeInstructions[videoType]}

PLATFORM STRATEGY:
${platformSpecificInstructions[platform]}

TONE EXECUTION:
${toneInstructions[tone]}

ENGAGEMENT TECHNIQUES TO INCLUDE:
- Pattern interrupts every 20-30 seconds
- Open loops and curiosity gaps
- Social proof and authority markers
- Emotional triggers and storytelling elements
- Interactive moments and audience engagement
- Memorable quotes and key takeaways
- Visual and auditory cues for emphasis

PSYCHOLOGICAL TRIGGERS:
- Reciprocity (give value first)
- Social proof (others are doing this)
- Authority (credible sources/expertise)
- Consistency (align with audience values)
- Liking (relatable and personable)
- Scarcity (limited time/availability when relevant)

FORMAT REQUIREMENTS:

**TITLE:** [Create 3 title options with power words and emotional triggers]

${includeHook ? `**HOOK:** [First 3-15 seconds - create immediate curiosity, pattern interrupt, or bold statement. Include specific timing and visual cues]` : ''}

**INTRODUCTION:** [Establish credibility, preview value, and create investment in watching. Include audience connection points]

**MAIN CONTENT:**
[Scene 1: Opening Engagement]
- Content: [Specific talking points with emotional hooks]
- Visual: [Detailed visual descriptions and camera movements]
- Audio: [Music, sound effects, or audio cues]
- Timing: [0:XX - X:XX]
- Engagement: [Interactive elements, questions, or calls to engage]

[Scene 2: Value Delivery]
- Content: [Core teaching/entertainment with memorable elements]
- Visual: [Graphics, demonstrations, or visual storytelling]
- Audio: [Emphasis techniques and pacing notes]
- Timing: [X:XX - X:XX]
- Engagement: [Knowledge checks, reactions, or participation prompts]

[Continue with additional scenes based on duration, each building momentum]

**CONCLUSION:** [Powerful summary with key takeaways and emotional resonance]

${includeCTA ? `**CALL TO ACTION:** [Specific, clear action with urgency and benefit. Include multiple CTA options for different engagement levels]` : ''}

**TECHNICAL NOTES:**
- Total estimated duration: ${duration} minutes
- Key visual elements and prop requirements
- Suggested music/audio style and energy level
- Editing notes for transitions and emphasis
- Platform-specific optimization notes
- Engagement prediction and virality potential

**ENGAGEMENT OPTIMIZATION:**
- Hook strength: [Rate and explain the opening impact]
- Retention tactics: [List specific elements that maintain attention]
- Shareability factors: [Identify most quotable/shareable moments]
- Platform algorithm considerations: [Specific optimization notes]

Create content that maximizes ${platform} algorithm performance while delivering genuine value in a ${tone} manner. Focus on creating "scroll-stopping" moments and ensuring every 10-15 seconds provides new value or intrigue.`;

    const systemPrompt = `You are an elite video scriptwriter and content strategist with expertise in viral content creation, platform algorithms, and audience psychology. 

Your specialties include:
- YouTube monetization and algorithm optimization
- TikTok viral content patterns and trending strategies  
- Instagram engagement and aesthetic storytelling
- Audience psychology and behavioral triggers
- Conversion copywriting and persuasion techniques
- Entertainment industry storytelling methods

Create scripts that are:
- Algorithmically optimized for ${platform}
- Psychologically engaging with ${tone} tone
- Strategically structured for ${videoType} content
- Designed for maximum retention and engagement
- Rich in visual storytelling and production value
- Optimized for the target audience's preferences

Always include specific production notes, timing cues, and engagement optimization strategies. Your scripts should be ready for immediate production while incorporating cutting-edge content strategies.`;

    const result = await generateText({
      model: instance,
      prompt,
      maxTokens: 3000,
      temperature: 0.8,
      system: systemPrompt
    });

    const messageContent = typeof result.text === 'string' ? result.text : '';

    // Parse the script sections with improved regex patterns
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
      // Extract title (handle multiple title options)
      const titleMatch = /\*\*TITLE:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (titleMatch?.[1]) scriptSections.title = titleMatch[1].trim();

      // Extract hook
      const hookMatch = /\*\*HOOK:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (hookMatch?.[1]) scriptSections.hook = hookMatch[1].trim();

      // Extract introduction
      const introMatch = /\*\*INTRODUCTION:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (introMatch?.[1]) scriptSections.introduction = introMatch[1].trim();

      // Extract main content
      const mainMatch = /\*\*MAIN CONTENT:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (mainMatch?.[1]) scriptSections.mainContent = mainMatch[1].trim();

      // Extract conclusion
      const conclusionMatch = /\*\*CONCLUSION:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (conclusionMatch?.[1]) scriptSections.conclusion = conclusionMatch[1].trim();

      // Extract call to action
      const ctaMatch = /\*\*CALL TO ACTION:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (ctaMatch?.[1]) scriptSections.callToAction = ctaMatch[1].trim();

      // Extract technical notes
      const notesMatch = /\*\*TECHNICAL NOTES:\*\*\s*(.*?)(?=\n\*\*|\n\n|$)/s.exec(messageContent);
      if (notesMatch?.[1]) scriptSections.technicalNotes = notesMatch[1].trim();
    }

    const responseData = {
      script: scriptSections,
      topic,
      videoType,
      duration,
      tone,
      platform,
      targetAudience,
      keywords,
      estimatedReadingTime: Math.ceil(messageContent.length / 200), // Rough estimate: 200 chars per minute
      generatedAt: new Date().toISOString()
    };

    // Cache the response
    scriptCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_DURATION
    });

    // Track usage analytics
    await trackToolUsageServer(db, userId, 'video-script-generator', {
      platform,
      videoType,
      duration,
      language: userLanguage,
      brandVoiceUsed: false,
      variationsGenerated: 1,
      features: {
        streaming: false,
        seoOptimized: false,
        multiLanguage: userLanguage !== 'en',
        brandVoice: false
      }
    });

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    // Enhanced error handling
    console.error('Video script generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.errors,
        type: 'validation_error'
      }, { status: 400 });
    }

    // Handle specific AI service errors
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const errorMessage = (error as { message: string }).message;
      
      if (errorMessage.includes('rate limit')) {
        return NextResponse.json({
          error: 'AI service rate limit exceeded. Please try again later.',
          type: 'rate_limit_error',
          retryAfter: 60
        }, { status: 429 });
      }
      
      if (errorMessage.includes('quota')) {
        return NextResponse.json({
          error: 'AI service quota exceeded. Please upgrade your plan.',
          type: 'quota_error'
        }, { status: 402 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to generate video script. Please try again.',
      type: 'internal_error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}