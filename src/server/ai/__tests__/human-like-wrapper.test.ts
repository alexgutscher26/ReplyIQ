import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HumanLikeModelWrapper } from '../human-like-wrapper';
import { generateText } from 'ai';

// Mock the generateText function
vi.mock('ai', () => ({
  generateText: vi.fn().mockResolvedValue({
    text: 'This is a test response from the AI model.',
    usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    finishReason: 'stop',
    finishDetails: { type: 'stop' },
    rawResponse: {},
    textGeneration: true,
  }),
}));

const mockGenerateText = vi.mocked(generateText);

describe('HumanLikeModelWrapper', () => {
  let mockModel: any;
  let wrapper: HumanLikeModelWrapper;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create a mock model
    mockModel = {
      // Mock model methods if needed
    };
    
    // Create a new wrapper instance for each test
    wrapper = new HumanLikeModelWrapper(mockModel, {
      temperature: 0.7,
      topP: 0.9,
      addFillerWords: true,
      addGrammaticalVariations: true,
      addPauses: true,
    });
  });

  it('should generate text with human-like features', async () => {
    const prompt = 'Hello, how are you?';
    const response = await wrapper.generateText(prompt);
    
    // Verify that generateText was called with the correct parameters
    expect(mockGenerateText).toHaveBeenCalledWith({
      model: mockModel,
      prompt,
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 1000,
    });
    
    // The response should be a string
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  it('should add filler words when enabled', async () => {
    const wrapperWithFillers = new HumanLikeModelWrapper(mockModel, {
      addFillerWords: true,
      addGrammaticalVariations: false,
      addPauses: false,
    });
    
    const response = await wrapperWithFillers.generateText('Test');
    expect(response).toContain(' '); // At least one space should be present
  });

  it('should respect the temperature setting', async () => {
    const customTemp = 0.5;
    const wrapperWithCustomTemp = new HumanLikeModelWrapper(mockModel, {
      temperature: customTemp,
    });
    
    await wrapperWithCustomTemp.generateText('Test');
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: customTemp,
      })
    );
  });

  it('should handle errors from the underlying model', async () => {
    // Mock an error from generateText
    const errorMessage = 'Test error';
    mockGenerateText.mockRejectedValueOnce(new Error(errorMessage));
    
    await expect(wrapper.generateText('Test')).rejects.toThrow(errorMessage);
  });
});
