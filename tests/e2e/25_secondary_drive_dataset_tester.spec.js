// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import { sendAndWait, clickNewChat } from "./helpers/chat-helpers.js";
import fs from "fs";
import path from "path";

const SAMPLES_DIR = "/media/sri/secondary_3tb/llm_datasets/extracted_samples";

/**
 * Loads dynamically extracted sample prompts from the secondary 3TB drive
 */
function loadDynamicPrompts() {
  const testCases = [];

  // 1. WildChat-1M Sample
  const wildchatPath = path.join(SAMPLES_DIR, "wildchat_1m_sample.json");
  if (fs.existsSync(wildchatPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(wildchatPath, "utf8"));
      if (data.length > 0) {
        const conv = data[0].conversation;
        const prompt = Array.isArray(conv) ? conv[0].content : "Explain how Python handles memory allocation for large data frames.";
        testCases.push({
          id: "SEC-WILDCHAT",
          dataset: "WildChat-1M (Secondary Drive)",
          prompt: prompt.slice(0, 300),
          minWords: 30
        });
      }
    } catch {}
  }

  // 2. OpenThoughts Reasoning Sample
  const openThoughtsPath = path.join(SAMPLES_DIR, "open_thoughts_sample.json");
  if (fs.existsSync(openThoughtsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(openThoughtsPath, "utf8"));
      if (data.length > 0) {
        const conv = data[0].conversations;
        const prompt = Array.isArray(conv) ? conv[0].value : "Solve the recurrence relation T(n) = 2T(n/2) + n log n with full proof.";
        testCases.push({
          id: "SEC-OPENTHOUGHTS",
          dataset: "OpenThoughts-114k (Secondary Drive)",
          prompt: prompt.slice(0, 300),
          minWords: 40
        });
      }
    } catch {}
  }

  // 3. NuminaMath CoT Sample
  const numinaPath = path.join(SAMPLES_DIR, "numinamath_cot_sample.json");
  if (fs.existsSync(numinaPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(numinaPath, "utf8"));
      if (data.length > 0) {
        const prompt = data[0].problem || "Calculate the sum of all eigenvalues of matrix [[3, 1], [0, 2]].";
        testCases.push({
          id: "SEC-NUMINA",
          dataset: "NuminaMath-CoT (Secondary Drive)",
          prompt: prompt.slice(0, 300),
          minWords: 20
        });
      }
    } catch {}
  }

  // 4. Berkeley Nectar Sample
  const nectarPath = path.join(SAMPLES_DIR, "nectar_sample.json");
  if (fs.existsSync(nectarPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(nectarPath, "utf8"));
      if (data.length > 0) {
        const prompt = data[0].prompt || "What are the main architectural differences between microservices and monoliths?";
        testCases.push({
          id: "SEC-NECTAR",
          dataset: "Berkeley Nectar (Secondary Drive)",
          prompt: prompt.slice(0, 300),
          minWords: 30
        });
      }
    } catch {}
  }

  // 5. HuggingFace NoRobots Instruct Sample
  const noRobotsPath = path.join(SAMPLES_DIR, "no_robots_sample.json");
  if (fs.existsSync(noRobotsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(noRobotsPath, "utf8"));
      if (data.length > 0) {
        const prompt = data[0].prompt || "Write a professional email following up on a software engineering interview.";
        testCases.push({
          id: "SEC-NOROBOTS",
          dataset: "NoRobots-Instruct (Secondary Drive)",
          prompt: prompt.slice(0, 300),
          minWords: 30
        });
      }
    } catch {}
  }

  return testCases;
}

const DYNAMIC_TESTS = loadDynamicPrompts();

test.describe("SECONDARY DRIVE — Live Dataset Prompt Verification", () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  for (const testCase of DYNAMIC_TESTS) {
    test(`[${testCase.id}] ${testCase.dataset}`, async ({ page }) => {
      test.setTimeout(180000);
      await clickNewChat(page);
      await page.waitForTimeout(1000);

      const startTime = Date.now();
      const responseText = await sendAndWait(page, testCase.prompt, 120000);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const wordCount = responseText.trim().split(/\s+/).filter(Boolean).length;

      console.log(`✓ [${testCase.id}] ${testCase.dataset}: Generated ${wordCount} words in ${elapsed}s`);
      expect(wordCount).toBeGreaterThanOrEqual(testCase.minWords);
    });
  }

});
