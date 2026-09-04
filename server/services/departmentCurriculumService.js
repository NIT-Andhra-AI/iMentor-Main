/**
 * server/services/departmentCurriculumService.js
 * 
 * Manages Multi-Discipline Engineering Curricula across all departments:
 * - EEE (Electrical & Electronics)
 * - CSE (Computer Science)
 * - ECE (Electronics & Communication)
 * - MECH (Mechanical)
 * - CIVIL (Civil)
 * - CORE (Common First-Year Engineering Sciences)
 */

const DEPARTMENTS = {
    EEE: 'EEE',
    CSE: 'CSE',
    ECE: 'ECE',
    MECH: 'MECH',
    CIVIL: 'CIVIL',
    CORE: 'CORE'
};

const DEPARTMENT_METADATA = {
    EEE: {
        name: 'Electrical & Electronics Engineering',
        gateCode: 'EE',
        accentColor: '#38bdf8',
        defaultSubjects: ['EE3011', 'EE2031', 'EE2061'],
        icon: 'Zap'
    },
    CSE: {
        name: 'Computer Science & Engineering',
        gateCode: 'CS',
        accentColor: '#34d399',
        defaultSubjects: ['CS2101', 'CS3101', 'CS3201', 'CS3691'],
        icon: 'Code'
    },
    ECE: {
        name: 'Electronics & Communication Engineering',
        gateCode: 'EC',
        accentColor: '#a855f7',
        defaultSubjects: ['EC2011', 'EC3011', 'EC3021'],
        icon: 'Radio'
    },
    MECH: {
        name: 'Mechanical Engineering',
        gateCode: 'ME',
        accentColor: '#f97316',
        defaultSubjects: ['ME2011', 'ME2021'],
        icon: 'Cpu'
    },
    CIVIL: {
        name: 'Civil Engineering',
        gateCode: 'CE',
        accentColor: '#eab308',
        defaultSubjects: ['CE2011', 'CE2021'],
        icon: 'Building'
    },
    CORE: {
        name: 'First-Year Engineering Core',
        gateCode: 'ALL',
        accentColor: '#64748b',
        defaultSubjects: ['MA1011', 'CS1011'],
        icon: 'GraduationCap'
    }
};

const MASTER_CURRICULUM_CATALOG = {
    // EEE
    'EE3011': { code: 'EE3011', name: 'Power Electronics & Converters', dept: 'EEE', sem: 5, credits: 4, gate: 'EE', visual: 'SVG_CIRCUIT' },
    'EE2031': { code: 'EE2031', name: 'Power System Analysis', dept: 'EEE', sem: 4, credits: 4, gate: 'EE', visual: 'SVG_CIRCUIT' },
    'EE2061': { code: 'EE2061', name: 'Control Systems Engineering', dept: 'EEE', sem: 4, credits: 4, gate: 'EE', visual: 'BODE_NYQUIST_SVG' },

    // CSE
    'CS2101': { code: 'CS2101', name: 'Data Structures & Algorithms', dept: 'CSE', sem: 3, credits: 4, gate: 'CS', visual: 'TREE_MEMORY_LAYOUT' },
    'CS3101': { code: 'CS3101', name: 'Operating Systems & Concurrency', dept: 'CSE', sem: 5, credits: 4, gate: 'CS', visual: 'MERMAID_DAG' },
    'CS3201': { code: 'CS3201', name: 'Database Management Systems', dept: 'CSE', sem: 5, credits: 4, gate: 'CS', visual: 'MERMAID_DAG' },
    'CS3691': { code: 'CS3691', name: 'Deep Learning & Foundation Models', dept: 'CSE', sem: 6, credits: 4, gate: 'CS', visual: 'MERMAID_DAG' },

    // ECE
    'EC2011': { code: 'EC2011', name: 'Signals and Systems', dept: 'ECE', sem: 3, credits: 4, gate: 'EC', visual: 'WAVEFORM_SVG' },
    'EC3011': { code: 'EC3011', name: 'Digital Signal Processing', dept: 'ECE', sem: 5, credits: 4, gate: 'EC', visual: 'WAVEFORM_SVG' },
    'EC3021': { code: 'EC3021', name: 'CMOS VLSI Design', dept: 'ECE', sem: 5, credits: 4, gate: 'EC', visual: 'SVG_CIRCUIT' },

    // MECH
    'ME2011': { code: 'ME2011', name: 'Engineering Thermodynamics', dept: 'MECH', sem: 3, credits: 4, gate: 'ME', visual: 'PV_TS_DIAGRAM_SVG' },
    'ME2021': { code: 'ME2021', name: 'Mechanics of Materials & Stress Analysis', dept: 'MECH', sem: 4, credits: 4, gate: 'ME', visual: 'STRESS_STRAIN_SVG' },

    // CIVIL
    'CE2011': { code: 'CE2011', name: 'Structural Analysis', dept: 'CIVIL', sem: 4, credits: 4, gate: 'CE', visual: 'STRESS_STRAIN_SVG' },
    'CE2021': { code: 'CE2021', name: 'Fluid Mechanics & Hydraulics', dept: 'CIVIL', sem: 3, credits: 4, gate: 'CE', visual: 'WAVEFORM_SVG' },

    // CORE
    'MA1011': { code: 'MA1011', name: 'Multivariable Calculus & Differential Equations', dept: 'CORE', sem: 1, credits: 4, gate: 'ALL', visual: 'WAVEFORM_SVG' },
    'CS1011': { code: 'CS1011', name: 'Problem Solving & Python Programming', dept: 'CORE', sem: 1, credits: 3, gate: 'ALL', visual: 'TREE_MEMORY_LAYOUT' }
};

/**
 * Get enrolled subjects for a student given their department and semester
 */
function getEnrolledSubjectsForStudent(department, semester = null) {
    const deptKey = (department || 'EEE').toUpperCase();
    const deptInfo = DEPARTMENT_METADATA[deptKey] || DEPARTMENT_METADATA.EEE;

    const subjects = Object.values(MASTER_CURRICULUM_CATALOG).filter(s => {
        if (s.dept !== deptKey && s.dept !== 'CORE') return false;
        if (semester && s.sem !== semester && s.dept !== 'CORE') return false;
        return true;
    });

    return {
        department: deptKey,
        departmentName: deptInfo.name,
        gatePaperCode: deptInfo.gateCode,
        semester: semester || 'ALL',
        subjects: subjects
    };
}

/**
 * Get single course metadata
 */
function getSubjectDetails(courseCode) {
    if (!courseCode) return null;
    return MASTER_CURRICULUM_CATALOG[courseCode.toUpperCase()] || null;
}

module.exports = {
    DEPARTMENTS,
    DEPARTMENT_METADATA,
    MASTER_CURRICULUM_CATALOG,
    getEnrolledSubjectsForStudent,
    getSubjectDetails
};
