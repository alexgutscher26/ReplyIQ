import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { getAIInstance } from '@/server/utils'
import { db } from '@/server/db'

const schema = z.object({
  text: z.string().min(1, 'Text is required'),
})

// Common emoji categories for fallback
const EMOJI_CATEGORIES = {
  positive: ['😊', '😄', '🎉', '👍', '❤️', '✨', '🌟', '🔥'],
  negative: ['😔', '😢', '💔', '😰', '😤', '😠', '🤔', '😕'],
  work: ['💼', '📊', '💻', '📝', '⏰', '🎯', '📈', '💡'],
  food: ['🍕', '🍔', '🍰', '☕', '🍜', '🥗', '🍎', '🥳'],
  travel: ['✈️', '🏖️', '🗺️', '📸', '🎒', '🚗', '🏨', '🌍'],
  celebration: ['🎉', '🎊', '🥳', '🎁', '🎂', '🍾', '🎈', '🏆'],
  nature: ['🌳', '🌸', '🌞', '🌙', '⭐', '🌈', '🦋', '🌊'],
  sports: ['⚽', '🏀', '🎾', '🏈', '⚾', '🏆', '🥇', '💪'],
  learning: ['📚', '🎓', '📖', '✏️', '🧠', '💡', '📝', '🔬'],
  social: ['👥', '💬', '📱', '👋', '🤝', '💕', '👫', '🎭']
}

function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
  
  return [...new Set(words)] // Remove duplicates
}

function getContextualEmojis(text: string): string[] {
  const lowerText = text.toLowerCase()
  const keywords = extractKeywords(text)
  let contextEmojis: string[] = []

  // Check for specific contexts
  const contexts = {
    positive: ['happy', 'good', 'great', 'awesome', 'amazing', 'love', 'excited', 'wonderful', 'perfect', 'best'],
    negative: ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'disappointed', 'worried'],
    work: ['work', 'job', 'meeting', 'project', 'deadline', 'business', 'office', 'team', 'client', 'task'],
    food: ['food', 'eat', 'hungry', 'dinner', 'lunch', 'breakfast', 'cook', 'restaurant', 'delicious'],
    travel: ['travel', 'trip', 'vacation', 'holiday', 'flight', 'hotel', 'beach', 'adventure', 'explore'],
    celebration: ['party', 'birthday', 'celebration', 'congratulations', 'achievement', 'success', 'win'],
    nature: ['nature', 'tree', 'flower', 'sun', 'moon', 'star', 'garden', 'park', 'outside'],
    sports: ['sport', 'game', 'play', 'football', 'basketball', 'tennis', 'exercise', 'gym', 'fitness'],
    learning: ['learn', 'study', 'school', 'university', 'book', 'read', 'education', 'knowledge'],
    social: ['friend', 'family', 'people', 'together', 'chat', 'talk', 'social', 'community']
  }

  // Find matching contexts
  for (const [category, categoryKeywords] of Object.entries(contexts)) {
    const hasMatch = categoryKeywords.some(keyword => 
      lowerText.includes(keyword) || keywords.includes(keyword)
    )
    if (hasMatch && EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES]) {
      contextEmojis.push(...EMOJI_CATEGORIES[category as keyof typeof EMOJI_CATEGORIES])
    }
  }

  // If no specific context found, use general positive emojis
  if (contextEmojis.length === 0) {
    contextEmojis = EMOJI_CATEGORIES.positive
  }

  return [...new Set(contextEmojis)].slice(0, 6) // Remove duplicates and limit to 6
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const { text } = schema.parse(body)

    // Get contextual fallback emojis first
    const contextualEmojis = getContextualEmojis(text)

    // Fetch AI settings from DB
    const settings = await db.query.settings.findFirst()
    const ai = settings?.general?.ai
    const enabledModels = ai?.enabledModels ?? ['gpt-3.5-turbo']
    const apiKey = ai?.apiKey ?? process.env.OPENAI_API_KEY ?? ''

    if (!apiKey) {
      // Return contextual emojis if no AI configured
      return NextResponse.json({ emojis: contextualEmojis })
    }

    try {
      const { instance } = await getAIInstance({
        apiKey,
        enabledModels,
      })

      const prompt = `Analyze this text and suggest 6-8 relevant emojis that would enhance the message. Consider:
- The emotion/sentiment expressed
- The topic or subject matter  
- The context and tone
- Cultural appropriateness

Text: "${text}"

Return only the emoji characters separated by single spaces, no explanations, no other text, no punctuation.
Example format: 😊 🎉 👍 ❤️ ✨ 🌟`
      
      const result = await generateText({
        model: instance,
        prompt,
        maxTokens: 50,
        temperature: 0.7,
        system: 'You are an emoji suggestion expert. Always respond with only emoji characters separated by spaces.',
      })

      const messageContent = typeof result.text === 'string' ? result.text : ''

      // Extract emojis from the response
      let emojis: string[] = []
      if (typeof messageContent === 'string') {
        // Split by spaces and filter for actual emojis (Unicode characters)
        emojis = messageContent
          .split(/\s+/)
          .filter((char) => {
            // Check if character is an emoji using Unicode ranges
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]/u
            return emojiRegex.test(char) && char.length <= 4
          })
          .slice(0, 8) // Limit to 8 emojis max
      }

      // If AI didn't return good emojis, use contextual fallback
      if (emojis.length === 0) {
        emojis = contextualEmojis
      }

      return NextResponse.json({ emojis })
    }
    catch (aiError) {
      console.warn('AI emoji generation failed, using contextual fallback:', aiError)
      // Return contextual emojis as fallback
      return NextResponse.json({ emojis: contextualEmojis })
    }
  }
  catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    let errorMessage = 'Failed to generate emoji suggestions'
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message?: unknown }).message === 'string') {
      errorMessage = (error as { message: string }).message
    }
    console.error('Emoji API error:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 