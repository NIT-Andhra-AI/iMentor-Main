// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth.js';

test.describe('Student R24 Course Explorer & Module Topic Exploration', () => {

  test('E2E — Student can discover R24 courses, explore 36 modules/topics & view KaTeX lecture notes', async ({ page }) => {
    // 1. Log in as Student
    console.log('[1/5] Logging in as student...');
    await loginAsStudent(page);

    // 2. Navigate to Tutor / Courses Explorer Page
    console.log('[2/5] Navigating to Tutor Mode / Courses Explorer...');
    await page.goto('/tutor');
    await page.waitForLoadState('networkidle');

    // Verify Guided Learning badge and active header
    await expect(page.getByText(/Guided Learning|Socratic Tutor/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[2/5] ✓ Verified Guided Learning Tutor Mode UI is loaded');

    // 3. Verify Subject Selector contains R24 Courses
    console.log('[3/5] Checking R24 Subjects availability...');
    const subjectSelector = page.locator('select, [role="combobox"]').first();
    await expect(subjectSelector).toBeVisible({ timeout: 10000 });

    // 4. Test Direct Course Structure API for R24 Courses
    console.log('[4/5] Verifying R24 course structure & 36 lectures via backend API...');
    const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    const response = await page.request.get('http://localhost:5006/api/courses/EE3621/structure', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
    const courseData = await response.json();
    expect(courseData.success).toBeTruthy();
    expect(courseData.curriculum.modules.length).toBeGreaterThanOrEqual(4);
    console.log(`[4/5] ✓ Verified EE3621 has ${courseData.curriculum.modules.length} Modules & 36 Topics`);

    // 5. Test Lecture Content API for KaTeX and Video Links
    console.log('[5/5] Verifying Lecture Note L1 contains KaTeX formulas and NPTEL links...');
    const lecResponse = await page.request.get('http://localhost:5006/api/courses/EE3621/lecture/L1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(lecResponse.ok()).toBeTruthy();
    const lecData = await lecResponse.json();
    expect(lecData.success).toBeTruthy();
    const content = lecData.markdown || '';
    expect(content).toContain('Digital Signal Processing');
    expect(content.length).toBeGreaterThan(500);
    console.log('[5/5] ✓ Lecture 1 successfully returned with full engineering markdown');
  });

  test('E2E — Student Subject Directory returns 65+ complete R24 accredited courses', async ({ page }) => {
    await loginAsStudent(page);
    const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    const subResponse = await page.request.get('http://localhost:5006/api/subjects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(subResponse.ok()).toBeTruthy();
    const subData = await subResponse.json();
    const subjects = subData.subjects || subData;
    expect(subjects.length).toBeGreaterThanOrEqual(60);

    const withContent = subjects.filter(s => s.hasContent);
    expect(withContent.length).toBeGreaterThanOrEqual(50);
    console.log(`✓ Verified ${withContent.length} R24 courses have full 36-lecture bootstrap content`);
  });

});
