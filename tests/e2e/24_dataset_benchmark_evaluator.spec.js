// tests/e2e/24_dataset_benchmark_evaluator.spec.js
// Multi-Dataset Prompt Quality & Deviation Benchmark Evaluator
// Tests diverse prompt variants from LMSYS Arena, NuminaMath, WildChat, Nectar, UltraFeedback & Anthropic HH-RLHF.
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import { sendAndWait, countBotMessages, assertNoError, clickNewChat, SEL } from "./helpers/chat-helpers.js";
import fs from "fs";
import path from "path";

/* ── Benchmark Dataset Prompt Pool ────────────────────────────────── */
const BENCHMARK_CASES = [
  {
    id: "LMSYS-01",
    dataset: "lmsys/lmsys-chat-1m",
    category: "Architectural & Conceptual Analysis",
    prompt: "What is the difference between synchronous and asynchronous programming in event-driven systems? Provide real-world backend analogies.",
    expectedTerms: ["synchronous", "asynchronous", "blocking", "event loop", "thread"],
    formatRequirements: ["markdown_structure"],
    minWords: 60,
  },
  {
    id: "LMSYS-02",
    dataset: "lmsys/chatbot_arena_conversations",
    category: "Multi-Turn Algorithmic Reasoning",
    isMultiTurn: true,
    turns: [
      {
        prompt: "Explain Dijkstra's shortest path algorithm and its time complexity with a min-priority queue.",
        expectedTerms: ["dijkstra", "shortest path", "priority queue", "complexity", "graph"],
        minWords: 50,
      },
      {
        prompt: "How does the A* search algorithm improve upon Dijkstra's approach using heuristics, and what makes a heuristic admissible?",
        expectedTerms: ["a*", "heuristic", "admissible", "underestimate", "goal"],
        minWords: 50,
      }
    ],
  },
  {
    id: "NUMINA-01",
    dataset: "AI-MO/NuminaMath-CoT",
    category: "Mathematical Proof & LaTeX Formatting",
    prompt: "Solve the quadratic equation 3x^2 - 14x + 8 = 0 step by step using the quadratic formula. Render all equations and roots in clean LaTeX format.",
    expectedTerms: ["quadratic", "discriminant", "root", "4"],
    formatRequirements: ["latex_equations"],
    minWords: 40,
  },
  {
    id: "NUMINA-02",
    dataset: "AI-MO/NuminaMath-CoT",
    category: "DSP Matrix Transforms & KaTeX Delimiters",
    prompt: "Compute the 4-point DFT matrix multiplication for sequence x[n] = [1, 2, 3, 4]. Show the twiddle factor W_4 matrix equation in bracket notation.",
    expectedTerms: ["dft", "matrix", "twiddle", "10"],
    formatRequirements: ["latex_matrix"],
    minWords: 40,
  },
  {
    id: "WILD-01",
    dataset: "allenai/WildChat-1M",
    category: "Code Generation & Type Hints",
    prompt: "Write a complete Python function for topological sorting on a Directed Acyclic Graph (DAG) using Kahn's Algorithm with indegree counting. Include type hints and docstring.",
    expectedTerms: ["def", "indegree", "queue", "graph", "return"],
    formatRequirements: ["code_fence_python"],
    minWords: 40,
  },
  {
    id: "WILD-02",
    dataset: "allenai/WildChat-1M",
    category: "Code Debugging & Edge Cases",
    prompt: "Find and fix the bug in this Python snippet: def append_item(val, items=[]): items.append(val); return items. Explain why mutable default arguments cause unexpected behavior in Python.",
    expectedTerms: ["mutable", "default", "none", "definition time", "bug"],
    formatRequirements: ["code_fence"],
    minWords: 50,
  },
  {
    id: "NECTAR-01",
    dataset: "berkeley-nest/Nectar",
    category: "Structured Comparison & Tables",
    prompt: "Create a Markdown table comparing 4 sorting algorithms (Bubble Sort, Merge Sort, Quick Sort, Heap Sort) across Best, Average, Worst Time Complexity and Space Complexity.",
    expectedTerms: ["bubble", "merge", "quick", "heap", "complexity"],
    formatRequirements: ["markdown_table"],
    minWords: 40,
  },
  {
    id: "ULTRA-01",
    dataset: "openbmb/UltraFeedback",
    category: "Visual Diagram Generation (Mermaid)",
    prompt: "Create a Mermaid flowchart diagram explaining the lifecycle of a Machine Learning model from data ingestion to model deployment and monitoring.",
    expectedTerms: ["mermaid", "data", "train", "deploy", "monitor"],
    formatRequirements: ["mermaid_diagram"],
    minWords: 30,
  },
  {
    id: "ANTHROPIC-01",
    dataset: "Anthropic/hh-rlhf",
    category: "Ethical Cybersecurity & Remediation",
    prompt: "How do security engineers test web applications for SQL injection vulnerabilities using sqlmap ethically in authorized lab environments, and what are the best coding practices to prevent SQLi?",
    expectedTerms: ["parameterized", "prepared", "authorization", "ethical", "input validation"],
    minWords: 60,
  },
  {
    id: "ANTHROPIC-02",
    dataset: "Anthropic/hh-rlhf",
    category: "Hallucination & Temporal Boundary Probe",
    prompt: "Who was the keynote speaker at the 2039 Mars Terraforming Conference in Neo Tokyo?",
    expectedTerms: ["future", "fictional", "cannot", "has not", "hypothetical", "no record"],
    prohibitedHallucinations: ["was held on", "spoke about his achievements in 2039"],
    minWords: 15,
  },
  {
    id: "SOCRATIC-01",
    dataset: "iMentor/Socratic-Tutor",
    category: "Adaptive Socratic Conceptualization",
    prompt: "I am struggling to understand what eigenvalues and eigenvectors actually represent geometrically. Can you give me an intuitive physical analogy without throwing pure algebra at me first?",
    expectedTerms: ["direction", "stretch", "scale", "transform", "vector"],
    minWords: 50,
  }
];

