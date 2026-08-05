// tests/e2e/helpers/tutor-helpers.js
// Shared tutor-mode helpers for E2E tests

const BASE_API = 'http://localhost:5005/api';

/* ─── Selectors ────────────────────────────────────────────────────── */

export const TUTOR_SEL = {
  courseSelect:       'select[data-tutor-tour="subject-select"]',
  roadmapPanel:      '[data-tutor-tour="roadmap-panel"]',
  roadmapTab:        'button[data-tutor-tour="roadmap-tab"]',
  quizTab:           'button[data-tutor-tour="quiz-tab"]',
  heroArea:          '[data-tutor-tour="hero"]',
  chatInput:         '[data-tutor-tour="chat-input"]',
  exitButton:        'a[title="Exit Tutor Mode"]',

  // Curriculum panel elements
  moduleRow:         '[data-module-id]',
  topicRow:          '[data-topic-id]',
  subtopicRow:       '[data-subtopic-id]',
  completedIcon:     '.text-emerald-400, .text-green-400',
  currentIndicator:  '.animate-pulse',

  // Progress footer
  progressFooter:    'text=/\\d+%/',

  // Bot messages (reuse from chat-helpers)
  botMessage:        '.message-bubble, [class*="message-bubble"], [class*="items-start"] .message-bubble-wrapper',
  streamingCursor:   '.streaming-cursor',
};

/* ─── Navigation ───────────────────────────────────────────────────── */

/**
 * Navigate to tutor mode and wait for page load.
 */
export async function navigateToTutor(page) {
  await page.goto('/tutor');
  await page.waitForTimeout(2000);
  // Wait for either course selector or tutor label (avoid double-quote in combined selector)
  try {
    await page.waitForSelector(TUTOR_SEL.courseSelect, { timeout: 10000 });
  } catch {
    await page.waitForSelector('text=/tutor mode/i', { timeout: 10000 });
  }
}

/**
 * Select a course in the tutor mode dropdown.
 */
export async function selectTutorCourse(page, courseName) {
  const select = page.locator(TUTOR_SEL.courseSelect);
  await select.waitFor({ state: 'visible', timeout: 5000 });

  const options = await select.locator('option').allTextContents();
  const match = options.find(o => new RegExp(courseName, 'i').test(o));
  if (!match) throw new Error(`Course "${courseName}" not found in options: ${options.join(', ')}`);

  await select.selectOption({ label: match });
  await page.waitForTimeout(3000); // curriculum loads

  // Wait for the initial welcome message to start and complete streaming
  try {
    await page.waitForSelector(TUTOR_SEL.botMessage, { timeout: 15000 });
    // Wait up to 300 seconds for streaming to start
    await page.waitForSelector(TUTOR_SEL.streamingCursor, { state: 'visible', timeout: 300000 });
    // Wait for streaming to finish
    await page.waitForSelector(TUTOR_SEL.streamingCursor, { state: 'hidden', timeout: 300000 });
    await page.waitForTimeout(1000);
  } catch (err) {
    // If no welcome message is streamed or if it was instant (cached), proceed
  }
}

/* ─── Progress Management (API) ────────────────────────────────────── */

/**
 * Clear all tutor progress for a course via API.
 * Uses POST /api/progress/update with type='sync' and empty arrays.
 */
export async function clearTutorProgress(page, courseName) {
  // Retry reading token until it's available
  let token = '';
  for (let i = 0; i < 10; i++) {
    token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token') || '');
    if (token && token.length > 10) break;
    await page.waitForTimeout(500);
  }

  const response = await page.request.post(`${BASE_API}/progress/update`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      courseName,
      type: 'sync',
      id: 'bulk',
      completedTopics: [],
      completedModules: [],
      completedSubtopics: []
    }
  });

  if (!response.ok()) {
    console.warn(`⚠ clearTutorProgress failed: ${response.status()} ${await response.text()}`);
  }
}

/**
 * Save specific progress items via the tutor progress endpoint.
 * Uses POST /api/chat/tutor/progress/:course
 */
