// tests/e2e/helpers/chat-helpers.js
// Shared chat interaction helpers for E2E tests

const BASE_API = process.env.BASE_API || 'http://localhost:5006/api';

/* ─── Selectors ────────────────────────────────────────────────────── */

export const SEL = {
  // Chat input area
  chatInputContainer: '[data-tutor-tour="chat-input"]',
  textarea:           'textarea',
  plusButton:          'button[aria-label="More options"]',
  sendButton:         'button[title="Send message (Enter)"]',
  stopButton:         'button[title="Stop generating"]',

  // Desktop toggles (hidden on mobile via sm:flex)
  totToggle:          'button[aria-label="Toggle Tree of Thought"]',
  ragToggle:          'button[aria-label="Toggle RAG / Knowledge Base"]',
  promptCoach:        'button[aria-label="Prompt Coach"]',
  voiceInput:         'button[aria-label="Voice input"]',

  // Bot / user messages
  botMessage:         '.message-bubble, [class*="message-bubble"], [class*="items-start"] .message-bubble-wrapper',
  userMessage:        '.user-message, [class*="user-message"]',
  streamingCursor:    '.streaming-cursor',
  thinkingDropdown:   'details, [class*="thinking"], [class*="thought"]',

  // Status pills (below input)
  webSearchPill:      '[class*="status"] >> text=/web search/i',
  academicPill:       '[class*="status"] >> text=/academic/i',
  totPill:            '[class*="status"] >> text=/tree of thought/i',
  ragPill:            '[class*="status"] >> text=/rag/i',

  // Welcome / empty state
  welcomePanel:       '[data-testid="center-panel-welcome"]',

  // Error indicators
  errorModal:         '[role="alert"], [class*="error-modal"]',

  // Service interruption dialog ("AI Service Notification" / "Service Status")
  serviceDialog:      '[role="dialog"][aria-modal="true"], dialog[aria-modal="true"], [class*="error-modal"]',
  serviceDialogDismiss: '[role="dialog"] button:has-text("Dismiss"), [role="dialog"] button:has-text("Got it"), [role="dialog"] button[aria-label*="Close"], button:has-text("Got it"), button:has-text("Dismiss")',
};

/* ─── Core chat actions ────────────────────────────────────────────── */

/**
 * Wait for SSE streaming to complete (cursor disappears).
 */
export async function waitForStreamComplete(page, timeout = 120000) {
  try {
    // Wait for cursor to appear if starting
    await page.waitForSelector(SEL.streamingCursor, { state: 'visible', timeout: 15000 });
  } catch {
    // Cursor may have already gone or response was instant
  }
  try {
    await page.waitForSelector(SEL.streamingCursor, { state: 'hidden', timeout });
  } catch {
    // Already hidden
  }
  await page.waitForTimeout(1000); // settle
}

/**
 * Dismiss any open service interruption / notification dialog that might block UI.
 * Safe to call even when no dialog is present.
 */
export async function dismissServiceDialog(page) {
  try {
    const dialog = page.locator('[role="dialog"][aria-modal="true"], dialog[aria-modal="true"]').first();
    if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
      const dismissBtn = page.locator('button:has-text("Got it"), button:has-text("Dismiss"), button[aria-label*="Close"]').first();
      if (await dismissBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await dismissBtn.click({ force: true });
      } else {
        await page.keyboard.press('Escape');
      }
      await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
    }
  } catch {
    // No dialog present — fine
  }
}

/**
 * Send a chat message and wait for full bot response.
 * Returns the text content of the last bot message.
 */
export async function sendAndWait(page, text, timeout = 120000) {
  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await dismissServiceDialog(page);
  await page.waitForSelector('textarea:not([disabled])', { timeout: 30000 });

  const initialBotCount = await page.locator(SEL.botMessage).count();
  await input.fill(text);

  const sendBtn = page.locator(SEL.sendButton);
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }

  // Poll until new bot message appears and completes streaming
  const start = Date.now();
  while (Date.now() - start < timeout) {
    await dismissServiceDialog(page);
    const count = await page.locator(SEL.botMessage).count();
    const hasCursor = await page.locator(SEL.streamingCursor).isVisible().catch(() => false);
    const isTextareaReady = await page.locator('textarea:not([disabled])').isVisible().catch(() => false);

    if (count > initialBotCount && !hasCursor && isTextareaReady) {
      const lastText = await getLastBotText(page);
      if (lastText && lastText.length > 5 && !lastText.includes('Thinking...')) {
        await page.waitForTimeout(500);
        return lastText;
      }
    }
    await page.waitForTimeout(800);
  }

  return getLastBotText(page);
}

