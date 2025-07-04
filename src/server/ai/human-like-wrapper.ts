import { generateText } from 'ai';
import type { LanguageModelV1 } from '@ai-sdk/provider';

// Define the GenerateTextOptions type since it's not directly exported
interface GenerateTextOptions {
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  stopSequences?: string[];
  // Add other options as needed
}

type HumanLikeOptions = {
  // Controls the amount of variation in responses (0-1)
  temperature?: number;
  // Controls the amount of randomness in response selection (0-1)
  topP?: number;
  // Add human-like imperfections
  addFillerWords?: boolean;
  // Add minor grammatical variations
  addGrammaticalVariations?: boolean;
  // Add natural pauses
  addPauses?: boolean;
};

export class HumanLikeModelWrapper {
  private model: LanguageModelV1;
  private options: Required<HumanLikeOptions>;

  constructor(
    model: LanguageModelV1,
    options: HumanLikeOptions = {}
  ) {
    this.model = model;
    this.options = {
      temperature: options.temperature ?? 0.7,
      topP: options.topP ?? 0.9,
      addFillerWords: options.addFillerWords ?? true,
      addGrammaticalVariations: options.addGrammaticalVariations ?? true,
      addPauses: options.addPauses ?? true,
    };
  }

  async generateText(
    prompt: string,
    options: GenerateTextOptions = {}
  ): Promise<string> {
    // Apply human-like settings to the generation
    const generationOptions: GenerateTextOptions = {
      ...options,
      temperature: this.options.temperature,
      topP: this.options.topP,
      maxTokens: options.maxTokens ?? 1000,
    };

    // Generate the initial response
    const { text } = await generateText({
      model: this.model,
      prompt,
      ...generationOptions,
    });

    // Apply human-like transformations
    return this.humanizeResponse(text);
  }

  private humanizeResponse(text: string): string {
    let result = text;

    if (this.options.addFillerWords) {
      result = this.addFillerWords(result);
    }

    if (this.options.addGrammaticalVariations) {
      result = this.addGrammaticalVariations(result);
    }

    if (this.options.addPauses) {
      result = this.addNaturalPauses(result);
    }

    return result;
  }

  private addFillerWords(text: string): string {
    // Common filler words and phrases
    const fillers = [
      'um', 'uh', 'like', 'you know', 'I mean', 'sort of', 'kind of',
      'actually', 'basically', 'literally', 'right?', 'you see', 'I guess'
    ];

    // Add fillers with decreasing probability
    return text.split(' ').map(word => {
      if (Math.random() < 0.05) { // 5% chance to add a filler
        const filler = fillers[Math.floor(Math.random() * fillers.length)];
        return `${filler} ${word}`;
      }
      return word;
    }).join(' ');
  }

  private addGrammaticalVariations(text: string): string {
    // Simple grammatical variations
    const variations: Array<[RegExp, string | ((substring: string, ...args: any[]) => string)]> = [
      [/([.,!?])\s+/g, '$1 '], // Remove space after punctuation
      [/([a-z])([A-Z])/g, '$1. $2'], // Add period between sentences
      [/(\w), (\w)/g, (_: string, p1: string, p2: string) => 
        Math.random() > 0.5 ? `${p1}, ${p2}` : `${p1} ${p2}`
      ], // Randomly remove some commas
    ];

    return variations.reduce(
      (result, [regex, replacement]) => 
        typeof replacement === 'string' 
          ? result.replace(regex, replacement)
          : result.replace(regex, replacement as (substring: string, ...args: any[]) => string),
      text
    );
  }

  private addNaturalPauses(text: string): string {
    // Add ellipsis or dashes for natural pauses
    return text.split('.').map(sentence => {
      if (sentence.length > 30 && Math.random() < 0.3) { // 30% chance to add a pause
        const words = sentence.trim().split(' ');
        if (words.length > 5) {
          const pausePoint = Math.floor(Math.random() * (words.length - 3)) + 2;
          words.splice(pausePoint, 0, Math.random() > 0.5 ? '...' : '--');
          return words.join(' ');
        }
      }
      return sentence;
    }).join('. ');
  }
}
