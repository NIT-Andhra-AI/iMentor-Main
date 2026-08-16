/**
 * iMentor - Physical Science Tutor Benchmark Generator
 * Simulates a student chat session mimicking the template.pdf ChatGPT session
 * on Chapter 2: Motion using the local SGLang service.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { callWithFallback } = require('../services/llmFallbackService');
const fs = require('fs');

const TOPIC = "Class IX Physical Science - Chapter 2: Motion";
const OUTPUT_MD_PATH = path.join(__dirname, '../../tutor_benchmark_template.md');
const OUTPUT_JSON_PATH = path.join(__dirname, '../../tutor_benchmark_template.json');

const PHASES = [
    {
        name: "Phase 1: Revision Notes",
        query: "Generate a comprehensive set of key definitions, concepts, and formulae for Chapter 2: Motion. Include distance, displacement, speed, velocity, uniform/non-uniform motion, acceleration, and the three equations of motion. Keep it structured like revision notes with SI units."
    },
    {
        name: "Phase 2: Numerical Practice",
        query: "Provide a practice numerical problem based on a train crossing a bridge. Solve it step-by-step showing the given parameters, formulas used, substitution, and final answer with units. Add a board-exam tip."
    },
    {
        name: "Phase 3: Higher Order Thinking Question (HOTS)",
        query: "Ask a Higher Order Thinking Question (HOTS) about circular motion (e.g. constant speed vs changing velocity) or vertical stone throws (velocity vs acceleration at the peak) and explain the underlying physics clearly."
    },
    {
        name: "Phase 4: Mock Test & Grading",
        query: "Create a short 10-mark mock test for Chapter 2: Motion. Provide the questions, and then immediately grade a hypothetical student response that gets some parts wrong, showing how you award partial marks and provide constructive feedback."
    }
];

async function runBenchmark() {
    console.log("======================================================================");
    console.log(`Starting Physical Science Tutor Benchmark Simulation`);
    console.log(`Topic: ${TOPIC}`);
    console.log(`LLM Provider: SGLang (Qwen2.5-7B-Instruct-AWQ on local GPU)`);
    console.log("======================================================================");

    const chatHistory = [];
    const benchmarkData = {
        topic: TOPIC,
        timestamp: new Date().toISOString(),
        provider: 'sglang',
        phases: []
    };

    let mdOutput = `# iMentor Tutoring Benchmark Template\n\n`;
    mdOutput += `* **Topic:** ${TOPIC}\n`;
    mdOutput += `* **Generated At:** ${new Date().toLocaleString()}\n`;
    mdOutput += `* **LLM Engine:** SGLang Local Inference Server (Qwen-2.5-7B)\n\n`;
    mdOutput += `--- \n\n`;

    for (const phase of PHASES) {
        console.log(`\n🚀 Running ${phase.name}...`);
        const startTime = Date.now();

        try {
            const response = await callWithFallback({
                chatHistory,
                userQuery: phase.query,
                systemPrompt: "You are an expert high school physics tutor following the SCERT Telangana syllabus. Your explanations should be extremely clear, comprehensive, and patient, showing step-by-step derivations and formulas.",
                preferredProvider: 'sglang'
            });

            const latency = Date.now() - startTime;
            console.log(`  ✓ Completed in ${(latency / 1000).toFixed(2)}s (${response.text.length} characters)`);

            // Save to history for context retention
            chatHistory.push({ role: 'user', content: phase.query });
            chatHistory.push({ role: 'model', content: response.text });

            benchmarkData.phases.push({
                phase: phase.name,
                prompt: phase.query,
                response: response.text,
                latencyMs: latency,
                characterCount: response.text.length
            });

            mdOutput += `## 💬 ${phase.name}\n\n`;
            mdOutput += `### 🙋 Student Prompt\n> ${phase.query}\n\n`;
            mdOutput += `### 🤖 Tutor Response\n\n${response.text}\n\n`;
            mdOutput += `* **Latency:** ${(latency / 1000).toFixed(2)}s | **Length:** ${response.text.length} chars\n\n`;
            mdOutput += `--- \n\n`;

        } catch (err) {
            console.error(`  ❌ Error during ${phase.name}:`, err.message);
        }
    }

    // Write outputs
    fs.writeFileSync(OUTPUT_MD_PATH, mdOutput, 'utf8');
    fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(benchmarkData, null, 2), 'utf8');

    console.log("\n======================================================================");
    console.log(`🎉 Benchmark Simulation Completed Successfully!`);
    console.log(`Markdown Template saved to: ${OUTPUT_MD_PATH}`);
    console.log(`JSON Benchmark data saved to: ${OUTPUT_JSON_PATH}`);
    console.log("======================================================================");
}

runBenchmark().catch(console.error);