/**
 * Get the text content of the last bot message bubble.
 */
export async function getLastBotText(page) {
  const msgs = page.locator(SEL.botMessage);
  const count = await msgs.count();
  if (count === 0) return '';
  return (await msgs.nth(count - 1).textContent()) || '';
}

/**
 * Count how many bot message bubbles exist.
 */
export async function countBotMessages(page) {
  return page.locator(SEL.botMessage).count();
}

/* ─── Assertions ───────────────────────────────────────────────────── */

/**
 * Assert the last bot response has at least `minLength` characters.
 */
export async function assertBotResponse(page, minLength = 20) {
  const text = await getLastBotText(page);
  if (text.length < minLength) {
    throw new Error(`Bot response too short: ${text.length} chars (need ≥${minLength}). Text: "${text.slice(0, 100)}..."`);
  }
  return text;
}

/**
 * Assert the last bot response contains a code block.
 */
export async function assertHasCodeBlock(page) {
  const lastMsg = page.locator(SEL.botMessage).last();
  const codeBlock = lastMsg.locator('pre, code, [class*="code"]');
  const count = await codeBlock.count();
  if (count === 0) {
    throw new Error('Expected code block in bot response but found none');
  }
}

/**
 * Assert a thinking / ToT section is visible in the last response.
 */
export async function assertHasThinking(page) {
  const lastMsg = page.locator(SEL.botMessage).last();
  const thinking = lastMsg.locator('details, [class*="thinking"], [class*="thought"], summary');
  const count = await thinking.count();
  if (count === 0) {
    // Also check for "Thinking" or "Thought" text anywhere
    const text = await lastMsg.textContent();
    if (!text || (!/thinking/i.test(text) && !/thought/i.test(text) && !/reasoning/i.test(text))) {
      throw new Error('Expected thinking/ToT section in bot response but found none');
    }
  }
}

/**
 * Assert references / citations are present in the last response.
 */
export async function assertHasReferences(page) {
  const lastMsg = page.locator(SEL.botMessage).last();
  const text = await lastMsg.textContent();
  const hasRef = /source|reference|citation|\[[\d]+\]|https?:\/\//i.test(text || '');
  if (!hasRef) {
    // Check for links
    const links = await lastMsg.locator('a[href]').count();
    if (links === 0) {
      throw new Error('Expected references/citations in bot response but found none');
    }
  }
}

/**
 * Assert no error modal/alert is visible.
 */
export async function assertNoError(page) {
  const visible = await page.locator(SEL.errorModal).isVisible().catch(() => false);
  if (visible) {
    const errText = await page.locator(SEL.errorModal).textContent();
    throw new Error(`Unexpected error modal: ${errText}`);
  }
}

/* ─── Toggle helpers ───────────────────────────────────────────────── */

/**
 * Open the plus menu (More options) and click a toggle by text.
 */
