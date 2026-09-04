/**
 * server/tests/test_multimodal_chat_retrieval.js
 * 
 * Unit tests verifying that Multimodal Chat & Code Sandboxes seamlessly fuses:
 * 1. Web Search
 * 2. Academic Search (OpenAlex / DOIs)
 * 3. Graph RAG (Entity facts & relationships)
 * 4. Code Sandboxes (Interactive parameter sliders & Python snippets)
 */

const assert = require('assert');
const { executeMultimodalChatRetrieval } = require('../services/multimodalChatRetrievalService');

describe('Multimodal Chat & Code Sandbox Retrieval Orchestrator', () => {
    it('1: Should execute fused Web, Academic, and Graph RAG retrieval for engineering queries', async () => {
        const query = 'Buck Converter Continuous Conduction Mode';
        const result = await executeMultimodalChatRetrieval(query, {
            department: 'EEE',
            focusTrack: 'GATE_ASPIRANT'
        });

        assert.ok(result);
        assert.strictEqual(result.query, query);
        assert.strictEqual(result.department, 'EEE');
        assert.strictEqual(result.focusTrack, 'GATE_ASPIRANT');

        // 1. Verify Web Sources
        assert.ok(result.retrievalData.webSources);
        assert.ok(result.retrievalData.webSources.length > 0);

        // 2. Verify Academic Sources (with DOI and Journal metadata)
        assert.ok(result.retrievalData.academicSources);
        assert.ok(result.retrievalData.academicSources.length > 0);

        // 3. Verify Graph RAG Facts
        assert.ok(result.retrievalData.graphRagFacts);
        assert.ok(result.retrievalData.graphRagFacts.length > 0);
        assert.ok(result.retrievalData.graphRagFacts[0]);

        // 4. Verify Visual & Code Sandbox
        assert.ok(result.visualSandbox);
        assert.ok(result.visualSandbox.svgCircuit.includes('```svg'));
        assert.ok(result.visualSandbox.parameterSlider.includes('```html'));
        assert.ok(result.visualSandbox.executableSandbox.initialCode.includes('Vin = 24.0'));
    });

    it('2: Should support selective toggling of retrieval modalities', async () => {
        const query = 'Binary Search Tree Balancing';
        const result = await executeMultimodalChatRetrieval(query, {
            enableWebSearch: false,
            enableAcademicSearch: true,
            enableGraphRag: false,
            enableCodeSandbox: true,
            department: 'CSE'
        });

        assert.strictEqual(result.retrievalData.webSources.length, 0);
        assert.ok(result.retrievalData.academicSources.length > 0);
        assert.strictEqual(result.retrievalData.graphRagFacts.length, 0);
        assert.ok(result.visualSandbox);
    });
});
