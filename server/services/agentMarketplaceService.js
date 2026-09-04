/**
 * server/services/agentMarketplaceService.js
 * 
 * Subagent Marketplace & Community Agent Hub Service
 * Allows students to:
 * 1. Browse & Search community subagents across CSE, ECE, EEE, MECH, CIVIL, CORE
 * 2. Publish dynamically synthesized on-the-fly subagents to the marketplace
 * 3. Fork & Execute community agents with custom inputs
 * 4. Star & Bookmark agents to personal collection with Star-Ranked Leaderboard
 * 5. Upvote & Rate peer-created agents
 */

const SEEDED_MARKETPLACE_AGENTS = [
    {
        agentId: 'market_solar_pv_npv',
        name: 'SolarPV_Cashflow_Optimizer',
        title: '☀️ 10-Year Rooftop Solar PV & Battery NPV Modeler',
        department: 'EEE',
        courseCode: 'EE2611',
        specialty: 'Calculates solar insolation, LFP battery degradation, LCOE, and 10-year discounted cashflows',
        samplePrompt: 'Evaluate a 5kW rooftop solar PV system in Andhra Pradesh with lithium batteries over 10 years.',
        authorName: 'AutoSwarm Verified',
        upvotes: 142,
        starCount: 88,
        starredBy: ['student_1', 'student_2'],
        usageCount: 860,
        isVerified: true,
        categoryTags: ['Renewable', 'Solar', 'Economics', 'Energy']
    },
    {
        agentId: 'market_fpga_systolic',
        name: 'SystolicArray_FPGA_Architect',
        title: '💻 FPGA Systolic Array & Timing Closure Synthesizer',
        department: 'ECE',
        courseCode: 'EC3021',
        specialty: 'Designs matrix multiplication systolic arrays, models Elmore delays, and verifies timing closure',
        samplePrompt: 'Design a 4x4 matrix multiplication systolic array on Xilinx Artix-7 and optimize DSP slices.',
        authorName: 'Prof. VLSI Group',
        upvotes: 98,
        starCount: 64,
        starredBy: ['student_3'],
        usageCount: 520,
        isVerified: true,
        categoryTags: ['VLSI', 'FPGA', 'Hardware', 'Systolic']
    },
    {
        agentId: 'market_gate_nat_trap_solver',
        name: 'GATE_NAT_Trap_Auditor',
        title: '🎯 GATE 2-Mark NAT Trap & Shortcut Auditor',
        department: 'EEE',
        courseCode: 'EE3011',
        specialty: 'Audits boundary conditions, DCM vs CCM traps, and derives exact 2-mark numerical shortcuts',
        samplePrompt: 'Solve 2024 GATE Power Electronics Buck converter critical inductance problem step-by-step.',
        authorName: 'GATE Toppers Community',
        upvotes: 215,
        starCount: 175,
        starredBy: ['student_1', 'student_4', 'student_5'],
        usageCount: 1420,
        isVerified: true,
        categoryTags: ['GATE', 'Numericals', 'Shortcuts', 'Traps']
    },
    {
        agentId: 'market_ats_cv_rewriter',
        name: 'ATS_Engineering_CV_Optimizer',
        title: '📄 Tier-1 Core Engineering ATS Resume Optimizer',
        department: 'CORE',
        courseCode: 'ALL',
        specialty: 'Benchmarks student CV against Qualcomm/Tesla/Google job specs and rewrites bullets with action verbs',
        samplePrompt: 'Optimize my electrical engineering CV for a Texas Instruments Hardware Application Engineer role.',
        authorName: 'Placement Cell AI',
        upvotes: 340,
        starCount: 290,
        starredBy: ['student_1', 'student_2', 'student_3'],
        usageCount: 2890,
        isVerified: true,
        categoryTags: ['Placement', 'Resume', 'ATS', 'Career']
    }
];

class AgentMarketplaceService {
    constructor() {
        this.agents = new Map();
        SEEDED_MARKETPLACE_AGENTS.forEach(a => this.agents.set(a.agentId, { ...a, starredBy: [...a.starredBy] }));
    }

    /**
     * Search community agents with filters, sorted by star count
     */
    searchAgents(options = {}) {
        const { department = 'ALL', keyword = '', category = '', sortBy = 'stars' } = options;
        const deptUpper = (department || 'ALL').toUpperCase();
        const kwLower = (keyword || '').toLowerCase();
        const catLower = (category || '').toLowerCase();

        const results = Array.from(this.agents.values()).filter(agent => {
            if (deptUpper !== 'ALL' && agent.department !== deptUpper && agent.department !== 'CORE') {
                return false;
            }
            if (kwLower) {
                const text = `${agent.name} ${agent.title} ${agent.specialty} ${agent.courseCode || ''}`.toLowerCase();
                if (!text.includes(kwLower)) return false;
            }
            if (catLower && !agent.categoryTags.some(t => t.toLowerCase() === catLower)) {
                return false;
            }
            return true;
        });

        // Sort by stars by default
        results.sort((a, b) => (b.starCount || 0) - (a.starCount || 0));
        return results;
    }

    /**
     * Toggle Star on a community agent
     */
    toggleStarAgent(agentId, userId = 'student_user') {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found in marketplace`);

        if (!agent.starredBy) agent.starredBy = [];

        const index = agent.starredBy.indexOf(userId);
        let isStarred = false;

        if (index > -1) {
            // Unstar
            agent.starredBy.splice(index, 1);
            agent.starCount = Math.max(0, (agent.starCount || 1) - 1);
            isStarred = false;
        } else {
            // Star
            agent.starredBy.push(userId);
            agent.starCount = (agent.starCount || 0) + 1;
            isStarred = true;
        }

        return {
            agentId,
            isStarred,
            starCount: agent.starCount
        };
    }

    /**
     * Get all agents starred by a specific student
     */
    getStarredAgents(userId) {
        return Array.from(this.agents.values()).filter(agent => 
            (agent.starredBy || []).includes(userId)
        );
    }

    /**
     * Publish a new or dynamically created agent to the marketplace
     */
    publishAgent(agentData) {
        const agentId = agentData.agentId || `market_custom_${Date.now()}`;
        const newAgent = {
            agentId,
            name: agentData.name,
            title: agentData.title || agentData.name,
            department: agentData.department || 'CORE',
            courseCode: agentData.courseCode || 'GENERAL',
            specialty: agentData.specialty || agentData.role || 'Specialized Engineering Analysis',
            samplePrompt: agentData.samplePrompt || 'Run analysis',
            authorName: agentData.authorName || 'Student Community',
            upvotes: 1,
            starCount: 1,
            starredBy: [agentData.authorName || 'author'],
            usageCount: 1,
            isVerified: false,
            categoryTags: agentData.categoryTags || ['Community', 'Custom'],
            publishedAt: new Date().toISOString()
        };
        this.agents.set(agentId, newAgent);
        return newAgent;
    }

    /**
     * Upvote a community agent
     */
    upvoteAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found in marketplace`);
        agent.upvotes++;
        return { agentId, upvotes: agent.upvotes };
    }

    /**
     * Fork and execute an agent from the marketplace
     */
    forkAndExecute(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found in marketplace`);
        agent.usageCount++;
        return {
            agent,
            executableBlueprint: {
                name: agent.name,
                specialty: agent.specialty,
                samplePrompt: agent.samplePrompt
            }
        };
    }
}

const agentMarketplaceService = new AgentMarketplaceService();

module.exports = agentMarketplaceService;