async function openPlusMenuAndClick(page, textPattern) {
  const plusBtn = page.locator(SEL.plusButton);
  await plusBtn.waitFor({ state: 'visible', timeout: 5000 });
  await plusBtn.click();
  await page.waitForTimeout(400);

  const toggle = page.locator(`button`).filter({ hasText: textPattern }).first();
  await toggle.waitFor({ state: 'visible', timeout: 3000 });
  await toggle.click();
  await page.waitForTimeout(300);

  // Close menu
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

export async function toggleWebSearch(page) {
  await openPlusMenuAndClick(page, /web search/i);
}

export async function toggleAcademicSearch(page) {
  await openPlusMenuAndClick(page, /academic/i);
}

export async function toggleToT(page) {
  const totBtn = page.locator(SEL.totToggle);
  await totBtn.waitFor({ state: 'visible', timeout: 5000 });
  await totBtn.click();
  await page.waitForTimeout(300);
}

export async function toggleRAG(page) {
  const ragBtn = page.locator(SEL.ragToggle);
  await ragBtn.waitFor({ state: 'visible', timeout: 5000 });
  await ragBtn.click();
  await page.waitForTimeout(500);
}

/**
 * Select a course via the RAG / Knowledge Base dropdown.
 * Clicks the RAG toggle, then selects the course.
 */
export async function selectCourseViaRAG(page, courseName) {
  // Click RAG toggle to open the dropdown
  await toggleRAG(page);
  await page.waitForTimeout(500);

  // Look for the course in the dropdown / modal
  const courseOption = page.getByText(new RegExp(courseName, 'i')).first();
  await courseOption.waitFor({ state: 'visible', timeout: 5000 });
  await courseOption.click();
  await page.waitForTimeout(500);

  // Close the sidebar panel so it doesn't block the chat input with its backdrop
  const closeSidebarBtn = page.locator('button[title="Close panel (course stays active)"]').first();
  if (await closeSidebarBtn.isVisible().catch(() => false)) {
    await closeSidebarBtn.click();
    await page.waitForTimeout(300);
  } else {
    // Fallback: Click backdrop
    const backdrop = page.locator('.backdrop-blur-\\[2px\\]').first();
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click({ force: true });
      await page.waitForTimeout(300);
    }
  }

  // Close any remaining popover
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

/**
 * Deselect the current RAG course by clicking the × on the status chip,
 * or by toggling the RAG button if there's no × button.
 */
export async function deselectCourse(page) {
  // Try direct click on the close button if CourseViewerPanel is open
  let deselectBtn = page.locator('button[title="Deselect course"]').first();
  if (await deselectBtn.isVisible().catch(() => false)) {
    await deselectBtn.click();
    await page.waitForTimeout(500);
    return;
  }

  // If not open, look for a sidebar "Courses" button to open the CourseViewerPanel
  const coursesSidebarBtn = page.locator('button').filter({ hasText: /courses/i }).first();
  if (await coursesSidebarBtn.isVisible().catch(() => false)) {
    await coursesSidebarBtn.click();
    await page.waitForTimeout(1000);
    
    deselectBtn = page.locator('button[title="Deselect course"]').first();
    if (await deselectBtn.isVisible().catch(() => false)) {
      await deselectBtn.click();
      await page.waitForTimeout(500);
      return;
    }
  }

  // Fallbacks:
  // Try clicking × on the RAG status pill
  const ragChip = page.locator('button').filter({ hasText: /rag/i }).first();
  if (await ragChip.isVisible().catch(() => false)) {
    await ragChip.click();
    await page.waitForTimeout(500);
  }
  // Also try the × icon
  const closeBtn = page.locator('[aria-label*="deselect"], [aria-label*="remove"], [title*="deselect"]').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Click the Prompt Coach button (Sparkles icon).
 */
export async function clickPromptCoach(page) {
  const btn = page.locator(SEL.promptCoach);
  await btn.waitFor({ state: 'visible', timeout: 5000 });
  await btn.click();
  await page.waitForTimeout(500);
}

/**
 * Click "New Chat" to clear the conversation.
 */
export async function clickNewChat(page) {
  // Ensure any in-progress response has finished and dialogs are dismissed
  await page.waitForSelector('textarea:not([disabled])', { timeout: 30000 }).catch(() => {});
  await dismissServiceDialog(page);
  const newChatBtn = page.getByRole('button', { name: /new chat/i })
    .or(page.getByTitle(/new chat/i));
  await newChatBtn.waitFor({ state: 'visible', timeout: 5000 });
  await newChatBtn.click();
  await page.waitForTimeout(2000);
}

/* ─── API helpers (bypass UI for setup/teardown) ───────────────────── */

/**
 * Get auth token by logging in via API.
 * Returns the JWT token string.
 */
export async function getAuthToken(page) {
  const response = await page.request.post(`${BASE_API}/auth/signin`, {
    data: { email: 'student@imentor.edu', password: 'password123' }
  });
  const body = await response.json();
  return body.token;
}