export async function saveTutorProgress(page, courseName, progress) {
  const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token') || '');

  const response = await page.request.post(
    `${BASE_API}/chat/progress/${encodeURIComponent(courseName)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: progress
    }
  );

  return response.ok();
}

/* ─── Curriculum Structure (API) ───────────────────────────────────── */

/**
 * Fetch the full curriculum structure for a course via API.
 * Returns { modules: [{ id, name, topics: [{ id, name, subtopics: [...] }] }] }
 */
export async function getCurriculumStructure(page, courseName) {
  const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token') || '');

  const response = await page.request.get(
    `${BASE_API}/chat/curriculum/${encodeURIComponent(courseName)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok()) {
    throw new Error(`Failed to fetch curriculum for "${courseName}": ${response.status()}`);
  }

  const body = await response.json();
  return body.curriculum;
}

/* ─── Chat within Tutor Mode ───────────────────────────────────────── */

/**
 * Send a message in tutor mode and wait for the Socratic response.
 * Returns the bot response text.
 */
export async function sendTutorMessage(page, text, timeout = 120000) {
  // Dismiss any level-up or overlay modals that might block input/send clicks
  const closeBtn = page.locator('button[aria-label="Close modal"], button[aria-label="Close"], button:has-text("Close"), button:has-text("Keep Learning")').first();
  if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(text);

  // Click send or press Enter
  const sendBtn = page.locator('button[title="Send message (Enter)"]');
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Retry closing modal if it blocked during send action
    try {
      await sendBtn.click({ timeout: 3000 });
    } catch {
      const retryClose = page.locator('button[aria-label="Close modal"], button[aria-label="Close"], button:has-text("Close"), button:has-text("Keep Learning")').first();
      if (await retryClose.isVisible({ timeout: 1000 }).catch(() => false)) {
        await retryClose.click();
        await page.waitForTimeout(1000);
      }
      await sendBtn.click();
    }
  } else {
    await input.press('Enter');
  }

  // Wait for bot response bubble to appear
  await page.waitForSelector(TUTOR_SEL.botMessage, { timeout });

  // Get last bot message bubble
  let msgs = page.locator(TUTOR_SEL.botMessage);
  let count = await msgs.count();
  if (count > 0) {
    let lastMsg = msgs.nth(count - 1);
    let lastText = (await lastMsg.textContent()) || '';

    // If the message bubble contains a loading placeholder, wait for streaming to start and finish
    if (lastText.includes('Thinking') || lastText.includes('reasoning') || lastText.includes('🧠') || lastText.includes('depth')) {
      try {
        // Wait up to 300 seconds for the streaming cursor to become visible
        await page.waitForSelector(TUTOR_SEL.streamingCursor, { state: 'visible', timeout: 300000 });
      } catch (err) { /* may be instant */ }
      try {
        // Wait for the streaming cursor to be hidden (streaming complete)
        await page.waitForSelector(TUTOR_SEL.streamingCursor, { state: 'hidden', timeout: 300000 });
      } catch (err) { /* already done */ }
      await page.waitForTimeout(1000);
    }
  }

  // Refetch last bot message text to get the fully streamed content
  msgs = page.locator(TUTOR_SEL.botMessage);
  count = await msgs.count();
  return count > 0 ? (await msgs.nth(count - 1).textContent()) || '' : '';
}

/**
 * Assert the tutor response is Socratic (contains a question).
 */
export function assertSocraticResponse(text) {
  const hasQuestion = /\?/.test(text);
  const hasPrompt = /what|how|why|can you|think about|consider|try/i.test(text);
  if (!hasQuestion && !hasPrompt) {
    console.warn(`⚠ Response may not be Socratic (no question found): "${text.slice(0, 150)}..."`);
  }
  return hasQuestion || hasPrompt;
}

/* ─── Module / Subtopic Navigation ─────────────────────────────────── */

/**
 * Click on a module in the curriculum sidebar to expand it.
 */
