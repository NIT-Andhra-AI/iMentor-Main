/**
 * tests/unit/socraticTutorService.test.js
 * 
 * Unit tests for the multi-agent Socratic critique and refinement loop.
 */

const groqService = require('../../server/services/groqService');
const geminiService = require('../../server/services/geminiService');
const llmStreamingService = require('../../server/services/llmStreamingService');
const { redisClient } = require('../../server/config/redisClient');

const { generateAndCritiqueSocraticResponse } = require('../../server/services/socraticTutorService');

describe('generateAndCritiqueSocraticResponse()', () => {
    let groqSpy, geminiSpy, streamSpy, redisGetSpy, redisSetSpy;

    beforeEach(() => {
        vi.restoreAllMocks();
        
        // Spy on the services and mock their implementations to avoid real calls
        groqSpy = vi.spyOn(groqService, 'generateContentWithHistory');
        geminiSpy = vi.spyOn(geminiService, 'generateContentWithHistory');
        streamSpy = vi.spyOn(llmStreamingService, 'streamCompletion');
        
        if (redisClient) {
            redisGetSpy = vi.spyOn(redisClient, 'get').mockResolvedValue(null);
            redisSetSpy = vi.spyOn(redisClient, 'set').mockResolvedValue('OK');
        }
    });

    it('should return draft response directly when critique passes', async () => {
        const draftContent = "Here is an explanation of binary search. Think of it like looking for a word in a physical dictionary. What happens when you split the book in half?";
        
        // Mock groqService.generateContentWithHistory
        groqSpy
            .mockResolvedValueOnce(draftContent) // Draft generation call
            .mockResolvedValueOnce("PASSED");    // Critique call
            
        const prompt = "Explain binary search.";
        const systemPrompt = "You are a tutor.";
        const llmConfig = { llmProvider: 'groq', apiKey: 'mock-api-key' };
        const llmOptions = {};
        const onToken = vi.fn();

        const result = await generateAndCritiqueSocraticResponse(prompt, systemPrompt, llmConfig, llmOptions, onToken);

        expect(result).toBe(draftContent);
        expect(groqSpy).toHaveBeenCalledTimes(2);
        expect(onToken).toHaveBeenCalled();
    });

    it('should refine the draft response when critique fails', async () => {
        const badDraft = "Binary search splits arrays in half.";
        const critiqueReport = "Violation 3: Does not contain an analogy or real-world example. Violation 1: Does not end with exactly one question.";
        const refinedContent = "Imagine a phone book. To find a name, you open it in the middle and decide which half to discard. How does this compare to checking every single page?";
        
        groqSpy
            .mockResolvedValueOnce(badDraft)       // Draft generation
            .mockResolvedValueOnce(critiqueReport); // Critique

        streamSpy.mockImplementation(({ onToken }) => {
            if (onToken) {
                onToken("Imagine");
                onToken(" a phone book.");
            }
            return Promise.resolve(refinedContent);
        });
            
        const prompt = "Explain binary search.";
        const systemPrompt = "You are a tutor.";
        const llmConfig = { llmProvider: 'groq', apiKey: 'mock-api-key' };
        const llmOptions = {};
        const onToken = vi.fn();

        const result = await generateAndCritiqueSocraticResponse(prompt, systemPrompt, llmConfig, llmOptions, onToken);

        expect(result).toBe(refinedContent);
        expect(groqSpy).toHaveBeenCalledTimes(2);
        expect(streamSpy).toHaveBeenCalledTimes(1);
        expect(onToken).toHaveBeenCalled();
    });
});
