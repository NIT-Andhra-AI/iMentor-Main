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

    it('should return draft response directly when streaming', async () => {
        const draftContent = "Here is an explanation of binary search. Think of it like looking for a word in a physical dictionary. What happens when you split the book in half?";
        
        streamSpy.mockImplementation(async ({ onToken }) => {
            if (onToken) {
                onToken("Here is an explanation of binary search. ");
                onToken("Think of it like looking for a word in a physical dictionary. ");
                onToken("What happens when you split the book in half?");
            }
            return draftContent;
        });
            
        const prompt = "Explain binary search.";
        const systemPrompt = "You are a tutor.";
        const llmConfig = { llmProvider: 'gemini', apiKey: 'mock-api-key' };
        const llmOptions = {};
        const onToken = vi.fn();

        const result = await generateAndCritiqueSocraticResponse(prompt, systemPrompt, llmConfig, llmOptions, onToken);

        expect(result).toBe(draftContent);
        expect(streamSpy).toHaveBeenCalledTimes(1);
        expect(onToken).toHaveBeenCalled();
    });

    it('should format and clean response when streamed', async () => {
        const badDraft = "<thinking>Internal monologue</thinking>Imagine a phone book. To find a name, you open it in the middle and decide which half to discard. How does this compare to checking every single page?";
        const expectedClean = "Imagine a phone book. To find a name, you open it in the middle and decide which half to discard. How does this compare to checking every single page?";
        
        streamSpy.mockImplementation(async ({ onToken }) => {
            if (onToken) {
                onToken(badDraft);
            }
            return badDraft;
        });
            
        const prompt = "Explain binary search.";
        const systemPrompt = "You are a tutor.";
        const llmConfig = { llmProvider: 'gemini', apiKey: 'mock-api-key' };
        const llmOptions = {};
        const onToken = vi.fn();

        const result = await generateAndCritiqueSocraticResponse(prompt, systemPrompt, llmConfig, llmOptions, onToken);

        expect(result).toBe(expectedClean);
        expect(streamSpy).toHaveBeenCalledTimes(1);
        expect(onToken).toHaveBeenCalled();
    });
});

describe('socraticTutorStrictFormatter & extractInteractiveChips', () => {
    const { cleanResponse, formatSocraticStrict, extractInteractiveChips } = require('../../server/services/socraticTutorStrictFormatter');

    it('should clean thinking blocks and thought prefixes', () => {
        const text = '<thinking>Step 1 analysis</thinking>Thought Process: analyzing\n\nHere is the concept.';
        expect(cleanResponse(text)).toBe('Here is the concept.');
    });

    it('should preserve code fences while removing prompt step headers', () => {
        const text = `
### Step 1: Acknowledge & Affirm
Great effort on the calculation!

### Step 3: Multimodal Scaffolding
\`\`\`mermaid
flowchart TD
    A --> B
\`\`\`

### Step 4: Metacognitive Checkpoint
What is the effect of doubling frequency?
`;
        const formatted = formatSocraticStrict(text);
        expect(formatted).toContain('```mermaid');
        expect(formatted).not.toContain('### Step 1');
        expect(formatted.endsWith('What is the effect of doubling frequency?')).toBe(true);
    });

    it('should extract multiple choice lettered chips', () => {
        const text = 'Which data structure gives O(1) lookup on average? (A) Hash Table (B) Linked List (C) Binary Search Tree';
        const chips = extractInteractiveChips(text);
        expect(chips.length).toBe(3);
        expect(chips[0].label).toBe('(A) Hash Table');
        expect(chips[1].label).toBe('(B) Linked List');
    });

    it('should extract comparative physics chips', () => {
        const text = 'Does the total current increase, decrease, or remain constant?';
        const chips = extractInteractiveChips(text);
        expect(chips.length).toBe(3);
        expect(chips[0].label).toContain('Increases');
        expect(chips[1].label).toContain('Decreases');
        expect(chips[2].label).toContain('Remains Constant');
    });

    it('should extract true/false chips', () => {
        const text = 'Is this statement true or false?';
        const chips = extractInteractiveChips(text);
        expect(chips.length).toBe(2);
        expect(chips[0].label).toContain('True');
    });
});

