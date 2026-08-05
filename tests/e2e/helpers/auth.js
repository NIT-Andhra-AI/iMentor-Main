// tests/e2e/helpers/auth.js
// Shared login helper for all E2E tests

const BASE_API = 'http://localhost:5005/api';

/**
 * Login as the test user using the iMentor AuthModal.
 * Uses direct `name` attribute selectors to be resilient to placeholder text changes.
 */
export async function loginAs(page, email = 'student@imentor.edu', password = 'password123') {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000); // let landing page fully render

  // Click the "Sign In" button in the nav (triggers modal with isLoginView=true)
  const signInBtn = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  await signInBtn.waitFor({ state: 'visible', timeout: 15000 });
  await signInBtn.click();
  await page.waitForTimeout(1500); // wait for modal animation and state initialization

  // Locate the visible inputs in the modal
  const emailInput = page.locator('input[name="email"]').filter({ visible: true }).first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.click();
  await emailInput.focus();
  await emailInput.fill(email);
  await page.waitForTimeout(300);

  const passwordInput = page.locator('input[name="password"]').filter({ visible: true }).first();
  await passwordInput.click();
  await passwordInput.focus();
  await passwordInput.fill(password);
  await page.waitForTimeout(300);

  // Click the submit button inside the form directly
  const loginBtn = page.locator('form button[type="submit"], button[type="submit"]').filter({ visible: true }).first();
  await loginBtn.click();

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
    // If not logged in, check for any visible error message on the page
    const errText = await page.locator('[class*="text-red"], [class*="error"]').first()
      .textContent().catch(() => '');
    throw new Error(`Login failed for ${email}. Error on screen: ${errText || 'None'}`);
  }

  // Wait for the modal to close completely
  try {
    await page.waitForSelector('text="Welcome Back"', { state: 'hidden', timeout: 10000 });
  } catch (e) {
    // ignore if header doesn't exist
  }

  // Wait for the main chat/app to load (textarea visible = we're in the app)
  await page.waitForSelector('textarea', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);
  console.log(`[auth.js] ✓ Logged in as ${email}`);
}

// Alias for backward compat
export const loginAsStudent = loginAs;

/**
 * Send a chat message and wait for bot response
 */
export async function sendMessage(page, text, waitMs = 60000) {
  const input = page.locator('textarea:visible').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(text);

  const sendBtn = page.getByTitle(/send message/i).or(page.getByRole('button', { name: /^send$/i }));
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await input.press('Enter');
  }

  // Wait for bot response bubble to appear
  await page.waitForSelector(
    '.message-bubble, [class*="message-bubble"], [class*="items-start"] .message-bubble-wrapper',
    { timeout: waitMs }
  );

  // Wait for streaming to finish (cursor disappears)
  try {
    await page.waitForSelector('.streaming-cursor', { state: 'hidden', timeout: waitMs });
  } catch {
    // Cursor might have disappeared already
  }

  await page.waitForTimeout(1000);
}
