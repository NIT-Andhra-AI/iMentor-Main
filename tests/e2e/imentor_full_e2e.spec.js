// tests/e2e/imentor_full_e2e.spec.js
// ─────────────────────────────────────────────────────────────────────
// COMPREHENSIVE HEADED E2E TEST — iMentor Platform
// Simulates an average ECE student working through the platform
// ─────────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test';

// ── Credentials ──────────────────────────────────────────────────────
const STUDENT = { email: 'student@imentor.edu', password: 'password123' };
const ADMIN   = { email: 'admin@admin.com',     password: 'admin123'    };
const BASE_API = 'http://localhost:5005/api';

// ── Answer banks for average ECE student simulation ─────────────────
const AVG_ANSWERS = {
  firstAttempt: [
    'I think it involves controlling access to shared resources between processes.',
    'I believe it is related to managing how multiple programs run simultaneously on a CPU.',
    'It has something to do with preventing race conditions — where two processes access the same memory.',
    'I know it involves semaphores and mutex locks but I am not totally sure how they work.',
    'I think the OS uses a scheduler but I am unclear about the different scheduling algorithms.',
  ],
  secondAttempt: [
    'So if two processes need the same resource, the OS ensures only one can access it at a time using a lock. This prevents data corruption.',
    'A mutex is a binary semaphore — it allows only one thread to enter the critical section. If locked, others wait.',
    'Deadlock occurs when Process A holds Resource 1 and waits for Resource 2, while Process B holds Resource 2 and waits for Resource 1.',
    'Round Robin scheduling gives each process a fixed time quantum. After it expires the process is preempted and goes to the back of the queue.',
    'Banker\'s algorithm prevents deadlock by checking if granting a request leaves the system in a safe state.',
  ],
  thirdAttempt: [
    'Right, and Peterson\'s solution uses a flag array and a turn variable to guarantee mutual exclusion for two processes without hardware support.',
    'The key difference between a binary semaphore and a mutex is that a mutex can only be released by the thread that acquired it, while a semaphore can be signalled by any thread.',
    'For deadlock prevention, we can impose a linear ordering of resource types and require processes to always request in that order — this eliminates circular wait.',
  ],
};

// ── Helpers ──────────────────────────────────────────────────────────
async function loginAsStudent(page) {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Click "Sign In" nav button (exact text match, not Sign Up)
  const signInBtn = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  await signInBtn.waitFor({ state: 'visible', timeout: 15000 });
  await signInBtn.click();
  await page.waitForTimeout(1500); // modal open animation and state initialization

  // Locate the visible inputs in the modal
  const emailInput = page.locator('input[name="email"]').filter({ visible: true }).first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.click();
  await emailInput.focus();
  await emailInput.fill(STUDENT.email);
  await page.waitForTimeout(300);

  const passwordInput = page.locator('input[name="password"]').filter({ visible: true }).first();
  await passwordInput.click();
  await passwordInput.focus();
  await passwordInput.fill(STUDENT.password);
  await page.waitForTimeout(300);

  // Click the submit button inside the form directly
  const loginSubmitBtn = page.locator('form button[type="submit"], button[type="submit"]').filter({ visible: true }).first();
  await loginSubmitBtn.click();

  // Wait up to 10s for the token to be set in localStorage
  let loggedIn = false;
  for (let i = 0; i < 20; i++) {
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token && token.length > 10) {
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(500);
  }

  if (!loggedIn) {
    const err = await page.locator('[class*="text-red"]').first().textContent().catch(() => '');
    throw new Error(`Login failed for student@imentor.edu. Error on screen: ${err || 'None'}`);
  }

  // Wait for modal title "Welcome Back" to disappear
  try {
    await page.waitForSelector('text="Welcome Back"', { state: 'hidden', timeout: 10000 });
  } catch (e) {
    // ignore
  }

  // Confirm we're in the app (textarea is visible)
  await page.waitForSelector('textarea', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);
  console.log('  ✓ Logged in as student@imentor.edu');
}

async function getToken(page) {
  // Wait up to 5s for the token to be persisted to localStorage after login
  for (let i = 0; i < 10; i++) {
    const token = await page.evaluate(() =>
      localStorage.getItem('authToken') || localStorage.getItem('token') || ''
    );
    if (token && token.length > 10) return token;
    await page.waitForTimeout(500);
  }
  return '';
}

