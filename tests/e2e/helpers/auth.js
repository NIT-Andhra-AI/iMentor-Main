// tests/e2e/helpers/auth.js
// Shared login helper for all E2E tests

const BASE_API = process.env.BASE_API || 'http://localhost:5006/api';

/**
 * Login as the test user using the iMentor AuthModal.
 * Uses direct `name` attribute selectors to be resilient to placeholder text changes.
 */
export async function loginAs(page, email = 'student@imentor.edu', password = 'password123') {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1000); // let landing page fully render

  // If already authenticated and on main app view, check if Sign In button is absent
  const hasToken = await page.evaluate(() => {
    const t = localStorage.getItem('authToken');
    return Boolean(t && t.length > 10);
  });
  const signInBtn = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  const isSignInVisible = await signInBtn.isVisible({ timeout: 1500 }).catch(() => false);

  if (hasToken && !isSignInVisible) {
    console.log(`[auth.js] ✓ Already logged in as ${email}`);
    return;
  }

  if (isSignInVisible) {
    await signInBtn.click();
    await page.waitForTimeout(1000);
  } else {
    try {
      await signInBtn.waitFor({ state: 'visible', timeout: 4000 });
      await signInBtn.click();
      await page.waitForTimeout(1000);
    } catch (_) {
      // Fall through to direct API token injection
    }
  }

  // Locate the visible inputs in the modal
  const emailInput = page.locator('input[name="email"]').or(page.getByPlaceholder(/email/i)).filter({ visible: true }).first();
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);
  await page.waitForTimeout(200);

  const passwordInput = page.locator('input[name="password"]').or(page.getByPlaceholder(/password/i)).filter({ visible: true }).first();
  await passwordInput.fill(password);
  await page.waitForTimeout(200);

  // Click the submit button inside the form or press Enter
  const loginBtn = page.locator('form button[type="submit"], button:has-text("Login")').filter({ visible: true }).first();
  if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await loginBtn.click();
  } else {
    await passwordInput.press('Enter');
  }

  // Wait for token to be set in localStorage
  let loggedIn = false;
  for (let i = 0; i < 20; i++) {
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (token && token.length > 10) {
      loggedIn = true;
      break;
    }
    await page.waitForTimeout(400);
  }

  if (!loggedIn) {
    // Try fast fallback login via direct API and token injection
    try {
      const res = await page.request.post(`${BASE_API}/auth/signin`, {
        data: { email, password }
      });
      const data = await res.json();
      if (data.token) {
        await page.evaluate(({ token, user }) => {
          localStorage.setItem('authToken', token);
          localStorage.setItem('user', JSON.stringify(user));
        }, { token: data.token, user: data });
        await page.reload({ waitUntil: 'domcontentloaded' });
        loggedIn = true;
      }
    } catch (_) {}
  }

  if (!loggedIn) {
    const errText = await page.locator('[class*="text-red"], [class*="error"]').first()
      .textContent().catch(() => '');
    throw new Error(`Login failed for ${email}. Error on screen: ${errText || 'None'}`);
  }

  // Wait for modal to close
  try {
    await page.waitForSelector('input[name="email"]', { state: 'hidden', timeout: 10000 });
  } catch (_) {}

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