export async function expandModule(page, moduleName) {
  const moduleEl = page.locator('div, span, button').filter({ hasText: new RegExp(moduleName, 'i') }).first();
  if (await moduleEl.isVisible().catch(() => false)) {
    await moduleEl.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Click on a topic to expand its subtopics.
 */
export async function expandTopic(page, topicName) {
  const topicEl = page.locator('div, span, button').filter({ hasText: new RegExp(topicName, 'i') }).first();
  if (await topicEl.isVisible().catch(() => false)) {
    await topicEl.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Get the current progress percentage from the tutor UI.
 * Returns a number 0-100 or null if not found.
 */
export async function getProgressPercentage(page) {
  const progressText = await page.locator('text=/\\d+%/').first().textContent().catch(() => null);
  if (!progressText) return null;
  const match = progressText.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : null;
}

/* ─── Student Profile Answer Generators ────────────────────────────── */

/**
 * Generate a "weak student" answer for a given subtopic.
 * Returns confused, wrong, or uncertain answers.
 */
export function weakStudentAnswer(subtopicName, attempt = 1) {
  const confused = [
    `I'm not sure about ${subtopicName}. Is it related to databases?`,
    `I think ${subtopicName} means sorting data? I'm confused.`,
    `Hmm, I don't really understand ${subtopicName}. Can you help me?`,
    `Maybe ${subtopicName} is about storing files on a computer?`,
    `I've heard of ${subtopicName} but I don't know what it means exactly.`,
  ];
  const partiallyCorrect = [
    `I think ${subtopicName} has something to do with how computers learn from data?`,
    `It's when you use math to find patterns, right?`,
    `I believe it involves training a model, but I'm not sure how.`,
    `So ${subtopicName} helps the computer make predictions?`,
  ];
  const correct = [
    `OK so ${subtopicName} is about training a model on labeled data to make predictions on new unseen data.`,
    `I understand now — ${subtopicName} means the model learns from examples and generalizes.`,
  ];

  if (attempt <= 1) return confused[Math.floor(Math.random() * confused.length)];
  if (attempt === 2) return partiallyCorrect[Math.floor(Math.random() * partiallyCorrect.length)];
  return correct[Math.floor(Math.random() * correct.length)];
}

/**
 * Generate an "average student" answer for a given subtopic.
 * Returns basically correct but shallow answers.
 */
export function averageStudentAnswer(subtopicName, attempt = 1) {
  const basic = [
    `${subtopicName} is a technique used in machine learning to improve model performance. It works by processing data and finding patterns.`,
    `I know that ${subtopicName} involves mathematical optimization. The model adjusts its parameters to minimize error.`,
    `${subtopicName} is about training the model — you feed it data and it learns the relationships between inputs and outputs.`,
  ];
  const deeper = [
    `So ${subtopicName} works by iteratively updating the model's weights. You compute the gradient and move in the direction that reduces the loss function.`,
    `I think the application would be using ${subtopicName} in a classification task — for example, predicting whether an email is spam based on features.`,
    `The key trade-off with ${subtopicName} is between bias and variance — too simple a model underfits, too complex overfits.`,
  ];

  if (attempt <= 1) return basic[Math.floor(Math.random() * basic.length)];
  return deeper[Math.floor(Math.random() * deeper.length)];
}

/**
 * Generate an "expert student" answer for a given subtopic.
 * Returns detailed, technically precise answers.
 */
export function expertStudentAnswer(subtopicName) {
  const expert = [
    `${subtopicName} can be formally defined in the PAC learning framework. Given a hypothesis class H, a learning algorithm A is (ε,δ)-PAC learnable if for sufficient samples m ≥ m₀(ε,δ), P(error(h) ≤ ε) ≥ 1-δ. In practice, this connects to the bias-variance decomposition where E[(f-ĥ)²] = Bias² + Variance + irreducible noise σ².`,
    `The mathematical foundation of ${subtopicName} relies on optimization over a loss surface. For convex losses like cross-entropy, SGD converges at rate O(1/√T). For non-convex deep nets, we rely on techniques like momentum (β ≈ 0.9), learning rate scheduling, and batch normalization to stabilize training. The gradient ∇θL is computed via reverse-mode autodiff in O(n) time.`,
    `${subtopicName} in deep learning leverages the universal approximation theorem — a network with one hidden layer of sufficient width can approximate any continuous function on a compact set. In practice, depth matters more than width due to the compositional structure of features. Regularization via dropout (p ≈ 0.5), weight decay (λ ~ 1e-4), and data augmentation prevent overfitting.`,
  ];

  return expert[Math.floor(Math.random() * expert.length)];
}

/* ─── Skill Tree Selectors ─────────────────────────────────────────── */

export const SKILL_SEL = {
  newGameButton:     'button >> text=/new skill tree/i',
  startGameButton:   'button >> text=/start the game/i',
  topicInput:        'input[placeholder]',
  nextButton:        'button >> text=/next/i',
  assessmentHeading: 'text=/knowledge assessment/i',
  answerTextarea:    'textarea[placeholder*="Share"]',
  completeButton:    'button >> text=/complete assessment/i',
  nextQuestionButton:'button >> text=/next question/i',
  exploreButton:     'button >> text=/explore your skill tree/i',
  playButton:        'button >> text=/start|continue/i',
  backToMapButton:   'button >> text=/back to map/i',
  nextLevelButton:   'button >> text=/next level/i',
  retryButton:       'button >> text=/retry/i',
};

/* ─── Admin Selectors ──────────────────────────────────────────────── */

export const ADMIN_SEL = {
  heading:           'text=/professor.*dashboard/i',
  refreshButton:     'button[title="Refresh Admin Data"]',
  analyticsButton:   'button[title="Platform Analytics"]',
  usersButton:       'button[title="User Management & Chats"]',
  learningProfiles:  'button[title="Learning Profiles"]',
  gamificationButton:'button[title="Gamification"]',
  logoutButton:      'button >> text=/logout admin/i',
};
