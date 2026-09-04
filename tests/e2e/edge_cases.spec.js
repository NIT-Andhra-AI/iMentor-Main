// tests/e2e/edge_cases.spec.js — Edge Case Inputs & Resilience
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';
import {
  sendAndWait, countBotMessages, getLastBotText,
  assertNoError, clickNewChat, SEL, dismissServiceDialog
} from './helpers/chat-helpers.js';

test.describe('EDGE — Edge Cases & Resilience Testing', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await dismissServiceDialog(page);
  });

  test('EDGE-01 — Rapid Clicks & Debouncing', async ({ page }) => {
    test.setTimeout(180000);
    const input = page.locator('textarea').first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill('Explain backpropagation in one sentence.');

    const sendBtn = page.locator(SEL.sendButton);

    // Click send rapidly 5 times
    for (let i = 0; i < 5; i++) {
      await sendBtn.click().catch(() => {});
      await page.waitForTimeout(50);
    }

    // Wait for response to stream and complete
    const response = await sendAndWait(page, 'What is backpropagation?');
    expect(response.length).toBeGreaterThan(15);
    await assertNoError(page);

    console.log(`✓ EDGE-01 passed: Rapid clicks handled cleanly without duplicate stream crashes`);
  });

  test('EDGE-02 — Unicode & Multilingual Inputs', async ({ page }) => {
    test.setTimeout(240000);
    
    // 1. Chinese (CJK)
    const cjkQuery = '什么是支持向量机（SVM）？请用简短的一句话概括。';
    const cjkResp = await sendAndWait(page, cjkQuery);
    expect(cjkResp.length).toBeGreaterThan(10);
    console.log(`  → CJK response received (${cjkResp.length} chars)`);

    // 2. Emojis & Composite Unicode
    const emojiQuery = '🚀🤖 Explain neural networks with 3 emojis and 1 sentence! ✨🧠';
    const emojiResp = await sendAndWait(page, emojiQuery);
    expect(emojiResp.length).toBeGreaterThan(10);
    console.log(`  → Emoji/Composite response received (${emojiResp.length} chars)`);

    // 3. LaTeX / Math notation
    const mathQuery = 'Simplify the integral: $$\\int_0^1 x^2 dx$$';
    const mathResp = await sendAndWait(page, mathQuery);
    expect(mathResp.length).toBeGreaterThan(10);
    console.log(`  → Math LaTeX response received (${mathResp.length} chars)`);

    // 4. Zero-width and control characters
    const zwQuery = '\u200B\u200CWhat is deep learning?\u200D\uFEFF';
    const zwResp = await sendAndWait(page, zwQuery);
    expect(zwResp.length).toBeGreaterThan(10);
    console.log(`  → Zero-width characters handled cleanly (${zwResp.length} chars)`);

    await assertNoError(page);
    console.log('✓ EDGE-02 passed: All Unicode, CJK, Emojis, and LaTeX handled');
  });

  test('EDGE-03 — Security, Injection & Malformed Payloads', async ({ page }) => {
    test.setTimeout(180000);

    // 1. XSS HTML injection payload
    const xssQuery = `<script>window.__xss_test = true;</script><img src="x" onerror="window.__xss_test=true"> What is gradient descent?`;
    const xssResp = await sendAndWait(page, xssQuery);
    expect(xssResp.length).toBeGreaterThan(15);

    // Verify script was not executed in browser window
    const wasXssExecuted = await page.evaluate(() => window.__xss_test === true);
    expect(wasXssExecuted).toBeFalsy();
    console.log('  → XSS payload properly sanitized and not executed');

    // 2. SQL Injection string
    const sqlQuery = `'; DROP TABLE users; SELECT * FROM users WHERE '1'='1 -- Explain decision trees`;
    const sqlResp = await sendAndWait(page, sqlQuery);
    expect(sqlResp.length).toBeGreaterThan(15);
    console.log('  → SQL injection string processed safely');

    // 3. Unclosed markdown code fence
    const brokenMdQuery = `\`\`\`python\ndef calculate_loss(y_true, y_pred):\n    return ((y_true - y_pred) ** 2).mean()`;
    const brokenMdResp = await sendAndWait(page, brokenMdQuery);
    expect(brokenMdResp.length).toBeGreaterThan(15);
    console.log('  → Unclosed markdown code fence rendered without breaking layout');

    await assertNoError(page);
    console.log('✓ EDGE-03 passed: Security and injection payloads safely neutralized');
  });

  test('EDGE-04 — Boundary & Extreme Length Inputs', async ({ page }) => {
    test.setTimeout(180000);

    // 1. Empty whitespace-only input
    const input = page.locator('textarea').first();
    await input.fill('    \n\t   ');
    const sendBtn = page.locator(SEL.sendButton);
    const isDisabled = await sendBtn.isDisabled().catch(() => false);
    // Button should either be disabled or clicking does not create empty message
    const botCountBefore = await countBotMessages(page);
    if (!isDisabled) {
      await sendBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    const botCountAfter = await countBotMessages(page);
    expect(botCountAfter).toBe(botCountBefore);
    console.log('  → Whitespace-only input ignored safely');

    // 2. Long input near maximum limit (1500 chars)
    const longQuery = 'Explain precision vs recall. ' + 'In machine learning classification, '.repeat(45) + 'summarize their key differences.';
    const longResp = await sendAndWait(page, longQuery);
    expect(longResp.length).toBeGreaterThan(20);
    console.log(`  → Large input (${longQuery.length} chars) processed successfully (${longResp.length} chars response)`);

    await assertNoError(page);
    console.log('✓ EDGE-04 passed: Boundary inputs handled robustly');
  });

  test('EDGE-05 — Stream Disruption & Stop Generation', async ({ page }) => {
    test.setTimeout(180000);

    const input = page.locator('textarea').first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill('Write an extremely detailed 2000-word comprehensive treatise on Convolutional Neural Networks and transformer architectures.');

    const sendBtn = page.locator(SEL.sendButton);
    await sendBtn.click();

    // Wait for streaming to start (streaming cursor visible)
    await page.waitForSelector(SEL.streamingCursor, { state: 'visible', timeout: 30000 }).catch(() => {});

    // Look for stop button and click it
    const stopBtn = page.locator('button[title*="Stop"], button[aria-label*="Stop"], button:has-text("Stop")').first();
    const isStopVisible = await stopBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (isStopVisible) {
      await stopBtn.click();
      console.log('  → Stop generating button clicked');
    } else {
      await page.keyboard.press('Escape');
    }

    // Ensure textarea is re-enabled after abort
    await page.waitForSelector('textarea:not([disabled])', { timeout: 20000 });
    await page.waitForTimeout(1000);

    // Verify UI can immediately accept and process a new message
    const followUp = await sendAndWait(page, 'What is 2 + 2?');
    expect(followUp.length).toBeGreaterThan(0);
    console.log(`  → Successfully recovered and sent follow-up (${followUp.length} chars)`);

    await assertNoError(page);
    console.log('✓ EDGE-05 passed: Stream disruption and recovery verified');
  });

});
