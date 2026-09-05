/**
 * E2E Integration Test: Active Question Validator & Path Sanitization
 */
const activeQuestionValidatorService = require('../server/services/activeQuestionValidatorService');
const { sanitizeObject } = require('../server/middleware/pathSanitizerMiddleware');

async function runE2ETest() {
    console.log('=== STARTING ACTIVE QUESTION VALIDATOR E2E INTEGRATION TEST ===\n');

    const testCourse = 'EE1011';
    const testLevelId = 1;
    const testLevelName = 'Level 1 - Core Electrical Principles & DC Network Analysis';

    // 1. Initial Level Evaluation Request (50 questions)
    console.log(`[TEST 1] Requesting Level 1 Questions for ${testCourse}...`);
    const res1 = await activeQuestionValidatorService.validateAndGenerateFreshQuestions({
        userId: null,
        courseCode: testCourse,
        topic: 'Electric Circuits',
        levelId: testLevelId,
        levelName: testLevelName,
        requestedCount: 50,
        seenQuestions: []
    });

    console.log(`✓ Total Questions Served: ${res1.questions.length}`);
    console.log(`✓ Deduplication Active: ${res1.deduplicationActive}`);
    console.log(`✓ LLM Synthesized Count: ${res1.llmSynthesizedCount}`);
    console.log(`✓ Validation Time: ${res1.validationTimeMs}ms`);

    if (res1.questions.length !== 50) {
        throw new Error(`Expected 50 questions, got ${res1.questions.length}`);
    }

    // 2. Retry / Refresh Test with seenQuestions (50 questions previously seen)
    console.log('\n[TEST 2] Testing Level Retry / Refresh (Deduplication against 50 seen questions)...');
    const seenQuestionTexts = res1.questions.map(q => q.question);

    const res2 = await activeQuestionValidatorService.validateAndGenerateFreshQuestions({
        userId: null,
        courseCode: testCourse,
        topic: 'Electric Circuits',
        levelId: testLevelId,
        levelName: testLevelName,
        requestedCount: 50,
        seenQuestions: seenQuestionTexts
    });

    console.log(`✓ Retry Questions Served: ${res2.questions.length}`);
    const res2QuestionTexts = res2.questions.map(q => q.question);
    const overlap = res2QuestionTexts.filter(qTxt => seenQuestionTexts.includes(qTxt));
    console.log(`✓ Overlapping Questions with Previous Attempt: ${overlap.length}`);

    // 3. Path & IP Sanitization Verification
    console.log('\n[TEST 3] Verifying Path & IP Sanitizer Middleware...');
    const rawPayload = {
        status: 'success',
        questions: res2.questions.slice(0, 2),
        debugInfo: {
            internalPath: '/home/sri/Downloads/iMentor_march/iMentorV2/server/routes/gamification.js',
            localIp: '127.0.0.1',
            publicIp: '61.0.228.124',
            host: 'localhost:5000'
        }
    };

    const sanitized = sanitizeObject(rawPayload);
    const sanitizedStr = JSON.stringify(sanitized);

    console.log('Sanitized Payload Preview:', JSON.stringify(sanitized.debugInfo, null, 2));

    const containsPath = sanitizedStr.includes('/home/sri');
    const containsLocalIp = sanitizedStr.includes('127.0.0.1');

    if (containsPath || containsLocalIp) {
        throw new Error('SECURITY BREACH: Sanitizer failed to scrub absolute paths or local IP!');
    } else {
        console.log('✓ Security Check Passed: Absolute paths and local IPs successfully scrubbed.');
    }

    console.log('\n=== ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
    process.exit(0);
}

runE2ETest().catch(err => {
    console.error('❌ E2E Integration Test Failed:', err);
    process.exit(1);
});
