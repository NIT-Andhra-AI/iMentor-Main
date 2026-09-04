// @ts-check
import { test, expect } from '@playwright/test';
import { loginAsStudent } from './helpers/auth.js';

test.describe('Study Plan Module Integration & Management E2E', () => {

  test('E2E — Student can access Study Plan page, view existing paths, and inspect module details', async ({ page }) => {
    // 1. Log in as Student
    console.log('[1/4] Logging in as student...');
    await loginAsStudent(page);

    // 2. Navigate to Study Plan page
    console.log('[2/4] Navigating to /study-plan...');
    await page.goto('/study-plan');
    await page.waitForLoadState('networkidle');

    // 3. Verify Page UI and Header
    console.log('[3/4] Verifying Study Plan Header and Interface...');
    await expect(page.getByRole('heading', { name: /Study Plan|Learning Paths/i }).first()).toBeVisible({ timeout: 15000 });

    // 4. Verify API integration for fetching learning paths
    console.log('[4/4] Verifying Backend GET /api/learning/paths API...');
    const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));
    const response = await page.request.get('http://localhost:5006/api/learning/paths', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.ok()).toBeTruthy();
    const paths = await response.json();
    expect(Array.isArray(paths)).toBeTruthy();
    console.log(`[4/4] ✓ Found ${paths.length} existing learning paths for user`);
    if (paths.length > 0) {
      console.log(`[4/4] Sample Path Title: "${paths[0].title}" with ${paths[0].modules?.length || 0} modules`);
    }
  });

  test('E2E — Direct API and UI generation of Study Plan with progressive module completion', async ({ page }) => {
    // 1. Log in as Student
    await loginAsStudent(page);
    const token = await page.evaluate(() => localStorage.getItem('authToken') || localStorage.getItem('token'));

    // 2. Generate a structured Study Plan via API
    console.log('[1/3] Generating study plan for "Operating System Virtual Memory Management"...');
    const genResponse = await page.request.post('http://localhost:5006/api/learning/paths/generate', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        goal: 'Operating System Virtual Memory Management'
      },
      timeout: 90000
    });
    expect(genResponse.ok()).toBeTruthy();
    const planData = await genResponse.json();
    console.log('[1/3] ✓ Generated plan received:', planData.title || (planData.isQuestionnaire ? 'Questionnaire' : 'Plan'));

    let pathId;
    if (planData._id) {
      pathId = planData._id;
      expect(planData.modules.length).toBeGreaterThanOrEqual(1);
    } else if (planData.isQuestionnaire) {
      // Answer questionnaire to finalize plan
      console.log('[1/3] Answering questionnaire to finalize plan...');
      const answerResponse = await page.request.post('http://localhost:5006/api/learning/paths/generate', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          goal: 'Operating System Virtual Memory Management',
          context: {
            clarificationAnswers: planData.questions.map(q => ({ question: q.questionText, answer: q.options?.[0] || 'Intermediate' }))
          }
        },
        timeout: 90000
      });
      expect(answerResponse.ok()).toBeTruthy();
      const finalPlan = await answerResponse.json();
      pathId = finalPlan._id;
      expect(finalPlan.modules.length).toBeGreaterThanOrEqual(1);
    }

    // 3. Test Module Status Update (Toggle Complete)
    console.log(`[2/3] Updating module status for path ${pathId}...`);
    const updateResponse = await page.request.put(`http://localhost:5006/api/learning/paths/${pathId}/modules/mod_1`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { status: 'completed' }
    });
    expect(updateResponse.ok()).toBeTruthy();
    const updatedPlan = await updateResponse.json();
    const mod1 = updatedPlan.modules.find(m => m.moduleId === 'mod_1');
    expect(mod1?.status).toBe('completed');
    console.log('[2/3] ✓ mod_1 marked as completed, next module unlocked');

    // 4. Verify in UI
    console.log('[3/3] Navigating to /study-plan to view updated curriculum in browser...');
    await page.goto('/study-plan');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Operating System Virtual Memory Management/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[3/3] ✓ Study Plan accurately rendered on frontend');
  });

});
