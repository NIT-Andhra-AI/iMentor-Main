/**
 * server/tests/test_student_agent_swarm.js
 * 
 * Unit tests verifying Student Agent Swarm Missions:
 * 1. GATE 3-Year PYQ & Weightage Dossier
 * 2. Company Interview & Coding Questions Prep
 * 3. Resume / CV Career Fit & ATS Optimizer
 */

const assert = require('assert');
const {
    SWARM_MISSION_TYPES,
    classifySwarmMission,
    executeStudentSwarmMission
} = require('../services/studentAgentSwarmService');

describe('Autonomous Student Agent Swarm Service', () => {
    it('1: Should classify student mission prompts correctly', () => {
        assert.strictEqual(
            classifySwarmMission('Fetch all last 3 year question papers for Electrical GATE and show weightage of each topic'),
            SWARM_MISSION_TYPES.GATE_PYQ_DOSSIER
        );
        assert.strictEqual(
            classifySwarmMission('What are common interview questions or coding questions asked by Texas Instruments?'),
            SWARM_MISSION_TYPES.COMPANY_INTERVIEW_PREP
        );
        assert.strictEqual(
            classifySwarmMission('Here is my resume and CV, where do I fit and how can I improve my CV?'),
            SWARM_MISSION_TYPES.RESUME_CAREER_FIT
        );
    });

    it('2: Should execute GATE PYQ Dossier mission with concurrent subagent DAG', async () => {
        const prompt = 'Fetch all last 3 year question papers for Electrical GATE and show weightage of each topic with solutions';
        const result = await executeStudentSwarmMission(prompt, { department: 'EEE' });

        assert.ok(result);
        assert.strictEqual(result.missionType, SWARM_MISSION_TYPES.GATE_PYQ_DOSSIER);
        assert.strictEqual(result.subagents.length, 4);
        assert.ok(result.finalDossier.includes('Topic Marks Weightage Matrix'));
        assert.ok(result.finalDossier.includes('Power Electronics'));
        assert.strictEqual(result.isAgenticSwarm, true);
    });

    it('3: Should execute Company Interview Prep mission', async () => {
        const prompt = 'What are common interview questions and coding challenges for Qualcomm?';
        const result = await executeStudentSwarmMission(prompt, { department: 'ECE' });

        assert.strictEqual(result.missionType, SWARM_MISSION_TYPES.COMPANY_INTERVIEW_PREP);
        assert.ok(result.finalDossier.includes('Technical Interview Focus'));
        assert.ok(result.subagents.some(s => s.name === 'coding_challenge_designer'));
    });

    it('4: Should execute Resume & Career Fit mission with gap analysis and ATS bullet points', async () => {
        const prompt = 'Analyze my CV: B.Tech student with C++, circuit design, and MATLAB. Where do I fit?';
        const result = await executeStudentSwarmMission(prompt, { department: 'EEE' });

        assert.strictEqual(result.missionType, SWARM_MISSION_TYPES.RESUME_CAREER_FIT);
        assert.ok(result.finalDossier.includes('Gap Analysis'));
        assert.ok(result.finalDossier.includes('Action-Verb ATS Rewrite'));
    });
});
