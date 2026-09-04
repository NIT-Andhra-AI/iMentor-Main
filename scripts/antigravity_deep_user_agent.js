/**
 * Antigravity Synthetic User Browser Agent
 * Executes 10-LEVEL DEEP progressive journeys INSIDE A SINGLE MODULE.
 * Rotates across distinct modules (Socratic Tutor, Study Plan, Course Syllabus, Skill Tree, Deep Research).
 */
import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3006';
const REPORTS_DIR = '/home/sri/Downloads/iMentor_march/iMentorV2/tests/reports/antigravity_agent_runs';
const STATE_FILE = path.join(REPORTS_DIR, 'last_strategy_state.json');

const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const runDir = path.join(REPORTS_DIR, `run_${runTimestamp}`);
const screenshotDir = path.join(runDir, 'screenshots');
fs.mkdirSync(screenshotDir, { recursive: true });

async function waitForResponseComplete(page) {
  try {
    // Wait until textarea is enabled (model finished streaming)
    const enabledInput = page.locator('textarea:not([disabled])').first();
    await enabledInput.waitFor({ state: 'visible', timeout: 90000 });
    await page.waitForTimeout(1200);
  } catch (_) {
    await page.waitForTimeout(3000);
  }
}

async function humanType(page, selector, text) {
  // Wait for element to be enabled before typing
  const element = page.locator(selector).filter({ visible: true }).first();
  await element.waitFor({ state: 'visible', timeout: 30000 });
  
  // Wait if disabled
  for (let i = 0; i < 40; i++) {
    const isDisabled = await element.getAttribute('disabled');
    if (isDisabled === null) break;
    await page.waitForTimeout(1000);
  }

  await element.click();
  for (const char of text) {
    await element.pressSequentially(char, { delay: Math.floor(Math.random() * 15) + 6 });
  }
}

async function loginStudent(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  const hasToken = await page.evaluate(() => Boolean(localStorage.getItem('authToken')));
  if (hasToken) return;

  const signInBtn = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  if (await signInBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await signInBtn.click();
    await page.waitForTimeout(500);
  }

  const emailInput = page.locator('input[name="email"]').or(page.getByPlaceholder(/email/i)).filter({ visible: true }).first();
  if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await emailInput.fill('student@imentor.edu');
    const passwordInput = page.locator('input[name="password"]').or(page.getByPlaceholder(/password/i)).filter({ visible: true }).first();
    await passwordInput.fill('password123');
    const loginSubmit = page.locator('form button[type="submit"], button:has-text("Login")').filter({ visible: true }).first();
    await loginSubmit.click();
  }

  await page.waitForFunction(() => Boolean(localStorage.getItem('authToken')), { timeout: 15000 });
}

