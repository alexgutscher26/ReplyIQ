import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { 
  brandVoices, 
  brandVoiceTrainingData, 
  brandVoiceGenerations,
  type IndustryKey,
  type ContentTypeKey,
  INDUSTRIES,
  CONTENT_TYPES
} from "@/server/db/schema/brand-voice-schema";
import { TRPCError } from "@trpc/server";
import { and, eq, desc, count, sql } from "drizzle-orm";
import { z } from "zod";
import { generateText } from "ai";
import { getAIInstance } from "@/server/utils";

export const brandVoiceRouter = createTRPCRouter({
  // Create a new brand voice profile
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required").max(100),
        description: z.string().optional(),
        industry: z.string().refine((val): val is IndustryKey => val in INDUSTRIES, {
          message: "Invalid industry",
        }),
        toneAttributes: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [brandVoice] = await ctx.db.insert(brandVoices).values({
          userId: ctx.session.user.id,
          name: input.name,
          description: input.description,
          industry: input.industry,
          toneAttributes: input.toneAttributes,
          trainingStatus: "draft",
          isActive: true,
        }).returning();

        return brandVoice;
          } catch {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create brand voice",
      });
    }
    }),

  // Get all brand voices for current user
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const voices = await ctx.db.query.brandVoices.findMany({
        where: eq(brandVoices.userId, ctx.session.user.id),
        orderBy: [desc(brandVoices.createdAt)],
        with: {
          trainingData: {
            limit: 5,
            orderBy: [desc(brandVoiceTrainingData.createdAt)],
          },
        },
      });

      return voices.map(voice => ({
        ...voice,
        industryName: INDUSTRIES[voice.industry as IndustryKey] ?? voice.industry,
        trainingDataCount: voice.trainingData.length,
      }));
    }),

  // Get single brand voice by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.id),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
        with: {
          trainingData: {
            orderBy: [desc(brandVoiceTrainingData.createdAt)],
          },
          generations: {
            limit: 10,
            orderBy: [desc(brandVoiceGenerations.createdAt)],
          },
        },
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      return {
        ...voice,
        industryName: INDUSTRIES[voice.industry as IndustryKey] ?? voice.industry,
      };
    }),

  // Add training data to a brand voice
  addTrainingData: protectedProcedure
    .input(
      z.object({
        brandVoiceId: z.string().uuid(),
        contentType: z.string().refine((val): val is ContentTypeKey => val in CONTENT_TYPES, {
          message: "Invalid content type",
        }),
        title: z.string().optional(),
        content: z.string().min(10, "Content must be at least 10 characters"),
        platform: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.brandVoiceId),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      const wordCount = input.content.split(/\s+/).length;

      const [trainingData] = await ctx.db.insert(brandVoiceTrainingData).values({
        brandVoiceId: input.brandVoiceId,
        contentType: input.contentType,
        title: input.title,
        content: input.content,
        platform: input.platform,
        metadata: input.metadata,
        wordCount,
        isProcessed: false,
      }).returning();

      return trainingData;
    }),

  // Analyze and train brand voice
  trainBrandVoice: protectedProcedure
    .input(z.object({ brandVoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.brandVoiceId),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
        with: {
          trainingData: true,
        },
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      if (voice.trainingData.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least 3 training examples are required",
        });
      }

      // Update status to analyzing
      await ctx.db.update(brandVoices)
        .set({ 
          trainingStatus: "analyzing",
          trainingProgress: 10,
          updatedAt: new Date(),
        })
        .where(eq(brandVoices.id, input.brandVoiceId));

      try {
        const settings = await ctx.db.query.settings.findFirst();
        const ai = settings?.general?.ai;
        const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
        const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

        const { instance } = await getAIInstance({
          apiKey,
          enabledModels,
        });

        // Combine all training content
        const allContent = voice.trainingData.map(data => data.content).join('\n\n---\n\n');

        const analysisPrompt = `Analyze the following brand content to extract the brand voice characteristics:

${allContent}

Please provide a comprehensive brand voice analysis in JSON format with the following structure:
{
  "writingStyle": {
    "sentenceLength": "short/medium/long/varied",
    "complexity": "simple/moderate/complex",
    "formality": "casual/professional/formal",
    "perspective": "first-person/second-person/third-person/mixed"
  },
  "toneAttributes": ["friendly", "professional", "enthusiastic", "authoritative", "etc"],
  "vocabulary": {
    "commonWords": ["word1", "word2", "etc"],
    "technicalTerms": ["term1", "term2", "etc"],
    "brandSpecificTerms": ["brand1", "brand2", "etc"]
  },
  "brandPersonality": {
    "traits": ["innovative", "trustworthy", "approachable", "etc"],
    "communication": "direct/indirect/storytelling/etc",
    "emotion": "warm/neutral/energetic/etc"
  },
  "contentPatterns": {
    "openingStyles": ["example1", "example2"],
    "closingStyles": ["example1", "example2"],
    "callToActions": ["example1", "example2"]
  }
}

Focus on identifying distinctive patterns, tone, vocabulary, and stylistic elements that make this brand voice unique.`;

        const result = await generateText({
          model: instance,
          prompt: analysisPrompt,
          maxTokens: 2000,
          temperature: 0.3,
          system: "You are an expert brand voice analyst. Analyze the provided content and extract detailed characteristics about the brand's communication style, tone, and personality."
        });

        // Update progress
        await ctx.db.update(brandVoices)
          .set({ trainingProgress: 70 })
          .where(eq(brandVoices.id, input.brandVoiceId));

        interface AnalysisResults {
          writingStyle?: {
            formality?: string;
            complexity?: string;
          };
          toneAttributes?: string[];
          vocabulary?: {
            commonWords?: string[];
            technicalTerms?: string[];
            brandSpecificTerms?: string[];
          };
          brandPersonality?: {
            traits?: string[];
            communication?: string;
          };
          contentPatterns?: {
            openingStyles?: string[];
            closingStyles?: string[];
            callToActions?: string[];
          };
        }

        let analysisResults: AnalysisResults;
        try {
          // Try to parse JSON from the response
          const jsonRegex = /\{[\s\S]*\}/;
          const jsonMatch = jsonRegex.exec(result.text);
          if (jsonMatch?.[0]) {
            analysisResults = JSON.parse(jsonMatch[0]) as AnalysisResults;
          } else {
            // Fallback to basic analysis
            analysisResults = {
              writingStyle: { formality: "professional", complexity: "moderate" },
              toneAttributes: ["professional", "clear"],
              vocabulary: { commonWords: [], technicalTerms: [], brandSpecificTerms: [] },
              brandPersonality: { traits: ["professional"], communication: "direct" },
              contentPatterns: { openingStyles: [], closingStyles: [], callToActions: [] }
            };
          }
        } catch {
          // Fallback analysis
          analysisResults = {
            writingStyle: { formality: "professional", complexity: "moderate" },
            toneAttributes: ["professional", "clear"],
            vocabulary: { commonWords: [], technicalTerms: [], brandSpecificTerms: [] },
            brandPersonality: { traits: ["professional"], communication: "direct" },
            contentPatterns: { openingStyles: [], closingStyles: [], callToActions: [] }
          };
        }

        // Update brand voice with analysis results
        await ctx.db.update(brandVoices)
          .set({
            trainingStatus: "trained",
            trainingProgress: 100,
            analysisResults,
            writingStyle: analysisResults.writingStyle ?? null,
            vocabulary: analysisResults.vocabulary ?? null,
            brandPersonality: analysisResults.brandPersonality ?? null,
            toneAttributes: analysisResults.toneAttributes ?? null,
            lastTrainingAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(brandVoices.id, input.brandVoiceId));

        // Mark training data as processed
        await ctx.db.update(brandVoiceTrainingData)
          .set({ isProcessed: true })
          .where(eq(brandVoiceTrainingData.brandVoiceId, input.brandVoiceId));

        return { success: true, analysisResults };
      } catch {
        // Update status to error
        await ctx.db.update(brandVoices)
          .set({ 
            trainingStatus: "error",
            updatedAt: new Date(),
          })
          .where(eq(brandVoices.id, input.brandVoiceId));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to analyze brand voice",
        });
      }
    }),

  // Generate content using brand voice
  generateContent: protectedProcedure
    .input(
      z.object({
        brandVoiceId: z.string().uuid(),
        prompt: z.string().min(1, "Prompt is required"),
        contentType: z.string().optional(),
        platform: z.string().optional(),
        maxLength: z.number().min(50).max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.brandVoiceId),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      if (voice.trainingStatus !== "trained") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Brand voice must be trained before generating content",
        });
      }

      const settings = await ctx.db.query.settings.findFirst();
      const ai = settings?.general?.ai;
      const enabledModels = ai?.enabledModels ?? ['gpt-4o-mini'];
      const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? '';

      const { instance } = await getAIInstance({
        apiKey,
        enabledModels,
      });

      // Build brand voice prompt
      const brandVoicePrompt = `Generate content using the following brand voice profile:

Brand: ${voice.name}
Industry: ${INDUSTRIES[voice.industry as IndustryKey] ?? voice.industry}
${voice.description ? `Description: ${voice.description}` : ''}

Writing Style:
${voice.writingStyle ? JSON.stringify(voice.writingStyle, null, 2) : 'Professional and clear'}

Brand Personality:
${voice.brandPersonality ? JSON.stringify(voice.brandPersonality, null, 2) : 'Professional and trustworthy'}

Tone Attributes: ${Array.isArray(voice.toneAttributes) ? voice.toneAttributes.join(', ') : 'Professional, clear'}

Content Request: ${input.prompt}
${input.contentType ? `Content Type: ${CONTENT_TYPES[input.contentType as ContentTypeKey] ?? input.contentType}` : ''}
${input.platform ? `Platform: ${input.platform}` : ''}
${input.maxLength ? `Max Length: ${input.maxLength} characters` : ''}

Generate content that perfectly matches this brand voice, maintaining consistency with the established tone, style, and personality traits.`;

      const startTime = Date.now();
      const result = await generateText({
        model: instance,
        prompt: brandVoicePrompt,
        maxTokens: Math.min(Math.floor((input.maxLength ?? 1000) / 2), 1500),
        temperature: 0.7,
        system: `You are a professional content creator specializing in brand voice consistency. Create content that perfectly matches the provided brand voice profile.`
      });

      const generationTime = Date.now() - startTime;

      // Save generation
      const [generation] = await ctx.db.insert(brandVoiceGenerations).values({
        userId: ctx.session.user.id,
        brandVoiceId: input.brandVoiceId,
        prompt: input.prompt,
        generatedContent: result.text,
        contentType: input.contentType,
        platform: input.platform,
        metadata: {
          maxLength: input.maxLength,
          actualLength: result.text.length,
        },
        tokensUsed: result.usage?.totalTokens,
        generationTime,
      }).returning();

      return generation;
    }),

  // Update brand voice
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().optional(),
        industry: z.string().refine((val): val is IndustryKey => val in INDUSTRIES).optional(),
        toneAttributes: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify ownership
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, id),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      const [updatedVoice] = await ctx.db.update(brandVoices)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(brandVoices.id, id))
        .returning();

      return updatedVoice;
    }),

  // Delete brand voice
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.id),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      await ctx.db.delete(brandVoices).where(eq(brandVoices.id, input.id));

      return { success: true };
    }),

  // Get brand voice analytics
  getAnalytics: protectedProcedure
    .input(z.object({ brandVoiceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const voice = await ctx.db.query.brandVoices.findFirst({
        where: and(
          eq(brandVoices.id, input.brandVoiceId),
          eq(brandVoices.userId, ctx.session.user.id)
        ),
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand voice not found",
        });
      }

      const [
        totalGenerations,
        trainingDataCount,
        avgQualityScore,
        recentGenerations,
      ] = await Promise.all([
        ctx.db.select({ count: count() })
          .from(brandVoiceGenerations)
          .where(eq(brandVoiceGenerations.brandVoiceId, input.brandVoiceId)),
        ctx.db.select({ count: count() })
          .from(brandVoiceTrainingData)
          .where(eq(brandVoiceTrainingData.brandVoiceId, input.brandVoiceId)),
        ctx.db.select({ avg: sql<number>`avg(${brandVoiceGenerations.qualityScore})` })
          .from(brandVoiceGenerations)
          .where(and(
            eq(brandVoiceGenerations.brandVoiceId, input.brandVoiceId),
            sql`${brandVoiceGenerations.qualityScore} IS NOT NULL`
          )),
        ctx.db.select()
          .from(brandVoiceGenerations)
          .where(eq(brandVoiceGenerations.brandVoiceId, input.brandVoiceId))
          .orderBy(desc(brandVoiceGenerations.createdAt))
          .limit(5),
      ]);

      return {
        totalGenerations: totalGenerations[0]?.count ?? 0,
        trainingDataCount: trainingDataCount[0]?.count ?? 0,
        avgQualityScore: avgQualityScore[0]?.avg ?? null,
        recentGenerations,
        voice,
      };
    }),

  // Get available options for forms
  getOptions: protectedProcedure
    .query(() => {
      return {
        industries: INDUSTRIES,
        contentTypes: CONTENT_TYPES,
      };
    }),
}); 