import { HumanLikeModelWrapper } from './human-like-wrapper';
import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_PROMPT = 'Tell me a short story about a robot learning to be human';

// Helper function to test a model with the human-like wrapper
async function testHumanLikeModel({
  provider,
  modelKey,
  apiKey,
}: {
  provider: string;
  modelKey: string;
  apiKey: string;
}) {
  console.log(`\n=== Testing ${provider} (${modelKey}) with human-like wrapper ===`);
  
  // Create the base model instance
  let baseModel;
  switch (provider) {
    case 'openai':
      baseModel = createOpenAI({ apiKey })(modelKey);
      break;
    case 'mistral':
      baseModel = createMistral({ apiKey })(modelKey);
      break;
    case 'google':
      baseModel = createGoogleGenerativeAI({ apiKey })(modelKey);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  // Create the human-like wrapper
  const humanLikeModel = new HumanLikeModelWrapper(baseModel, {
    temperature: 0.8,
    topP: 0.9,
    addFillerWords: true,
    addGrammaticalVariations: true,
    addPauses: true,
  });

  // Generate text with the human-like wrapper
  console.log('Generating response...');
  try {
    const startTime = Date.now();
    const response = await humanLikeModel.generateText(TEST_PROMPT, {
      maxTokens: 200,
    });
    const duration = Date.now() - startTime;

    console.log('\n=== Response ===');
    console.log(response);
    console.log('\n=== Stats ===');
    console.log(`Response length: ${response.length} characters`);
    console.log(`Generation time: ${duration}ms`);
    
    // Analyze human-like features
    const fillerWords = ['um', 'uh', 'like', 'you know', 'I mean', 'sort of', 'kind of'];
    const hasFillerWords = fillerWords.some(word => response.toLowerCase().includes(word));
    const hasPauses = response.includes('...') || response.includes('--');
    
    console.log('\n=== Human-like Features ===');
    console.log(`Contains filler words: ${hasFillerWords ? '✅' : '❌'}`);
    console.log(`Contains natural pauses: ${hasPauses ? '✅' : '❌'}`);
    
    return {
      success: true,
      response,
      duration,
      hasFillerWords,
      hasPauses,
    };
  } catch (error) {
    console.error('Error generating text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Main test function
async function main() {
  const models = [
    {
      provider: 'openai',
      modelKey: 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY ?? '',
    },
    {
      provider: 'mistral',
      modelKey: 'mistral-small-latest',
      apiKey: process.env.MISTRAL_API_KEY ?? '',
    },
    {
      provider: 'google',
      modelKey: 'gemini-2.0-flash-lite',
      apiKey: process.env.GOOGLE_API_KEY ?? '',
    },
  ];

  console.log('Starting human-like model tests...');
  
  const results = [];
  for (const model of models) {
    if (!model.apiKey) {
      console.warn(`Skipping ${model.provider} (${model.modelKey}): API key not found`);
      continue;
    }
    
    const result = await testHumanLikeModel({
      provider: model.provider,
      modelKey: model.modelKey,
      apiKey: model.apiKey,
    });
    
    results.push({
      provider: model.provider,
      modelKey: model.modelKey,
      ...result,
    });
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n=== Test Summary ===');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.provider} (${result.modelKey})`);
    if (result.success) {
      console.log(`   Status: ✅ Success`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Filler words: ${result.hasFillerWords ? '✅' : '❌'}`);
      console.log(`   Natural pauses: ${result.hasPauses ? '✅' : '❌'}`);
    } else {
      console.log(`   Status: ❌ Failed (${result.error})`);
    }
  });
}

// Run the tests
main().catch(console.error);
