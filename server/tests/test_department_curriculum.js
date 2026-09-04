/**
 * server/tests/test_department_curriculum.js
 * 
 * Unit tests verifying multi-branch engineering scaling across CSE, ECE, EEE, MECH, CIVIL, and CORE.
 */

const assert = require('assert');
const {
    DEPARTMENTS,
    DEPARTMENT_METADATA,
    MASTER_CURRICULUM_CATALOG,
    getEnrolledSubjectsForStudent,
    getSubjectDetails
} = require('../services/departmentCurriculumService');

describe('Multi-Discipline Engineering Curriculum Service', () => {
    it('1: Should verify all 5 engineering departments + CORE exist with valid metadata', () => {
        assert.strictEqual(DEPARTMENTS.EEE, 'EEE');
        assert.strictEqual(DEPARTMENTS.CSE, 'CSE');
        assert.strictEqual(DEPARTMENTS.ECE, 'ECE');
        assert.strictEqual(DEPARTMENTS.MECH, 'MECH');
        assert.strictEqual(DEPARTMENTS.CIVIL, 'CIVIL');
        assert.strictEqual(DEPARTMENTS.CORE, 'CORE');

        assert.strictEqual(DEPARTMENT_METADATA.CSE.gateCode, 'CS');
        assert.strictEqual(DEPARTMENT_METADATA.ECE.gateCode, 'EC');
        assert.strictEqual(DEPARTMENT_METADATA.EEE.gateCode, 'EE');
        assert.strictEqual(DEPARTMENT_METADATA.MECH.gateCode, 'ME');
        assert.strictEqual(DEPARTMENT_METADATA.CIVIL.gateCode, 'CE');
    });

    it('2: Should resolve CSE enrolled curriculum including CORE courses', () => {
        const cseProfile = getEnrolledSubjectsForStudent('CSE');
        assert.strictEqual(cseProfile.department, 'CSE');
        assert.strictEqual(cseProfile.gatePaperCode, 'CS');
        
        const courseCodes = cseProfile.subjects.map(s => s.code);
        assert.ok(courseCodes.includes('CS2101'), 'Must include Data Structures & Algorithms');
        assert.ok(courseCodes.includes('CS3101'), 'Must include Operating Systems');
        assert.ok(courseCodes.includes('CS3691'), 'Must include Deep Learning');
        assert.ok(courseCodes.includes('MA1011'), 'Must include First-Year Mathematics Core');
    });

    it('3: Should resolve ECE enrolled curriculum', () => {
        const eceProfile = getEnrolledSubjectsForStudent('ECE');
        assert.strictEqual(eceProfile.department, 'ECE');
        const courseCodes = eceProfile.subjects.map(s => s.code);
        assert.ok(courseCodes.includes('EC2011'), 'Must include Signals and Systems');
        assert.ok(courseCodes.includes('EC3011'), 'Must include DSP');
        assert.ok(courseCodes.includes('EC3021'), 'Must include CMOS VLSI');
    });

    it('4: Should retrieve single subject details with visual diagram type', () => {
        const dsa = getSubjectDetails('CS2101');
        assert.ok(dsa);
        assert.strictEqual(dsa.name, 'Data Structures & Algorithms');
        assert.strictEqual(dsa.visual, 'TREE_MEMORY_LAYOUT');

        const vlsi = getSubjectDetails('EC3021');
        assert.ok(vlsi);
        assert.strictEqual(dsa.dept, 'CSE');
        assert.strictEqual(vlsi.visual, 'SVG_CIRCUIT');
    });
});