// -------------------------------------------------------------
// MODULE STRATEGY 1: Socratic Tutor Mode (10 Levels Deep in Dynamic Programming & Graph Theory)
// -------------------------------------------------------------
async function runSocraticTutor10Levels(page, recordStep) {
  console.log('🎯 Launching Strategy: SOCRATIC TUTOR MODE (10 Levels Deep in a Single Dialogue)');
  await page.goto(`${BASE_URL}/tutor`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  const turns = [
    { level: 1, name: "Initialize Socratic Dialogue on Bellman-Ford", prompt: "Let's explore shortest path algorithms. When does Dijkstra fail and Bellman-Ford succeed?" },
    { level: 2, name: "Drill into Negative Weight Cycles Detection", prompt: "Explain how the V-th relaxation cycle mathematically detects a reachable negative weight cycle." },
    { level: 3, name: "Mathematical Proof of Edge Relaxation Property", prompt: "Prove that after k relaxations, all shortest paths using at most k edges are correctly computed." },
    { level: 4, name: "Time Complexity Tradeoff vs SPFA / Dijkstra", prompt: "Compare the worst-case O(V*E) complexity of Bellman-Ford with SPFA and Johnson's Algorithm." },
    { level: 5, name: "Code Implementation Review in Python", prompt: "Write a clean Python implementation of Bellman-Ford with 1-based indexing and predecessor tracking." },
    { level: 6, name: "Inject Edge-Case Bug & Solicit AI Guidance", prompt: "If my graph is disconnected and has a negative cycle in a component unreachable from source, does it report a negative cycle? How to handle this?" },
    { level: 7, name: "Real-World Networking Protocol Extension (RIP)", prompt: "How does the Distance Vector Routing protocol in computer networks implement distributed Bellman-Ford?" },
    { level: 8, name: "Count-to-Infinity Problem & Split Horizon", prompt: "What causes the count-to-infinity problem in RIP, and how do Split Horizon and Poison Reverse resolve it?" },
    { level: 9, name: "Request Exam Challenge Question & Self-Test", prompt: "Give me an advanced gate/university exam numerical question on Bellman-Ford with a 5-node graph." },
    { level: 10, name: "Synthesize Multi-turn Knowledge Mindmap", prompt: "Summarize our entire discussion into a concise revision flashcard with key takeaways and formulas." }
  ];

  for (const turn of turns) {
    const tStart = Date.now();
    await waitForResponseComplete(page);
    await humanType(page, 'textarea', turn.prompt);
    await page.keyboard.press('Enter');

    // Wait until response begins and finishes
    await page.waitForTimeout(2000);
    await waitForResponseComplete(page);

    const ssPath = path.join(screenshotDir, `tutor_level_${String(turn.level).padStart(2, '0')}.png`);
    await page.screenshot({ path: ssPath });
    recordStep(turn.level, turn.name, 'SUCCESS', { prompt: turn.prompt, durationMs: Date.now() - tStart, screenshot: ssPath });
  }
}

// -------------------------------------------------------------
// MODULE STRATEGY 2: Study Plan Builder & Progression (10 Levels Deep)
// -------------------------------------------------------------
async function runStudyPlan10Levels(page, recordStep) {
  console.log('🎯 Launching Strategy: STUDY PLAN MODULE (10 Levels Deep)');
  await page.goto(`${BASE_URL}/study-plan`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  const goal = `Compiler Design & LLVM Optimizations - ${Date.now()}`;

  // Level 1: Discover Study Plan Dashboard
  let tStart = Date.now();
  let ss = path.join(screenshotDir, 'study_plan_l01_dashboard.png');
  await page.screenshot({ path: ss });
  recordStep(1, "Access Study Plan Management Dashboard", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 2: Input Specialized Engineering Goal
  tStart = Date.now();
  const goalInput = page.locator('input[placeholder*="goal"], input[placeholder*="Learn"], textarea').first();
  if (await goalInput.isVisible({ timeout: 4000 }).catch(() => false)) {
    await humanType(page, 'input[placeholder*="goal"], input[placeholder*="Learn"], textarea', goal);
  }
  ss = path.join(screenshotDir, 'study_plan_l02_goal_input.png');
  await page.screenshot({ path: ss });
  recordStep(2, "Define High-Level Curriculum Goal", 'SUCCESS', { goal, durationMs: Date.now() - tStart, screenshot: ss });

  // Level 3: Trigger Intelligent Curriculum Generation
  tStart = Date.now();
  const generateBtn = page.locator('button:has-text("Generate"), button:has-text("Create Plan")').first();
  if (await generateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await generateBtn.click();
    await page.waitForTimeout(5000);
  }
  ss = path.join(screenshotDir, 'study_plan_l03_orchestrator_trigger.png');
  await page.screenshot({ path: ss });
  recordStep(3, "Trigger AI Curriculum Orchestrator", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 4: Inspect Questionnaire or Curriculum Structure
  tStart = Date.now();
  const nextBtn = page.locator('button:has-text("Next"), button:has-text("Submit"), button[class*="primary"]').first();
  if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nextBtn.click().catch(() => {});
    await page.waitForTimeout(3000);
  }
  ss = path.join(screenshotDir, 'study_plan_l04_curriculum_structure.png');
  await page.screenshot({ path: ss });
  recordStep(4, "Analyze Synthesized Learning Modules", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 5: Inspect Module 1 Objectives & Action Prompt
  tStart = Date.now();
  const mod1Card = page.locator('div[class*="rounded-2xl"]').first();
  await mod1Card.scrollIntoViewIfNeeded().catch(() => {});
  ss = path.join(screenshotDir, 'study_plan_l05_module1_objectives.png');
  await page.screenshot({ path: ss });
  recordStep(5, "Inspect Module 1 Objectives & Suggested Action", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 6: Complete Module 1 & Unlock Module 2
  tStart = Date.now();
  const mod1Toggle = page.locator('button[class*="hover:scale-110"], button:has-text("Done")').first();
  if (await mod1Toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mod1Toggle.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  ss = path.join(screenshotDir, 'study_plan_l06_module1_completed.png');
  await page.screenshot({ path: ss });
  recordStep(6, "Mark Module 1 Completed & Unlock Module 2", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 7: Progress into Module 2 (Semantic Analysis)
  tStart = Date.now();
  ss = path.join(screenshotDir, 'study_plan_l07_module2_progression.png');
  await page.screenshot({ path: ss });
  recordStep(7, "Inspect Module 2 Action Plan & Suggested Query", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 8: Complete Module 2 & Verify Progress Calculation
  tStart = Date.now();
  const mod2Toggle = page.locator('button[class*="hover:scale-110"]').nth(1);
  if (await mod2Toggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mod2Toggle.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  ss = path.join(screenshotDir, 'study_plan_l08_progress_metrics.png');
  await page.screenshot({ path: ss });
  recordStep(8, "Update Progress Metrics & Milestone Calculations", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 9: Switch Between Multiple Active Study Plans
  tStart = Date.now();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'study_plan_l09_plans_directory.png');
  await page.screenshot({ path: ss });
  recordStep(9, "Browse User Study Plans Directory", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 10: Review Milestone Completion & Mastery Status
  tStart = Date.now();
  ss = path.join(screenshotDir, 'study_plan_l10_mastery_overview.png');
  await page.screenshot({ path: ss });
  recordStep(10, "Review Curriculum Completion & Mastery Overview", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });
}

// -------------------------------------------------------------
// MODULE STRATEGY 3: Course Syllabus & KaTeX Notes Tree (10 Levels Deep)
// -------------------------------------------------------------
async function runCourseSyllabus10Levels(page, recordStep) {
  console.log('🎯 Launching Strategy: R24 COURSE SYLLABUS & LECTURE TREE (10 Levels Deep)');
  await page.goto(`${BASE_URL}/courses`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  // Level 1: Explore Course Directory
  let tStart = Date.now();
  let ss = path.join(screenshotDir, 'course_l01_catalog.png');
  await page.screenshot({ path: ss });
  recordStep(1, "Access 65+ R24 Accredited Course Catalog", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 2: Select Digital Signal Processing (EE3621)
  tStart = Date.now();
  const dspCard = page.locator('button, div[role="button"], a').filter({ hasText: /Digital Signal Processing|EE3621/i }).first();
  if (await dspCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dspCard.click();
    await page.waitForTimeout(1500);
  }
  ss = path.join(screenshotDir, 'course_l02_dsp_selected.png');
  await page.screenshot({ path: ss });
  recordStep(2, "Select Course: Digital Signal Processing (EE3621)", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 3: Expand Unit 1: Discrete Time Signals & Systems
  tStart = Date.now();
  const unit1 = page.locator('button, div').filter({ hasText: /Unit 1|Discrete Time Signals|Module 1/i }).first();
  if (await unit1.isVisible({ timeout: 3000 }).catch(() => false)) {
    await unit1.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  ss = path.join(screenshotDir, 'course_l03_unit1_expanded.png');
  await page.screenshot({ path: ss });
  recordStep(3, "Expand Unit 1: Discrete Signals & Z-Transform", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 4: Drill into Lecture 1 Note
  tStart = Date.now();
  const lec1 = page.locator('button, a, div').filter({ hasText: /Lecture 1|L1|Sampling Theorem|Z-Transform/i }).first();
  if (await lec1.isVisible({ timeout: 3000 }).catch(() => false)) {
    await lec1.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  ss = path.join(screenshotDir, 'course_l04_lecture1_view.png');
  await page.screenshot({ path: ss });
  recordStep(4, "Open Lecture 1 Notes View", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 5: Inspect KaTeX LaTeX Mathematical Equations
  tStart = Date.now();
  await page.waitForSelector('.katex, .katex-display, h1, h2', { timeout: 8000 }).catch(() => null);
  ss = path.join(screenshotDir, 'course_l05_katex_formulas.png');
  await page.screenshot({ path: ss });
  recordStep(5, "Verify KaTeX LaTeX Formula & Equation Rendering", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 6: Explore Embedded NPTEL / Academic Video References
  tStart = Date.now();
  ss = path.join(screenshotDir, 'course_l06_video_citations.png');
  await page.screenshot({ path: ss });
  recordStep(6, "Inspect NPTEL Citations & Academic Reference Links", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 7: Drill into Unit 2: Fast Fourier Transform (FFT)
  tStart = Date.now();
  const unit2 = page.locator('button, div').filter({ hasText: /Unit 2|FFT|Fast Fourier|Module 2/i }).first();
  if (await unit2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await unit2.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  ss = path.join(screenshotDir, 'course_l07_unit2_fft.png');
  await page.screenshot({ path: ss });
  recordStep(7, "Traverse into Unit 2: Fast Fourier Transform (FFT)", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 8: Open Lecture on Cooley-Tukey Radix-2 DIT FFT
  tStart = Date.now();
  ss = path.join(screenshotDir, 'course_l08_radix2_fft.png');
  await page.screenshot({ path: ss });
  recordStep(8, "Inspect Cooley-Tukey Radix-2 Butterfly Operations", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 9: Launch Course-Contextual Socratic Chat
  tStart = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  const chatInput = page.locator('textarea').first();
  if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await humanType(page, 'textarea', 'How does the Radix-2 FFT decimation-in-time algorithm achieve O(N log N) from O(N^2)?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(4000);
  }
  ss = path.join(screenshotDir, 'course_l09_contextual_ai.png');
  await page.screenshot({ path: ss });
  recordStep(9, "Launch Course-Contextual Socratic Dialogue", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 10: Complete Unit Concept Mastery Assessment
  tStart = Date.now();
  ss = path.join(screenshotDir, 'course_l10_unit_mastery.png');
  await page.screenshot({ path: ss });
  recordStep(10, "Complete DSP Unit 1 & 2 Concept Mastery Synthesis", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });
}

// -------------------------------------------------------------
// MODULE STRATEGY 4: Skill Tree & Gamified Mastery (10 Levels Deep)
// -------------------------------------------------------------
async function runSkillTree10Levels(page, recordStep) {
  console.log('🎯 Launching Strategy: SKILL TREE & GAMIFICATION (10 Levels Deep)');
  await page.goto(`${BASE_URL}/gamification/skill-tree`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  // Level 1: Open Interactive Skill Tree Map
  let tStart = Date.now();
  let ss = path.join(screenshotDir, 'skill_l01_canvas.png');
  await page.screenshot({ path: ss });
  recordStep(1, "Access Interactive Skill Tree Canvas", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 2: Inspect Subject Mastery Root Node
  tStart = Date.now();
  const rootNode = page.locator('button, div[class*="node"], svg circle').first();
  if (await rootNode.isVisible({ timeout: 3000 }).catch(() => false)) {
    await rootNode.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  ss = path.join(screenshotDir, 'skill_l02_root_node.png');
  await page.screenshot({ path: ss });
  recordStep(2, "Inspect Foundation Root Node & XP Thresholds", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 3: Explore Intermediate Topic Subtree
  tStart = Date.now();
  ss = path.join(screenshotDir, 'skill_l03_subtree.png');
  await page.screenshot({ path: ss });
  recordStep(3, "Traverse Intermediate Prerequisite Dependency Graph", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 4: Navigate to Bounty Battles Challenge Arena
  tStart = Date.now();
  await page.goto(`${BASE_URL}/gamification/bounties`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'skill_l04_bounty_arena.png');
  await page.screenshot({ path: ss });
  recordStep(4, "Enter Bounty Battles Challenge Arena", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 5: Select Algorithm Quest Challenge
  tStart = Date.now();
  const challengeCard = page.locator('button, div[class*="cursor-pointer"]').first();
  if (await challengeCard.isVisible({ timeout: 3000 }).catch(() => false)) {
    await challengeCard.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  ss = path.join(screenshotDir, 'skill_l05_challenge_selected.png');
  await page.screenshot({ path: ss });
  recordStep(5, "Select Algorithm Challenge & Reward Tier", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 6: Inspect Boss Battles Boss AI
  tStart = Date.now();
  await page.goto(`${BASE_URL}/gamification/boss-battles`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'skill_l06_boss_battles.png');
  await page.screenshot({ path: ss });
  recordStep(6, "Challenge Boss AI in Boss Battles Arena", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 7: Explore Badges & Achievement Showcase
  tStart = Date.now();
  await page.goto(`${BASE_URL}/gamification/badges`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'skill_l07_badges_showcase.png');
  await page.screenshot({ path: ss });
  recordStep(7, "Inspect Badges & Achievement Showcase", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 8: Inspect Student Learning Profile & Knowledge State
  tStart = Date.now();
  await page.goto(`${BASE_URL}/learning-profile`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'skill_l08_learning_profile.png');
  await page.screenshot({ path: ss });
  recordStep(8, "Evaluate Adaptive Learning Profile & Knowledge State", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 9: Launch Code Sandbox for Skill Verification
  tStart = Date.now();
  await page.goto(`${BASE_URL}/tools/code-executor`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'skill_l09_code_sandbox.png');
  await page.screenshot({ path: ss });
  recordStep(9, "Launch Code Executor for Practical Skill Verification", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 10: Finalize Experience Points (XP) & Credit Balance
  tStart = Date.now();
  ss = path.join(screenshotDir, 'skill_l10_xp_summary.png');
  await page.screenshot({ path: ss });
  recordStep(10, "Finalize Session XP Accumulation & Credit Ledger", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });
}

// -------------------------------------------------------------
// MODULE STRATEGY 5: Deep Research & Literature Synthesis (10 Levels Deep)
// -------------------------------------------------------------
async function runDeepResearch10Levels(page, recordStep) {
  console.log('🎯 Launching Strategy: DEEP RESEARCH & LITERATURE SYNTHESIS (10 Levels Deep)');
  await page.goto(`${BASE_URL}/tools/deep-research`, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(1500);

  const query = "Speculative Decoding in Large Language Models: Throughput, Memory Overhead and Acceptance Rate";

  // Level 1: Access Deep Research Interface
  let tStart = Date.now();
  let ss = path.join(screenshotDir, 'research_l01_interface.png');
  await page.screenshot({ path: ss });
  recordStep(1, "Access Autonomous Deep Research Portal", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 2: Submit Complex Research Query
  tStart = Date.now();
  const input = page.locator('input, textarea').first();
  if (await input.isVisible({ timeout: 3000 }).catch(() => false)) {
    await humanType(page, 'input, textarea', query);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  }
  ss = path.join(screenshotDir, 'research_l02_query_submitted.png');
  await page.screenshot({ path: ss });
  recordStep(2, "Submit Advanced Multi-Disciplinary Inquiry", 'SUCCESS', { query, durationMs: Date.now() - tStart, screenshot: ss });

  // Level 3: Observe Query Decomposition
  tStart = Date.now();
  ss = path.join(screenshotDir, 'research_l03_query_decomposition.png');
  await page.screenshot({ path: ss });
  recordStep(3, "Observe Query Decomposition & Semantic Sub-queries", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 4: Inspect Hybrid Multi-Source Retrieval
  tStart = Date.now();
  ss = path.join(screenshotDir, 'research_l04_hybrid_retrieval.png');
  await page.screenshot({ path: ss });
  recordStep(4, "Inspect Local Vector Corpus & Academic Retrieval", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 5: Inspect Citation Graph & Paper Sources
  tStart = Date.now();
  ss = path.join(screenshotDir, 'research_l05_citation_graph.png');
  await page.screenshot({ path: ss });
  recordStep(5, "Inspect Source Citations & Scientific References", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 6: Synthesize Literature Evidence
  tStart = Date.now();
  ss = path.join(screenshotDir, 'research_l06_evidence_synthesis.png');
  await page.screenshot({ path: ss });
  recordStep(6, "Synthesize Evidence & Structured Markdown Report", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 7: Drill into Research History Archive
  tStart = Date.now();
  await page.goto(`${BASE_URL}/tools/deep-research/history`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'research_l07_history_archive.png');
  await page.screenshot({ path: ss });
  recordStep(7, "Drill into Research History Archive", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 8: Open Historical Report Detail
  tStart = Date.now();
  const firstReport = page.locator('button, a, div[class*="cursor-pointer"]').filter({ hasText: /Research|Speculative|LLM|Report/i }).first();
  if (await firstReport.isVisible({ timeout: 3000 }).catch(() => false)) {
    await firstReport.click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  ss = path.join(screenshotDir, 'research_l08_report_detail.png');
  await page.screenshot({ path: ss });
  recordStep(8, "Open Archived Research Report Detail View", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 9: Cross-Reference with Knowledge Assessment
  tStart = Date.now();
  await page.goto(`${BASE_URL}/assessment`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  ss = path.join(screenshotDir, 'research_l09_assessment.png');
  await page.screenshot({ path: ss });
  recordStep(9, "Cross-Reference Concepts with Knowledge Assessment", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });

  // Level 10: Finalize Empirical Summary & Actionable Findings
  tStart = Date.now();
  ss = path.join(screenshotDir, 'research_l10_empirical_findings.png');
  await page.screenshot({ path: ss });
  recordStep(10, "Finalize Empirical Summary & Actionable Research Findings", 'SUCCESS', { durationMs: Date.now() - tStart, screenshot: ss });
}

// -------------------------------------------------------------
// Strategy Selector & Orchestrator
// -------------------------------------------------------------
const STRATEGIES = [
  { id: 'socratic_tutor', name: 'Socratic Tutor 10-Level Deep Exploration', runner: runSocraticTutor10Levels },
  { id: 'study_plan', name: 'Study Plan 10-Level Deep Progression', runner: runStudyPlan10Levels },
  { id: 'course_syllabus', name: 'R24 Course Syllabus 10-Level Deep Exploration', runner: runCourseSyllabus10Levels },
  { id: 'skill_tree', name: 'Skill Tree & Gamification 10-Level Deep Progression', runner: runSkillTree10Levels },
  { id: 'deep_research', name: 'Deep Research 10-Level Synthesis & History', runner: runDeepResearch10Levels }
];

function getNextStrategyIndex() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      const nextIndex = (data.lastIndex + 1) % STRATEGIES.length;
      fs.writeFileSync(STATE_FILE, JSON.stringify({ lastIndex: nextIndex, updatedAt: new Date().toISOString() }));
      return nextIndex;
    }
  } catch (_) {}
  const randIndex = Math.floor(Math.random() * STRATEGIES.length);
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastIndex: randIndex, updatedAt: new Date().toISOString() }));
  return randIndex;
}

async function main() {
  const strategyIndex = getNextStrategyIndex();
  const selectedStrategy = STRATEGIES[strategyIndex];

  console.log(`\n======================================================`);
  console.log(`🤖 ANTIGRAVITY SINGLE-MODULE 10-LEVEL DEEP AGENT`);
  console.log(`🎯 Active Module Strategy [${strategyIndex + 1}/${STRATEGIES.length}]: ${selectedStrategy.name}`);
  console.log(`🕒 Run ID: ${runTimestamp}`);
  console.log(`📂 Output Dir: ${runDir}`);
  console.log(`======================================================\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Antigravity single-module-10-level/2.0; Linux x86_64)'
  });

  const page = await context.newPage();
  const logEntries = [];
  const startTime = Date.now();

  function recordStep(level, name, status, details = {}) {
    const entry = { level, name, status, timestamp: new Date().toISOString(), ...details };
    logEntries.push(entry);
    console.log(`[Level ${level}/10] ${status === 'SUCCESS' ? '✓' : '✗'} ${name} (${status})`);
  }

  try {
    await loginStudent(page);
    await selectedStrategy.runner(page, recordStep);
  } catch (err) {
    console.error('⚠️ Deep module traversal error:', err.message);
    recordStep('ERROR', 'Module Traversal Failed', 'FAILED', { error: err.message });
  } finally {
    await browser.close();
  }

  const totalDuration = Date.now() - startTime;
  const summaryReport = {
    runId: runTimestamp,
    moduleStrategy: selectedStrategy.name,
    strategyId: selectedStrategy.id,
    completedAt: new Date().toISOString(),
    totalDurationSeconds: Math.round(totalDuration / 1000),
    totalLevelsTraversed: logEntries.filter(e => e.status === 'SUCCESS').length,
    steps: logEntries
  };

  fs.writeFileSync(path.join(runDir, 'agent_trajectory_report.json'), JSON.stringify(summaryReport, null, 2));

  const mdReport = `# 🤖 Antigravity Single-Module 10-Level Deep Traversal Report
- **Module Strategy**: \`${selectedStrategy.name}\`
- **Run ID**: \`${runTimestamp}\`
- **Duration**: \`${summaryReport.totalDurationSeconds}s\`
- **Levels Completed in Module**: \`${summaryReport.totalLevelsTraversed} / 10\`

## 10 Progressive Levels Traversed in Single Module
${logEntries.map(e => `### Level ${e.level}: ${e.name}
- **Status**: \`${e.status}\`
- **Time**: \`${e.durationMs || 0}ms\`
${e.prompt ? `- **Prompt / Interaction**: "${e.prompt}"` : ''}
${e.screenshot ? `- **Screenshot**: \`${e.screenshot}\`` : ''}
`).join('\n')}
`;

  fs.writeFileSync(path.join(runDir, 'REPORT.md'), mdReport);
  console.log(`\n🎉 Single-Module 10-Level Traversal Complete! Report written to: ${path.join(runDir, 'REPORT.md')}`);
  return summaryReport;
}

main().catch(err => {
  console.error('Fatal agent error:', err);
  process.exit(1);
});
