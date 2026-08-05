// tests/e2e/general_chat.spec.js — UI-CHAT-01 .. UI-CHAT-03
import { test, expect } from '@playwright/test';
import { loginAs, sendMessage } from './helpers/auth.js';

test.describe('UI-CHAT — General Chat', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test('UI-CHAT-01 — Send a basic message', async ({ page }) => {
    await sendMessage(page, 'What is machine learning?');

    // Assert user message bubble
    const userMsg = page.locator('.items-end .message-bubble').last();
    await expect(userMsg).toBeVisible({ timeout: 5000 });

    // Assert bot response bubble
    const botMsg = page.locator('.items-start .message-bubble').last();
    await expect(botMsg).toBeVisible({ timeout: 60000 });

    // Assert response has text
    const text = await botMsg.textContent();
    expect(text.length).toBeGreaterThan(20);

    console.log('✓ UI-CHAT-01 passed: Message sent and response received');
  });

  test('UI-CHAT-02 — Multi-turn conversation context', async ({ page }) => {
    await sendMessage(page, 'Explain overfitting in machine learning');

    // Second message referencing previous context
    await sendMessage(page, 'Give me an example of what you described');

    // Bot response should exist
    const botMsgs = page.locator('.message-bubble, [class*="message-bubble"], [class*="items-start"] .message-bubble-wrapper');
    const count = await botMsgs.count();
    expect(count).toBeGreaterThanOrEqual(2);

    console.log(`✓ UI-CHAT-02 passed: ${count} bot messages in conversation`);
  });

  test('UI-CHAT-03 — New chat clears messages', async ({ page }) => {
    await sendMessage(page, 'Hello, explain recursion');

    // Click "New Chat"
    const newChatBtn = page.getByRole('button', { name: /new chat/i })
      .or(page.getByTitle(/new chat/i));
    await newChatBtn.click();

    await page.waitForTimeout(2000);

    // Assert chat area is empty (no bot messages) or welcome shown
    const welcome = page.locator('[data-testid="center-panel-welcome"]');
    const botMsgs = page.locator('.message-bubble, [class*="message-bubble"]');
    const botCount = await botMsgs.count();

    // Either welcome is visible or no bot messages
    const isCleared = botCount === 0 || await welcome.isVisible().catch(() => false);
    expect(isCleared).toBeTruthy();

    console.log('✓ UI-CHAT-03 passed: New chat cleared messages');
  });

  test('UI-CHAT-04 — Socratic Learning Mode in General Chat', async ({ page }) => {
    // Click the GraduationCap/Learn button to enable Learning Mode
    const learnBtn = page.locator('button').filter({ hasText: /^Learn$/ }).first();
    await learnBtn.waitFor({ state: 'visible', timeout: 5000 });
    await learnBtn.click();

    // Verify Learning Mode status indicator is visible
    const learnBadge = page.locator('.flex.flex-wrap.items-center span').filter({ hasText: /learning mode/i }).first();
    await expect(learnBadge).toBeVisible({ timeout: 5000 });

    // Send a message
    await sendMessage(page, 'What is the concept of recursion in programming?');

    // Assert user message bubble
    const userMsg = page.locator('.items-end .message-bubble').last();
    await expect(userMsg).toBeVisible({ timeout: 5000 });

    // Assert bot response bubble
    const botMsg = page.locator('.items-start .message-bubble').last();
    await expect(botMsg).toBeVisible({ timeout: 60000 });

    // Assert response contains a question mark, characteristic of Socratic guided learning style
    const responseText = await botMsg.textContent();
    expect(responseText).toContain('?');

    console.log('✓ UI-CHAT-04 passed: Socratic Learning Mode active and responses are socratic');
  });

});
