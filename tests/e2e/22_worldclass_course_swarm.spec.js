// tests/e2e/22_worldclass_course_swarm.spec.js
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { loginAs } from './helpers/auth.js';

test.describe('World-Class 3-Credit Course Multi-Agent Swarm & Platform Ingestion', () => {

  test('1. Python Multi-Agent Swarm generates complete 36-Lecture 3-Credit Course Package from Title only', async () => {
    console.log('[1/4] Executing Course Creation Swarm for: [CS702] Deep Reinforcement Learning...');
    
    const cmd = 'python3 course_bootstrap/build_course.py --name "Deep Reinforcement Learning" --code "CS702"';
    const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
    
    expect(output).toContain('World-Class 3-Credit Course [CS702]');
    expect(output).toContain('Academic Quality Score: 100/100');
    expect(output).toContain('Total Subtopic Lectures: 36');
    expect(output).toContain('Hands-on Industry Labs:  4 + Capstone Project');
    console.log('[1/4] ✓ Swarm generated complete 36-lecture course package with 100/100 Quality Score');

    // Verify generated filesystem artifacts
    const courseDir = path.join(process.cwd(), 'course_bootstrap', 'CS702');
    expect(fs.existsSync(path.join(courseDir, 'syllabus.csv'))).toBe(true);
    expect(fs.existsSync(path.join(courseDir, 'stn_graph.json'))).toBe(true);
    expect(fs.existsSync(path.join(courseDir, 'quality_audit_report.json'))).toBe(true);
    expect(fs.existsSync(path.join(courseDir, 'concept_question_bank.json'))).toBe(true);
    expect(fs.existsSync(path.join(courseDir, 'labs', 'capstone_project.md'))).toBe(true);
    expect(fs.existsSync(path.join(courseDir, 'interactive_portal', 'index.html'))).toBe(true);

    // Verify KaTeX math & Mermaid in Lecture 1
    const l1Content = fs.readFileSync(path.join(courseDir, 'lectures', 'L1.md'), 'utf-8');
    expect(l1Content).toContain('Markov Decision Process');
    expect(l1Content).toContain('Q^*(s, a)');
    expect(l1Content).toContain('```mermaid');
    expect(l1Content).toContain('Worked Engineering Numerical Example');
    expect(l1Content).toContain('Curated Online Video Lectures');
    expect(l1Content).toContain('Real-World Industrial Case Study');

    // Verify Labs & Capstone
    const capstoneContent = fs.readFileSync(path.join(courseDir, 'labs', 'capstone_project.md'), 'utf-8');
    expect(capstoneContent).toContain('Industrial Capstone Project');
    expect(capstoneContent).toContain('Evaluation Rubric & Defense Criteria');

    console.log('[1/4] ✓ All 8-agent swarm deliverables verified on disk');
  });

  test('2. Python Multi-Agent Swarm generates 36-Lecture Course for novel topic from Title without syllabus', async () => {
    console.log('[2/4] Executing Course Creation Swarm for novel topic: [QC401] Quantum Information and Quantum Computing...');
    
    const cmd = 'python3 course_bootstrap/build_course.py --name "Quantum Information and Quantum Computing" --code "QC401"';
    const output = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });
    
    expect(output).toContain('World-Class 3-Credit Course [QC401]');
    expect(output).toContain('Total Subtopic Lectures: 36');
    expect(output).toContain('Academic Quality Score: 100/100');

    const cqbData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'course_bootstrap', 'QC401', 'concept_question_bank.json'), 'utf-8'));
    expect(cqbData.total_questions).toBe(108);
    expect(cqbData.topics.length).toBe(36);

    const auditData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'course_bootstrap', 'QC401', 'quality_audit_report.json'), 'utf-8'));
    expect(auditData.passed).toBe(true);
    expect(auditData.checks.curriculum_structure.total_lectures).toBe(36);
    expect(auditData.checks.curriculum_structure.course_outcomes_count).toBe(5);

    console.log('[2/4] ✓ 36-lecture 3-credit curriculum and 108-question CQB verified');
  });

  test('3. UI Navigation & Guided Learning Mode Header Verification', async ({ page }) => {
    test.setTimeout(60000);
    console.log('[3/4] Testing UI Navigation to Tutor Mode and verifying Guided Learning badge...');
    
    await loginAs(page, 'student@imentor.edu', 'password123');
    await page.goto('/tutor', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Verify Guided Learning or Tutor heading is rendered in header
    const tutorHeader = page.getByText(/Guided Learning|General Socratic Mode|Module Roadmap/i).first();
    await expect(tutorHeader).toBeVisible({ timeout: 20000 });
    console.log('[3/4] ✓ Verified Tutor Mode & Guided Learning header');

    // Verify Subject selector is interactive
    const subjectSelect = page.locator('select[data-tutor-tour="subject-select"]').or(page.locator('select')).first();
    await expect(subjectSelect).toBeVisible({ timeout: 10000 });
    console.log('[3/4] ✓ Verified Subject selector is accessible');
  });
});

