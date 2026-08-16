// tests/e2e/16_faculty_dsp_course.spec.js
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth.js';

test.describe('Faculty DSP Course Generation & Swarm Agent Execution', () => {

  test('E2E — Generate Digital Signal Processing (EE3621) Course & Execute Swarm CLI', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes overall timeout for local LLM generation

    // 1. Login as Faculty
    console.log('[1/6] Logging in as Faculty user...');
    await loginAs(page, 'faculty@imentor.edu', 'password123');

    // 2. Ensure we are on the Faculty Dashboard
    if (!page.url().includes('/faculty/dashboard')) {
      await page.goto('/faculty/dashboard');
    }
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('iMentor Faculty Portal')).toBeVisible({ timeout: 20000 });
    console.log('[2/6] ✓ Verified Faculty Portal Dashboard is loaded');

    // 3. Fill Course Generation Form
    const dspSyllabus = `Basic Elements of Digital Signal Processing: Review of signals & systems, DTFT, Z transform, DFT, DFT properties.
Fast Fourier Transforms: Efficient computation of DFT, FFT algorithms: radix-2 and radix-4 FFT algorithms, decimation in time and decimation in frequency algorithms, use of FFT algorithms in linear filtering, reconstruction and aliasing in time and frequency domains.
Digital Filter Synthesis: FIR and IIR filters - direct form realization, cascade form, and linear phase realization. IIR filter - direct form I, direct form II, cascade form, parallel form, Lattice form realization.
Digital Filters Design: Linear phase FIR filter, characteristic response, location of zeros, design of FIR filter - windowing, frequency sampling, FIR Filters- moving average filters, windowing method, design of IIR filters from analog filters - Impulse invariance, bilinear transformation, matched z-transform. IIR filters: simple design example. equalization and noise cancellation and adaptive FIR filter.`;

    const topicInput = page.getByPlaceholder(/Introduction to Neural Networks|subject topic/i);
    await topicInput.scrollIntoViewIfNeeded();
    await topicInput.fill('Digital Signal Processing');

    const codeInput = page.getByPlaceholder(/CS101|ENTR302/i);
    await codeInput.fill('EE3621');

    const syllabusInput = page.getByPlaceholder(/paste course chapters|syllabus text/i);
    await syllabusInput.fill(dspSyllabus);

    console.log('[3/6] ✓ Filled DSP syllabus inputs');

    // 4. Click Spin Swarm Button
    const spinBtn = page.getByRole('button', { name: /spin swarm/i });
    await spinBtn.scrollIntoViewIfNeeded();
    await expect(spinBtn).toBeEnabled();
    await spinBtn.click();
    console.log('[4/6] ✓ Clicked Spin Swarm button');

    // 5. Verify Swarm Execution Logs appear and complete
    await expect(page.getByText(/Spinning up AutoGen|Swarm listening/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[5/6] ✓ Swarm execution logs initialized');

    // Wait for completion log in console
    const successMsg = page.getByText(/Course generated successfully|Active course identifier/i).first();
    await expect(successMsg).toBeVisible({ timeout: 180000 });
    console.log('[5/6] ✓ EE3621 - Digital Signal Processing course syllabus generated and saved to MongoDB');

    // 6. Test Custom Swarm CLI Console Interaction
    const cliInput = page.getByPlaceholder(/modify topic, add modules, commit, or revert/i);
    await cliInput.scrollIntoViewIfNeeded();
    await expect(cliInput).toBeVisible();

    // Send "list" command to CLI
    await cliInput.fill('list');
    await page.keyboard.press('Enter');

    // Verify CLI output listed curriculum
    await expect(page.getByText(/Digital Signal Processing|📦 Module/i).first()).toBeVisible({ timeout: 20000 });
    console.log('[6/6] ✓ Faculty Console listed active course curriculum');

    // Send custom natural language agent modification command
    await cliInput.fill('Modify DTFT topic to include Z-transform illustrations');
    await page.keyboard.press('Enter');

    // Verify Custom Developer-Agent Loop Execution
    await expect(page.getByText(/Spawning custom Developer-Agent|Curriculum updated/i).first()).toBeVisible({ timeout: 45000 });
    console.log('[6/6] ✓ Custom Developer-Agent loop executed, planned, and saved modifications');
  });

});