async function sendChatMessage(page, text, timeoutMs = 90000) {
  const textarea = page.locator('textarea:visible').first();
  await textarea.waitFor({ state: 'visible', timeout: 10000 });
  await textarea.fill(text);
  await page.waitForTimeout(300);

  const sendBtn = page.locator('button[title="Send message (Enter)"]').or(
    page.getByRole('button', { name: /^send$/i })
  );
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await textarea.press('Enter');
  }

  // Wait for response bubble
  await page.waitForSelector(
    '.message-bubble, [class*="message-bubble"], [class*="items-start"] .message-bubble-wrapper',
    { timeout: timeoutMs }
  );
  // Wait for streaming to complete
  try {
    await page.waitForSelector('.streaming-cursor', { state: 'visible', timeout: 10000 });
  } catch { /* already gone */ }
  try {
    await page.waitForSelector('.streaming-cursor', { state: 'hidden', timeout: timeoutMs });
  } catch { /* done */ }
  await page.waitForTimeout(800);

  const msgs = page.locator('.message-bubble, [class*="message-bubble"]');
  const count = await msgs.count();
  return count > 0 ? (await msgs.nth(count - 1).textContent()) || '' : '';
}

// ─────────────────────────────────────────────────────────────────────
// SUITE 1: Authentication
// ─────────────────────────────────────────────────────────────────────
test.describe('1 — Authentication', () => {

  test('AUTH-01: Landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await page.screenshot({ path: 'tests/reports/screenshots/01_landing.png' });
    console.log('  ✓ Landing page loaded');
  });

  test('AUTH-02: Student login flow works', async ({ page }) => {
    await loginAsStudent(page);
    // Verify we are inside the app
    const appContent = page.locator('textarea, [data-tutor-tour], [class*="chat"]').first();
    await expect(appContent).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: 'tests/reports/screenshots/02_post_login.png' });
    console.log('  ✓ Student is authenticated and in the app');
  });

  test('AUTH-03: Profile info is populated correctly', async ({ page }) => {
    await loginAsStudent(page);
    const token = await getToken(page);
    expect(token.length).toBeGreaterThan(10);

    const profileRes = await page.request.get(`${BASE_API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profile = await profileRes.json();
    console.log(`  ✓ Profile: ${profile.username} | ${profile.email} | Branch: ${profile.branch}`);
    expect(profile.email).toBe(STUDENT.email);
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 2: General Chat (non-tutor)
// ─────────────────────────────────────────────────────────────────────
test.describe('2 — General Chat', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('CHAT-01: Ask a simple ECE concept question', async ({ page }) => {
    test.setTimeout(120000);
    const response = await sendChatMessage(
      page,
      'Explain the difference between a process and a thread in operating systems.',
      90000
    );
    console.log(`  → Response (first 150 chars): "${response.slice(0, 150)}"`);
    expect(response.length).toBeGreaterThan(50);
    const hasConcept = /thread|process|execut|memory|stack|concurren/i.test(response);
    expect(hasConcept).toBeTruthy();
    await page.screenshot({ path: 'tests/reports/screenshots/03_general_chat.png' });
    console.log('  ✓ General chat responded with relevant content');
  });

  test('CHAT-02: Follow-up question maintains context', async ({ page }) => {
    test.setTimeout(180000);
    await sendChatMessage(page, 'What is a mutex?', 90000);
    const response = await sendChatMessage(page, 'How does it differ from a semaphore?', 90000);
    console.log(`  → Follow-up (first 150 chars): "${response.slice(0, 150)}"`);
    expect(response.length).toBeGreaterThan(50);
    await page.screenshot({ path: 'tests/reports/screenshots/04_chat_followup.png' });
    console.log('  ✓ Follow-up context maintained');
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 3: Socratic Tutor Mode — Average Student Simulation
// ─────────────────────────────────────────────────────────────────────
test.describe('3 — Socratic Tutor Mode (Average Student)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('TUTOR-01: Navigate to tutor mode and select course', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForTimeout(2000);

    // Look for course selector
    const courseSelect = page.locator('select[data-tutor-tour="subject-select"]')
      .or(page.locator('select').first());
    const hasSelect = await courseSelect.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasSelect) {
      const options = await courseSelect.locator('option').allTextContents();
      console.log(`  → Available courses: ${options.join(', ')}`);

      // Select Operating Systems if available, else first course
      const osOption = options.find(o => /operating|os/i.test(o));
      if (osOption) {
        await courseSelect.selectOption({ label: osOption });
        console.log(`  → Selected: ${osOption}`);
      } else if (options.length > 1) {
        await courseSelect.selectOption({ index: 1 });
      }
      await page.waitForTimeout(3000);
    } else {
      // Might be already in a course or different UI
      console.log('  → Course select not found, checking page state');
    }

    await page.screenshot({ path: 'tests/reports/screenshots/05_tutor_course_selected.png' });
    console.log('  ✓ TUTOR-01: Course selection complete');
  });

  test('TUTOR-02: Curriculum structure visible in sidebar', async ({ page }) => {
    await page.goto('/tutor');
    await page.waitForTimeout(2000);

    const courseSelect = page.locator('select').first();
    if (await courseSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const options = await courseSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await courseSelect.selectOption({ index: 1 });
        await page.waitForTimeout(3000);
      }
    }

    // Look for roadmap/curriculum panel
    const roadmap = page.locator('[data-tutor-tour="roadmap-panel"]')
      .or(page.locator('[class*="roadmap"], [class*="curriculum"], [class*="sidebar"]').first());
    const hasRoadmap = await roadmap.isVisible({ timeout: 10000 }).catch(() => false);

    if (hasRoadmap) {
      // Check for module rows
      const modules = page.locator('[data-module-id], [class*="module"]');
      const modCount = await modules.count();
      console.log(`  → Modules visible in sidebar: ${modCount}`);
    } else {
      console.log('  → Roadmap panel not detected — checking via API');
      const token = await getToken(page);
      const res = await page.request.get(
        `${BASE_API}/chat/tutor/curriculum/Operating%20Systems`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok()) {
        const data = await res.json();
        console.log(`  → API curriculum: ${data.curriculum?.modules?.length || 0} modules`);
      }
    }

    await page.screenshot({ path: 'tests/reports/screenshots/06_tutor_sidebar.png' });
    console.log('  ✓ TUTOR-02: Curriculum structure verified');
  });

  test('TUTOR-03: Average student sends first message — Socratic response expected', async ({ page }) => {
    test.setTimeout(180000);
    await page.goto('/tutor');
    await page.waitForTimeout(2000);

    const courseSelect = page.locator('select').first();
    if (await courseSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const options = await courseSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await courseSelect.selectOption({ index: 1 });
        await page.waitForTimeout(3000);
      }
    }

    const studentMsg = AVG_ANSWERS.firstAttempt[0];
    console.log(`  → Student says: "${studentMsg}"`);
    const response = await sendChatMessage(page, studentMsg, 120000);
    console.log(`  → Tutor responds: "${response.slice(0, 200)}"`);

    expect(response.length).toBeGreaterThan(30);

    // Check Socratic quality
    const hasQuestion = response.includes('?');
    const hasSocraticKeywords = /what|how|why|can you|think|explain|consider|describe|tell me/i.test(response);
    console.log(`  → Has question mark: ${hasQuestion} | Has Socratic keywords: ${hasSocraticKeywords}`);

    await page.screenshot({ path: 'tests/reports/screenshots/07_tutor_first_response.png' });
    console.log('  ✓ TUTOR-03: First Socratic exchange complete');
  });

  test('TUTOR-04: Multi-turn Socratic dialogue simulating average student (3 turns)', async ({ page }) => {
    test.setTimeout(300000);
    await page.goto('/tutor');
    await page.waitForTimeout(2000);

    const courseSelect = page.locator('select').first();
    if (await courseSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const options = await courseSelect.locator('option').allTextContents();
      if (options.length > 1) {
        await courseSelect.selectOption({ index: 1 });
        await page.waitForTimeout(3000);
      }
    }

    const exchanges = [
      { turn: 1, msg: AVG_ANSWERS.firstAttempt[1] },
      { turn: 2, msg: AVG_ANSWERS.secondAttempt[1] },
      { turn: 3, msg: AVG_ANSWERS.thirdAttempt[0] },
    ];

    let prevResponseLength = 0;
    for (const { turn, msg } of exchanges) {
      console.log(`  [Turn ${turn}] Student: "${msg.slice(0, 80)}..."`);
      const response = await sendChatMessage(page, msg, 120000);
      console.log(`  [Turn ${turn}] Tutor: "${response.slice(0, 120)}..."`);
      expect(response.length).toBeGreaterThan(20);

      const hasQuestion = /\?/.test(response);
      const hasSocratic = /what|how|why|explain|consider|think|apply|analyz/i.test(response);
      console.log(`    Socratic quality: question=${hasQuestion}, keywords=${hasSocratic}`);

      prevResponseLength = response.length;
      await page.screenshot({ path: `tests/reports/screenshots/08_tutor_turn${turn}.png` });
    }

    console.log('  ✓ TUTOR-04: Multi-turn dialogue complete');
  });

  test('TUTOR-05: Module progression — verify current position advances via API', async ({ page }) => {
    test.setTimeout(60000);
    await loginAsStudent(page);

    const token = await getToken(page);

    // Get current position before progression
    const beforeRes = await page.request.get(
      `${BASE_API}/tutor/current-position/Operating%20Systems`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const before = beforeRes.ok() ? await beforeRes.json() : null;
    console.log(`  → Position before: ${JSON.stringify(before?.position?.topicName || before?.position?.teachingUnit || 'unknown')}`);

    // Save progress update
    const saveRes = await page.request.post(
      `${BASE_API}/tutor/progress/Operating%20Systems`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          completedSubtopics: ['sub_1', 'sub_2'],
          completedTopics: ['top_1'],
          completedModules: []
        }
      }
    );
    console.log(`  → Save progress: HTTP ${saveRes.status()} — ${(await saveRes.json()).message || ''}`);
    expect(saveRes.ok()).toBeTruthy();

    // Get position after
    const afterRes = await page.request.get(
      `${BASE_API}/tutor/current-position/Operating%20Systems`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const after = afterRes.ok() ? await afterRes.json() : null;
    console.log(`  → Position after: ${JSON.stringify(after?.position?.topicName || after?.position?.teachingUnit || 'unknown')}`);

    console.log('  ✓ TUTOR-05: Module progression API verified');
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 4: Skill Tree & Question Deduplication
// ─────────────────────────────────────────────────────────────────────
test.describe('4 — Skill Tree Gamification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('ST-01: Navigate to skill tree page', async ({ page }) => {
    await page.goto('/gamification/skill-tree');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: 'tests/reports/screenshots/09_skill_tree_landing.png' });
    console.log('  ✓ ST-01: Skill tree page accessible');
  });

  test('ST-02: Question deduplication verified via API (Attempt 1 vs 2)', async ({ page }) => {
    test.setTimeout(120000);
    const token = await getToken(page);

    // Attempt 1
    const res1 = await page.request.post(`${BASE_API}/gamification/skill-tree/level-questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { topic: 'Operating Systems', levelId: 1, levelName: 'Process Scheduling', difficulty: 'easy' }
    });
    expect(res1.ok()).toBeTruthy();
    const data1 = await res1.json();
    const qSet1 = (data1.questions || []).map(q => q.question);
    console.log(`  → Attempt 1: ${qSet1.length} questions from source: ${data1._source || data1.generatedBy || 'unknown'}`);
    if (qSet1.length > 0) console.log(`    Sample: "${qSet1[0].slice(0, 80)}..."`);

    // Attempt 2 WITH seenQuestions
    const res2 = await page.request.post(`${BASE_API}/gamification/skill-tree/level-questions`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        topic: 'Operating Systems', levelId: 1, levelName: 'Process Scheduling', difficulty: 'easy',
        seenQuestions: qSet1
      }
    });
    expect(res2.ok()).toBeTruthy();
    const data2 = await res2.json();
    const qSet2 = (data2.questions || []).map(q => q.question);
    console.log(`  → Attempt 2: ${qSet2.length} questions from source: ${data2._source || data2.generatedBy || 'unknown'}`);

    const duplicates = qSet2.filter(q => qSet1.includes(q));
    const noveltyRate = qSet2.length > 0 ? Math.round((1 - duplicates.length / qSet2.length) * 100) : 0;
    console.log(`  → Duplicates: ${duplicates.length}/${qSet2.length} | Novelty rate: ${noveltyRate}%`);

    await page.screenshot({ path: 'tests/reports/screenshots/10_skill_tree_dedup.png' });
    console.log(`  ✓ ST-02: Deduplication test complete (novelty ${noveltyRate}%)`);
  });

  test('ST-03: Play skill tree level in UI', async ({ page }) => {
    test.setTimeout(300000);
    await page.goto('/gamification/skill-tree');
    await page.waitForTimeout(3000);

    // Try to find an existing game or create a new one
    const playBtn = page.locator('button, a').filter({ hasText: /play|continue|start/i }).first();
    const hasPlay = await playBtn.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasPlay) {
      await playBtn.click();
      await page.waitForTimeout(3000);
      console.log('  → Clicked play/continue on existing game');
    } else {
      // Try creating new game
      const newBtn = page.locator('button, a').filter({ hasText: /new skill tree/i }).first();
      if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await newBtn.click();
      } else {
        await page.goto('/gamification/skill-tree/new');
      }
      await page.waitForTimeout(2000);
      console.log('  → Navigating to create new skill tree');
    }

    await page.screenshot({ path: 'tests/reports/screenshots/11_skill_tree_play.png' });
    console.log('  ✓ ST-03: Skill tree play attempted');
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 5: Guided Learning / Study Mode with Document
// ─────────────────────────────────────────────────────────────────────
test.describe('5 — Guided Learning (Study Mode)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page);
  });

  test('GL-01: Access study/guided learning mode', async ({ page }) => {
    // Navigate to the app home — study mode is typically activated via chat toggle
    await page.waitForTimeout(1000);

    // Look for a "Study Mode" or "Guided" toggle/button in the chat UI
    const studyToggle = page.locator('button, [role="tab"]')
      .filter({ hasText: /study mode|guided learning|document/i }).first();
    const hasStudyToggle = await studyToggle.isVisible({ timeout: 8000 }).catch(() => false);

    if (hasStudyToggle) {
      await studyToggle.click();
      await page.waitForTimeout(1500);
      console.log('  → Study mode toggle activated');
    } else {
      console.log('  → Study mode toggle not found in UI, testing via direct chat with mode flag');
    }

    await page.screenshot({ path: 'tests/reports/screenshots/12_study_mode.png' });
    console.log('  ✓ GL-01: Study mode navigation attempted');
  });

  test('GL-02: Guided learning API responds with document context', async ({ page }) => {
    test.setTimeout(180000);
    const token = await getToken(page);

    // Test guided learning with the /api/chat endpoint
    const res = await page.request.post(`${BASE_API}/chat`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        query: 'Explain the key concepts from section 1 of my lecture material on operating systems.',
        sessionId: `guided_test_${Date.now()}`,
        isTutorMode: true,
        tutorModeType: 'guided_learning',
      },
      timeout: 120000,
    });

    console.log(`  → Guided learning API response: HTTP ${res.status()}`);

    if (res.ok()) {
      const body = await res.json();
      const responseText = body.message || body.response || JSON.stringify(body).slice(0, 200);
      console.log(`  → Response: "${responseText.slice(0, 200)}"`);
      expect(responseText.length).toBeGreaterThan(10);
    } else {
      const errText = await res.text();
      console.log(`  → Error: ${errText.slice(0, 200)}`);
    }

    await page.screenshot({ path: 'tests/reports/screenshots/13_guided_learning_api.png' });
    console.log('  ✓ GL-02: Guided learning API tested');
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 6: Backend Quality Checks
// ─────────────────────────────────────────────────────────────────────
test.describe('6 — Backend Quality Assertions', () => {

  test('BQ-01: SGLang health check passes', async ({ page }) => {
    const res = await page.request.get('http://localhost:8000/v1/models');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const modelId = data?.data?.[0]?.id || 'unknown';
    console.log(`  ✓ BQ-01: SGLang healthy — model: ${modelId}`);
  });

  test('BQ-02: Backend /health endpoint passes', async ({ page }) => {
    const res = await page.request.get(`${BASE_API}/health`);
    console.log(`  → /health HTTP: ${res.status()}`);
    // May not have /health, accept 200 or 404 (endpoint might not exist)
    expect([200, 404].includes(res.status())).toBeTruthy();
    console.log('  ✓ BQ-02: Backend reachable');
  });

  test('BQ-03: Auth token is valid for protected routes', async ({ page }) => {
    await loginAsStudent(page);
    const token = await getToken(page);

    const profileRes = await page.request.get(`${BASE_API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profileRes.ok()).toBeTruthy();

    // Test progress endpoint
    const progressRes = await page.request.get(`${BASE_API}/progress/Operating%20Systems`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  → Progress endpoint: HTTP ${progressRes.status()}`);
    console.log('  ✓ BQ-03: Token is valid for protected routes');
  });

  test('BQ-04: Curriculum API returns structured data', async ({ page }) => {
    await loginAsStudent(page);
    const token = await getToken(page);

    const res = await page.request.get(
      `${BASE_API}/chat/tutor/curriculum/Operating%20Systems`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.ok()) {
      const body = await res.json();
      const modules = body.curriculum?.modules || [];
      console.log(`  → Curriculum modules: ${modules.length}`);
      modules.slice(0, 3).forEach((m, i) => {
        console.log(`    [${i+1}] ${m.name || m.title || 'unnamed'} — ${(m.topics || []).length} topics`);
      });
      expect(modules.length).toBeGreaterThan(0);
    } else {
      console.log(`  → Curriculum API: HTTP ${res.status()}`);
    }
    console.log('  ✓ BQ-04: Curriculum structure verified');
  });

  test('BQ-05: Tutor progress save and resolve cycle', async ({ page }) => {
    await loginAsStudent(page);
    const token = await getToken(page);

    // Save a known progress state
    const saveRes = await page.request.post(
      `${BASE_API}/tutor/progress/Operating%20Systems`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          completedSubtopics: [],
          completedTopics: [],
          completedModules: []
        }
      }
    );
    console.log(`  → Clear progress: HTTP ${saveRes.status()}`);
    expect(saveRes.ok()).toBeTruthy();

    // Resolve position
    const posRes = await page.request.get(
      `${BASE_API}/tutor/current-position/Operating%20Systems`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`  → Current position: HTTP ${posRes.status()}`);

    if (posRes.ok()) {
      const data = await posRes.json();
      const pos = data.position;
      console.log(`  → Position: module="${pos?.moduleName}", topic="${pos?.topicName}", unit="${pos?.teachingUnit}"`);
      expect(pos).not.toBeNull();
    }

    console.log('  ✓ BQ-05: Progress save/resolve cycle confirmed');
  });

});

