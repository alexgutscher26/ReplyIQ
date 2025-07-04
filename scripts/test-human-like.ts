import { HumanLikeModelWrapper } from '../src/server/ai/human-like-wrapper';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Please set the OPENAI_API_KEY environment variable');
    process.exit(1);
  }

  // Create the base model
  const openai = createOpenAI({ apiKey });
  const baseModel = openai('gpt-4o-mini');

  // Create the human-like wrapper
  const humanLikeModel = new HumanLikeModelWrapper(baseModel, {
    temperature: 0.8,
    topP: 0.9,
    addFillerWords: true,
    addGrammaticalVariations: true,
    addPauses: true,
  });

  // Test prompt
  const prompt = 'Tell me a short story about a robot learning to be human';
  
  console.log('Generating response with standard model...');
  const { text: standardResponse } = await generateText({
    model: baseModel,
    prompt,
    maxTokens: 200,
  });
  
  console.log('\n=== Standard Model Response ===');
  console.log(standardResponse);
  
  console.log('\nGenerating response with human-like model...');
  const humanLikeResponse = await humanLikeModel.generateText(prompt, { maxTokens: 200 });
  
  console.log('\n=== Human-like Model Response ===');
  console.log(humanLikeResponse);
  
  // Compare the responses
  console.log('\n=== Comparison ===');
  console.log(`Standard response length: ${standardResponse.length} characters`);
  console.log(`Human-like response length: ${humanLikeResponse.length} characters`);
  
  // Check for human-like features
  const fillerWords = ['um', 'uh', 'like', 'you know', 'I mean', 'sort of', 'kind of'];
  const hasFillerWords = fillerWords.some(word => humanLikeResponse.toLowerCase().includes(word));
  const hasPauses = humanLikeResponse.includes('...') || humanLikeResponse.includes('--');
  
  console.log('\nHuman-like features detected:');
  console.log(`- Filler words: ${hasFillerWords ? '✅' : '❌'}`);
  console.log(`- Natural pauses: ${hasPauses ? '✅' : '❌'}`);
}

main().catch(console.error);