/* ── Evaluation Utility Functions ─────────────────────────────────── */

function evaluateResponse(text, testCase, turnIndex = 0) {
  const criteria = testCase.isMultiTurn ? testCase.turns[turnIndex] : testCase;
  const wordCount = (text.trim().match(/\S+/g) || []).length;
  const issues = [];
  let score = 100;

  // 1. Crash / Tool Error Detection
  const hasToolError = /toolOutput\.trim|TypeError|\[object Object\]|internal tools is currently unavailable|unexpected issue while trying to help/i.test(text);
  if (hasToolError) {
    issues.push("CRITICAL: Tool failure or runtime error detected in response text");
    score -= 60;
  }

  // 2. Length Check
  if (wordCount < (criteria.minWords || 30)) {
    issues.push("Response too brief (" + wordCount + " words, expected >= " + criteria.minWords + ")");
    score -= 20;
  }

  // 3. Expected Keywords Coverage
  const missingTerms = [];
  for (const term of (criteria.expectedTerms || [])) {
    const regex = new RegExp(term, "i");
    if (!regex.test(text)) {
      missingTerms.push(term);
    }
  }
  if (missingTerms.length > 0) {
    const coverage = 1 - (missingTerms.length / criteria.expectedTerms.length);
    if (coverage < 0.6) {
      issues.push("Missing key concepts: [" + missingTerms.join(", ") + "]");
      score -= Math.round(30 * (1 - coverage));
    }
  }

  // 4. Prohibited Hallucinations
  if (criteria.prohibitedHallucinations) {
    for (const ph of criteria.prohibitedHallucinations) {
      if (new RegExp(ph, "i").test(text)) {
        issues.push("Hallucination detected matching prohibited phrase: \"" + ph + "\"");
        score -= 40;
      }
    }
  }

  // 5. Format Requirements
  const formatAudit = {
    hasLatex: /\$|\\\(|\\\[|\\begin\{/.test(text),
    hasCodeBlock: /```[a-zA-Z0-9_-]*\n[\s\S]*?```/.test(text),
    hasMermaid: /```mermaid|[\r\n](graph|flowchart)\s+(TD|TB|LR|RL)/i.test(text),
    hasTable: /\|.+\|.+\|\n\|[\s-:|]+\|/.test(text),
    hasMathAmpEscapes: /&amp;/.test(text) && /matrix|bmatrix|pmatrix/.test(text),
  };

  if (criteria.formatRequirements) {
    for (const req of criteria.formatRequirements) {
      if (req === "latex_equations" || req === "latex_matrix") {
        if (!formatAudit.hasLatex) {
          issues.push("Expected LaTeX formatting ($...$ or $$...$$) was missing");
          score -= 15;
        }
        if (formatAudit.hasMathAmpEscapes) {
          issues.push("LaTeX matrix contained unescaped HTML &amp; entity corruption");
          score -= 20;
        }
      }
      if (req.startsWith("code_fence") && !formatAudit.hasCodeBlock) {
        issues.push("Expected markdown code block (```...) was missing");
        score -= 20;
      }
      if (req === "markdown_table" && !formatAudit.hasTable) {
        issues.push("Expected markdown table format was missing");
        score -= 20;
      }
      if (req === "mermaid_diagram" && !formatAudit.hasMermaid) {
        issues.push("Expected Mermaid diagram syntax was missing");
        score -= 25;
      }
    }
  }

  score = Math.max(0, Math.min(100, score));
  let status = "EXPECTED";
  if (hasToolError || score < 50) {
    status = "FAILED";
  } else if (issues.length > 0 || score < 80) {
    status = "DEVIATED";
  }

  return {
    score,
    status,
    wordCount,
    charCount: text.length,
    issues,
    formatAudit,
  };
}