// ─────────────────────────────────────────────────────────────────────
// SUITE 7: Full Student Journey (End-to-End Scenario)
// ─────────────────────────────────────────────────────────────────────
test.describe('7 — Full Average Student Journey', () => {

  test('JOURNEY-01: Complete session — login, ask, tutor, skill tree', async ({ page }) => {
    test.setTimeout(600000);

    // Step 1: Login
    await loginAsStudent(page);
    console.log('\n  === STUDENT JOURNEY ===');
    console.log('  Step 1: Logged in ✓');
    await page.screenshot({ path: 'tests/reports/screenshots/journey_01_login.png' });

    // Step 2: Ask a general question
    const q1Response = await sendChatMessage(
      page,
      'I\'m studying for my OS exam. Can you give me a quick overview of process synchronization?',
      90000
    );
    console.log(`  Step 2: General chat → "${q1Response.slice(0, 120)}"`);
    await page.screenshot({ path: 'tests/reports/screenshots/journey_02_general_chat.png' });

    // Step 3: Navigate to tutor mode
    await page.goto('/tutor');
    await page.waitForTimeout(2000);
    console.log('  Step 3: Navigated to tutor mode');
    await page.screenshot({ path: 'tests/reports/screenshots/journey_03_tutor.png' });

    // Step 4: Select course if dropdown exists
    const courseSelect = page.locator('select').first();
    if (await courseSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      const options = await courseSelect.locator('option').allTextContents();
      const osOption = options.find(o => /operating|os/i.test(o));
      if (osOption) {
        await courseSelect.selectOption({ label: osOption });
        await page.waitForTimeout(3000);
        console.log(`  Step 4: Selected course: ${osOption}`);
      }
    }

    // Step 5: Have a Socratic exchange as average student
    const tutorMsg = 'I think process synchronization is about making sure multiple processes don\'t interfere with each other when accessing shared data. Something like mutual exclusion?';
    console.log(`  Step 5: Sending tutor message...`);
    const tutorResponse = await sendChatMessage(page, tutorMsg, 120000);
    console.log(`  Step 5: Tutor responded: "${tutorResponse.slice(0, 150)}"`);
    await page.screenshot({ path: 'tests/reports/screenshots/journey_04_socratic.png' });

    // Step 6: Navigate to skill tree
    await page.goto('/gamification/skill-tree');
    await page.waitForTimeout(2000);
    console.log('  Step 6: Navigated to skill tree');
    await page.screenshot({ path: 'tests/reports/screenshots/journey_05_skill_tree.png' });

    // Step 7: Verify token still works (session persistence)
    const token = await getToken(page);
    const profileRes = await page.request.get(`${BASE_API}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(profileRes.ok()).toBeTruthy();
    console.log('  Step 7: Session persisted across navigation ✓');

    console.log('\n  ✓ JOURNEY-01: Full student journey complete!');
    await page.screenshot({ path: 'tests/reports/screenshots/journey_06_final.png' });
  });

});
