// server/tests/test_stn_grounding_patched_team4.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Absolute paths to patch
const originalSocraticPath = path.resolve(__dirname, '../services/socraticTutorService.js');
const tempSocraticPath = path.resolve(__dirname, '../services/socraticTutorService_temp_test.js');

const originalCachePath = path.resolve(__dirname, '../utils/memoryCache.js');
const tempCachePath = path.resolve(__dirname, '../utils/memoryCache_temp_test.js');

// Cleanup handler
function cleanup() {
    try {
        if (fs.existsSync(tempSocraticPath)) {
            fs.unlinkSync(tempSocraticPath);
            console.log("Cleaned up temporary Socratic Tutor file.");
        }
        if (fs.existsSync(tempCachePath)) {
            fs.unlinkSync(tempCachePath);
            console.log("Cleaned up temporary MemoryCache file.");
        }
    } catch (e) {
        console.error("Failed to clean up: ", e.message);
    }
}

console.log("=== Double Patching Syntax Errors for Testing ===");

// 1. Patch memoryCache.js
if (!fs.existsSync(originalCachePath)) {
    console.error(`Memory Cache file does not exist at ${originalCachePath}`);
    process.exit(1);
}
let cacheContent = fs.readFileSync(originalCachePath, 'utf8');
// Splitting by first module.exports and taking only the first declaration
const cacheDelimiter = 'module.exports = MemoryCache;';
const delimiterIndex = cacheContent.indexOf(cacheDelimiter);
if (delimiterIndex !== -1) {
    cacheContent = cacheContent.substring(0, delimiterIndex + cacheDelimiter.length);
    console.log("Extracted clean single class definition from memoryCache.js.");
} else {
    console.warn("Could not locate module exports delimiter in memoryCache.js. Using file as is.");
}
fs.writeFileSync(tempCachePath, cacheContent, 'utf8');

// Inject the tempCache into Node's require.cache under the original's name
const cacheExports = require(tempCachePath);
require.cache[originalCachePath] = {
    id: originalCachePath,
    filename: originalCachePath,
    loaded: true,
    exports: cacheExports
};
console.log("Successfully injected MemoryCache mock exports into require.cache.");

// 2. Patch socraticTutorService.js
if (!fs.existsSync(originalSocraticPath)) {
    console.error(`Socratic Tutor Service file does not exist at ${originalSocraticPath}`);
    cleanup();
    process.exit(1);
}
let socraticContent = fs.readFileSync(originalSocraticPath, 'utf8');
// Replace duplicate const parsed declaration to prevent SyntaxError
const duplicateStr1 = '            const parsed = JSON.parse(jsonMatch[0]);\r\n            if (parsed.priorKnowledge) {';
const patchedStr1 = '            // const parsed = JSON.parse(jsonMatch[0]);\r\n            if (parsed.priorKnowledge) {';

const duplicateStr2 = '            const parsed = JSON.parse(jsonMatch[0]);\n            if (parsed.priorKnowledge) {';
const patchedStr2 = '            // const parsed = JSON.parse(jsonMatch[0]);\n            if (parsed.priorKnowledge) {';

if (socraticContent.includes(duplicateStr1)) {
    socraticContent = socraticContent.replace(duplicateStr1, patchedStr1);
    console.log("Patched Windows line-endings duplication.");
} else if (socraticContent.includes(duplicateStr2)) {
    socraticContent = socraticContent.replace(duplicateStr2, patchedStr2);
    console.log("Patched Unix line-endings duplication.");
} else {
    // If not found, let's try a simple regex match
    socraticContent = socraticContent.replace(
        /const\s+parsed\s+=\s+JSON\.parse\(jsonMatch\[0\]\);(\r?\n\s+if\s*\(parsed\.priorKnowledge\))/g,
        '// const parsed = JSON.parse(jsonMatch[0]);$1'
    );
    console.log("Applied regex patch for duplicate variables.");
}
fs.writeFileSync(tempSocraticPath, socraticContent, 'utf8');

// Mock geminiService BEFORE importing socraticTutorService
const geminiService = require('../services/geminiService');
let capturedPrompt = '';
let capturedSystemPrompt = '';

geminiService.generateContentWithHistory = async function (chatHistory, currentQuery, systemPromptText, options) {
    capturedPrompt = currentQuery;
    capturedSystemPrompt = systemPromptText;
    
    return JSON.stringify({
        understanding: "CORRECT",
        confidence: "HIGH",
        emotionalState: "CURIOUS",
        effortLevel: "HIGH",
        bloom_level: "understand",
        bloomLevel: 2,
        quality: "CORRECT",
        xpMultiplier: 1.1,
        specificGaps: [],
        reasoning: "The student response accurately defines the concept."
    });
};

try {
    const { assessStudentResponse } = require('../services/socraticTutorService_temp_test');
    
    (async () => {
        console.log("=== Running Grounding Unit Test on Patched Stack ===");
        
        const mockStudentResponse = "Binary Search divides the list in half each time to find the item in O(log n).";
        const mockModuleTitle = "Binary Search";
        const mockLastQuestion = "Can you explain how Binary Search works and its complexity?";
        const mockLlmConfig = {
            llmProvider: 'gemini',
            apiKey: 'fake-api-key',
            currentCognitiveLevel: 'L2_APPLICATION'
        };
        const mockHistory = [];
        const mockGroundTruth = "Binary Search is a search algorithm that finds the position of a target value within a sorted array. It compares the target value to the middle element of the array. The time complexity is O(log n).";

        const assessment = await assessStudentResponse(
            mockStudentResponse,
            mockModuleTitle,
            mockLastQuestion,
            mockLlmConfig,
            mockHistory,
            mockGroundTruth
        );

        console.log("Assessment Result:", assessment);
        
        // Assertions
        assert.strictEqual(assessment.understanding, "CORRECT");
        assert.strictEqual(assessment.bloomLevel, 2);
        
        console.log("Checking if prompt contains ground truth...");
        assert.ok(capturedPrompt.includes(mockGroundTruth), "Prompt should contain the ground truth text.");
        assert.ok(capturedPrompt.includes("STN Context (ground truth reference)"), "Prompt should contain STN Context section.");
        assert.ok(capturedPrompt.includes("Evaluate the student's response strictly and directly against the \"STN Context (ground truth reference)\""), "Prompt should contain evaluation instructions.");

        console.log("✅ All STN Grounding unit tests passed successfully!");
        cleanup();
        process.exit(0);
    })().catch(err => {
        console.error("❌ Test failed:", err);
        cleanup();
        process.exit(1);
    });
} catch (e) {
    console.error("Failed to require temp service:", e);
    cleanup();
    process.exit(1);
}