function recordAndSaveBenchmark(entry) {
  const reportsDir = path.resolve("./tests/reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const jsonPath = path.join(reportsDir, "dataset_benchmark_results.json");
  let list = [];
  if (fs.existsSync(jsonPath)) {
    try {
      list = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch {
      list = [];
    }
  }

  const idx = list.findIndex(item => item.id === entry.id);
  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  fs.writeFileSync(jsonPath, JSON.stringify(list, null, 2), "utf8");

  // Generate Markdown Report
  const total = list.length;
  if (total === 0) return;

  const passedExpected = list.filter(r => (r.overallStatus || r.status) === "EXPECTED").length;
  const deviated = list.filter(r => (r.overallStatus || r.status) === "DEVIATED").length;
  const failed = list.filter(r => (r.overallStatus || r.status) === "FAILED").length;
  const avgQuality = Math.round(list.reduce((acc, r) => acc + (r.overallScore || r.score || 0), 0) / total);

  let md = "# iMentor V2 Multi-Dataset Benchmark & Response Quality Report\n\n";
  md += "**Generated At**: " + new Date().toISOString() + "\n\n";
  md += "### Executive Quality Summary\n\n";
  md += "| Metric | Result | Target / SLA | Status |\n";
  md += "| :--- | :--- | :--- | :--- |\n";
  md += "| **Total Prompts Evaluated** | " + total + " / " + BENCHMARK_CASES.length + " prompt archetypes | - | - |\n";
  md += "| **Expected (High Quality)** | " + passedExpected + " (" + Math.round(passedExpected/total*100) + "%) | >= 85% | " + (passedExpected/total >= 0.85 ? "🟢 PASS" : "🟡 ATTENTION") + " |\n";
  md += "| **Deviated (Minor issues)** | " + deviated + " (" + Math.round(deviated/total*100) + "%) | <= 15% | " + (deviated/total <= 0.15 ? "🟢 PASS" : "🟡 REVIEW") + " |\n";
  md += "| **Failed (Crashes/Errors)** | " + failed + " | 0 | " + (failed === 0 ? "🟢 ZERO CRASHES" : "🔴 ACTION REQUIRED") + " |\n";
  md += "| **Overall Quality Score** | **" + avgQuality + " / 100** | >= 85/100 | " + (avgQuality >= 85 ? "🟢 EXCELLENT" : "🟡 ACCEPTABLE") + " |\n\n";

  md += "### Detailed Benchmark Results Table\n\n";
  md += "| ID | Dataset Source | Category | Status | Quality Score | Latency | Key Observations / Deviations |\n";
  md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";

  for (const r of list) {
    const status = r.overallStatus || r.status;
    const score = r.overallScore || r.score;
    const latency = r.isMultiTurn
      ? "Turn 1: " + (r.turns[0].latencyMs/1000).toFixed(1) + "s, Turn 2: " + (r.turns[1].latencyMs/1000).toFixed(1) + "s"
      : (r.latencyMs/1000).toFixed(1) + "s";
    const issues = r.isMultiTurn
      ? r.turns.flatMap(t => t.issues).join("; ") || "None (Fully met rubric)"
      : r.issues.join("; ") || "None (Fully met rubric)";
    const statusBadge = status === "EXPECTED" ? "🟢 EXPECTED" : (status === "DEVIATED" ? "🟡 DEVIATED" : "🔴 FAILED");

    md += "| `" + r.id + "` | `" + r.dataset + "` | " + r.category + " | " + statusBadge + " | **" + score + "/100** | " + latency + " | " + issues + " |\n";
  }

  md += "\n### Actionable Engineering Recommendations\n\n";
  md += "1. **Mathematical LaTeX Delimiters**: Ensure all math formulas are wrapped in KaTeX standard blocks with SVG solid fills.\n";
  md += "2. **Tool Output Normalization**: Maintain strict string serialization on all tool outputs to avoid router synthesizer type errors.\n";
  md += "3. **Mermaid & Diagram Prompts**: Keep system instructions clear for structured graph rendering.\n";

  const mdPath = path.join(reportsDir, "DATASET_BENCHMARK_REPORT.md");
  fs.writeFileSync(mdPath, md, "utf8");
}

/* ── Test Suite ───────────────────────────────────────────────────── */

test.describe("BENCHMARK — Multi-Dataset Chatbot Quality & Deviation Suite", () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  for (const testCase of BENCHMARK_CASES) {
    test("[" + testCase.id + "] " + testCase.dataset + " — " + testCase.category, async ({ page }) => {
      test.setTimeout(180000);
      await clickNewChat(page);
      await page.waitForTimeout(1000);

      if (testCase.isMultiTurn) {
        // Multi-Turn Evaluation
        const turnsData = [];
        for (let i = 0; i < testCase.turns.length; i++) {
          const turn = testCase.turns[i];
          const startTime = Date.now();
          const responseText = await sendAndWait(page, turn.prompt, 120000);
          const latencyMs = Date.now() - startTime;

          const evalResult = evaluateResponse(responseText, testCase, i);
          turnsData.push({
            turnIndex: i + 1,
            prompt: turn.prompt,
            latencyMs,
            wordCount: evalResult.wordCount,
            score: evalResult.score,
            status: evalResult.status,
            issues: evalResult.issues,
            responsePreview: responseText.slice(0, 300) + (responseText.length > 300 ? "..." : ""),
          });

          console.log("  → Turn " + (i+1) + " [" + evalResult.status + "]: Score " + evalResult.score + "/100, " + evalResult.wordCount + " words in " + (latencyMs/1000).toFixed(1) + "s");
          if (evalResult.issues.length > 0) {
            console.log("     Issues: " + evalResult.issues.join("; "));
          }
        }

        const avgScore = Math.round(turnsData.reduce((acc, t) => acc + t.score, 0) / turnsData.length);
        const overallStatus = turnsData.some(t => t.status === "FAILED")
          ? "FAILED"
          : (turnsData.some(t => t.status === "DEVIATED") ? "DEVIATED" : "EXPECTED");

        recordAndSaveBenchmark({
          id: testCase.id,
          dataset: testCase.dataset,
          category: testCase.category,
          isMultiTurn: true,
          overallStatus,
          overallScore: avgScore,
          turns: turnsData,
        });

        expect(overallStatus).not.toBe("FAILED");
      } else {
        // Single Turn Evaluation
        const startTime = Date.now();
        const responseText = await sendAndWait(page, testCase.prompt, 120000);
        const latencyMs = Date.now() - startTime;

        const evalResult = evaluateResponse(responseText, testCase, 0);
        console.log("  → [" + evalResult.status + "]: Score " + evalResult.score + "/100, " + evalResult.wordCount + " words in " + (latencyMs/1000).toFixed(1) + "s");
        if (evalResult.issues.length > 0) {
          console.log("     Issues: " + evalResult.issues.join("; "));
        }

        recordAndSaveBenchmark({
          id: testCase.id,
          dataset: testCase.dataset,
          category: testCase.category,
          isMultiTurn: false,
          prompt: testCase.prompt,
          latencyMs,
          responsePreview: responseText.slice(0, 300) + (responseText.length > 300 ? "..." : ""),
          ...evalResult,
        });

        expect(evalResult.status).not.toBe("FAILED");
      }
    });
  }

  test.afterAll(async () => {
    const mdPath = path.resolve("./tests/reports/DATASET_BENCHMARK_REPORT.md");
    const jsonPath = path.resolve("./tests/reports/dataset_benchmark_results.json");
    console.log("\n=======================================================");
    console.log("✓ Benchmark report finalized at: " + mdPath);
    console.log("✓ Benchmark raw JSON finalized at: " + jsonPath);
    console.log("=======================================================\n");
  });

});
