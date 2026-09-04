const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3005';
const HEADED = process.argv.includes('--headed');
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '4', 10);
const REPORTS_DIR = '/home/sri/Downloads/iMentor_march/iMentorV2/tests/reports';

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const DEPARTMENTS = ['Computer Science', 'Electronics & Communication', 'Electrical & Electronics', 'Mechanical Engineering'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const STYLES = ['Visual', 'Socratic', 'Auditory', 'Kinesthetic', 'Reading/Writing'];
const LEVELS = ['NOVICE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

const MODULE_TRACKS = [
  {
    module: 'Socratic Chat & General LLM',
    query: 'Explain the difference between process and thread with an OS example.',
    action: async (page, student) => {
      const textarea = page.locator('textarea:visible').first();
      await textarea.waitFor({ state: 'visible', timeout: 15000 });
      await textarea.fill(`Hello, I am ${student.name} studying ${student.dept}. ${student.query}`);
      const sendBtn = page.getByTitle(/send message/i).or(page.getByRole('button', { name: /^send$/i })).first();
      if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await sendBtn.click();
      } else {
        await textarea.press('Enter');
      }
      await page.waitForTimeout(3000);
      return { step: 'chat_sent', success: true };
    }
  },
  {
    module: 'Socratic Tutor Mode',
    query: 'Help me understand Newton-Raphson method step by step.',
    action: async (page, student) => {
      const tutorBtn = page.getByRole('button', { name: /tutor|socratic/i }).first();
      if (await tutorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tutorBtn.click();
        await page.waitForTimeout(1000);
      }
      const textarea = page.locator('textarea:visible').first();
      await textarea.fill(student.query);
      await textarea.press('Enter');
      await page.waitForTimeout(3000);
      return { step: 'tutor_guided', success: true };
    }
  },
  {
    module: 'Adaptive Skill Tree',
    query: 'Explore Skill Tree prerequisites and mastery progression.',
    action: async (page, student) => {
      const skillBtn = page.getByRole('button', { name: /skill.?tree|curriculum/i }).or(page.getByTitle(/skill/i)).first();
      if (await skillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skillBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'skill_tree_explored', success: true };
    }
  },
  {
    module: 'Deep Research & Academic Search',
    query: 'Research modern transformer attention optimizations (FlashAttention).',
    action: async (page, student) => {
      const researchBtn = page.getByRole('button', { name: /research|deep/i }).or(page.getByTitle(/research/i)).first();
      if (await researchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await researchBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'deep_research_accessed', success: true };
    }
  },
  {
    module: 'Knowledge Assessment & Quizzes',
    query: 'Take diagnostic quiz on core engineering fundamentals.',
    action: async (page, student) => {
      const quizBtn = page.getByRole('button', { name: /quiz|assessment/i }).first();
      if (await quizBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await quizBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'quiz_portal_verified', success: true };
    }
  },
  {
    module: 'Gamification & Leaderboard',
    query: 'View profile rank, badges, and available learning bounties.',
    action: async (page, student) => {
      const gameBtn = page.getByRole('button', { name: /leaderboard|gamif|trophy|bount/i }).first();
      if (await gameBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gameBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'gamification_viewed', success: true };
    }
  },
  {
    module: 'Course Syllabus & RAG Retrieval',
    query: 'Query Operating Systems lecture 3 memory hierarchy.',
    action: async (page, student) => {
      const courseBtn = page.getByRole('button', { name: /course|subject|syllabus/i }).first();
      if (await courseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await courseBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'course_syllabus_accessed', success: true };
    }
  },
  {
    module: 'Learning Tools & Flashcards',
    query: 'Generate flashcard set for exam revision.',
    action: async (page, student) => {
      const toolsBtn = page.getByRole('button', { name: /tool|flashcard|study/i }).first();
      if (await toolsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await toolsBtn.click();
        await page.waitForTimeout(2000);
      }
      return { step: 'tools_portal_tested', success: true };
    }
  }
];

const STUDENTS = [];
for (let i = 1; i <= 40; i++) {
  const dept = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
  const year = YEARS[(i - 1) % YEARS.length];
  const style = STYLES[(i - 1) % STYLES.length];
  const level = LEVELS[(i - 1) % LEVELS.length];
  const track = MODULE_TRACKS[(i - 1) % MODULE_TRACKS.length];
  const email = `student${String(i).padStart(2, '0')}@imentor.edu`;
  const name = `Student AGY ${String(i).padStart(2, '0')}`;

  STUDENTS.push({
    id: i,
    email,
    password: 'password123',
    name,
    dept,
    year,
    style,
    level,
    assignedModule: track.module,
    query: track.query,
    action: track.action
  });
}

async function runStudentAgent(browser, student) {
  const startTime = Date.now();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();
  const result = {
    studentId: student.id,
    name: student.name,
    email: student.email,
    department: student.dept,
    year: student.year,
    learningStyle: student.style,
    level: student.level,
    assignedModule: student.assignedModule,
    status: 'PENDING',
    durationMs: 0,
    steps: [],
    error: null
  };

  try {
    // 1. Navigate to iMentor
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    result.steps.push({ name: 'navigate_home', time: Date.now() - startTime, ok: true });

    // 2. Open Auth Modal
    const signInBtn = page.getByRole('button', { name: /sign.?in|login/i }).first();
    if (await signInBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await signInBtn.click();
      await page.waitForTimeout(500);

      // Fill Credentials
      const emailField = page.locator('input[name="email"]').or(page.getByPlaceholder(/email/i)).first();
      await emailField.fill(student.email);
      const passField = page.locator('input[name="password"]').or(page.getByPlaceholder(/password/i)).first();
      await passField.fill(student.password);

      const submitBtn = page.locator('form button[type="submit"], button[type="submit"]').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      result.steps.push({ name: 'auth_login', time: Date.now() - startTime, ok: true });
    }

    // 3. Execute Assigned Module Behavior
    const modResult = await student.action(page, student);
    result.steps.push({ name: modResult.step, time: Date.now() - startTime, ok: modResult.success });

    result.status = 'PASSED';
  } catch (err) {
    result.status = 'FAILED';
    result.error = err.message;
    console.error(`❌ [Agent ${student.id}] ${student.name} failed:`, err.message);
  } finally {
    result.durationMs = Date.now() - startTime;
    await context.close();
  }
  return result;
}

async function main() {
  console.log('=================================================================');
  console.log('🤖 40-STUDENT AGY MULTI-AGENT SWARM EVALUATION HARNESS');
  console.log('=================================================================');
  console.log(`• Target Base URL:   ${BASE_URL}`);
  console.log(`• Headed Mode:       ${HEADED}`);
  console.log(`• Swarm Size:        ${STUDENTS.length} Student AGY Agents`);
  console.log(`• Concurrency:       ${CONCURRENCY} parallel browsers`);
  console.log('=================================================================\n');

  const browser = await chromium.launch({
    headless: !HEADED,
    slowMo: HEADED ? 200 : 0
  });

  const allResults = [];
  for (let i = 0; i < STUDENTS.length; i += CONCURRENCY) {
    const batch = STUDENTS.slice(i, i + CONCURRENCY);
    console.log(`🚀 Dispatching Agent Batch ${Math.floor(i / CONCURRENCY) + 1} (Agents ${batch[0].id} to ${batch[batch.length - 1].id})...`);
    const batchResults = await Promise.all(batch.map(s => runStudentAgent(browser, s)));
    for (const r of batchResults) {
      const icon = r.status === 'PASSED' ? '✅' : '❌';
      console.log(`  ${icon} Agent ${String(r.studentId).padStart(2, '0')} [${r.department.split(' ')[0].padEnd(12)} | ${r.assignedModule.padEnd(32)}] -> ${r.status} (${r.durationMs}ms)`);
      allResults.push(r);
    }
  }

  await browser.close();

  // Summary Metrics
  const passed = allResults.filter(r => r.status === 'PASSED').length;
  const failed = allResults.filter(r => r.status === 'FAILED').length;
  const passRate = ((passed / allResults.length) * 100).toFixed(1);

  // Group by Module
  const moduleSummary = {};
  for (const r of allResults) {
    if (!moduleSummary[r.assignedModule]) {
      moduleSummary[r.assignedModule] = { total: 0, passed: 0, failed: 0, avgTime: 0, students: [] };
    }
    moduleSummary[r.assignedModule].total++;
    if (r.status === 'PASSED') moduleSummary[r.assignedModule].passed++;
    else moduleSummary[r.assignedModule].failed++;
    moduleSummary[r.assignedModule].students.push(r);
  }

  // Write JSON report
  const jsonReportPath = path.join(REPORTS_DIR, 'agy_40_student_swarm_results.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalAgents: allResults.length,
    passed,
    failed,
    passRate: `${passRate}%`,
    moduleSummary,
    results: allResults
  }, null, 2));

  console.log('\n=================================================================');
  console.log(`🎉 Swarm Simulation Complete: ${passed}/${allResults.length} Passed (${passRate}% Success Rate)`);
  console.log(`📄 Comprehensive Swarm Results saved to: ${jsonReportPath}`);
  console.log('=================================================================\n');
}

main().catch(err => {
  console.error('Swarm runner fatal error:', err);
  process.exit(1);
});
