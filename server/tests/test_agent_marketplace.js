/**
 * server/tests/test_agent_marketplace.js
 * 
 * Unit tests verifying:
 * 1. Searching & Filtering community subagents in marketplace
 * 2. Publishing dynamically synthesized agents to community store
 * 3. Starring, Unstarring, and My Starred Agents Collection
 * 4. Upvoting and Forking community agents
 */

const assert = require('assert');
const agentMarketplaceService = require('../services/agentMarketplaceService');

describe('Engineering Subagent Marketplace & Community Hub', () => {
    it('1: Should search and filter marketplace subagents by department and keyword', () => {
        const eeeAgents = agentMarketplaceService.searchAgents({ department: 'EEE' });
        assert.ok(eeeAgents.length >= 2);

        const solarAgent = agentMarketplaceService.searchAgents({ keyword: 'solar' });
        assert.ok(solarAgent.length >= 1);
        assert.strictEqual(solarAgent[0].agentId, 'market_solar_pv_npv');
    });

    it('2: Should allow students to star and unstar agents, maintaining personal collection', () => {
        const agentId = 'market_solar_pv_npv';
        const userId = 'sri_nit_andhra';

        // 1. Star
        const starRes = agentMarketplaceService.toggleStarAgent(agentId, userId);
        assert.strictEqual(starRes.isStarred, true);
        assert.ok(starRes.starCount >= 89);

        // 2. Query My Starred
        const myStarred = agentMarketplaceService.getStarredAgents(userId);
        assert.strictEqual(myStarred.length, 1);
        assert.strictEqual(myStarred[0].agentId, agentId);

        // 3. Unstar
        const unstarRes = agentMarketplaceService.toggleStarAgent(agentId, userId);
        assert.strictEqual(unstarRes.isStarred, false);
    });

    it('3: Should allow students to publish novel synthesized agents to the marketplace', () => {
        const customAgent = {
            name: 'Chebyshev_Filter_Synthesizer',
            title: '📡 5th-Order Chebyshev Lowpass Filter Synthesizer',
            department: 'ECE',
            courseCode: 'EC3011',
            specialty: 'Calculates pole-zero locations, ripple dB, and passive component ladder values',
            authorName: 'Student_Sri_NIT',
            categoryTags: ['DSP', 'Filters', 'Analog']
        };

        const published = agentMarketplaceService.publishAgent(customAgent);
        assert.ok(published.agentId);
        assert.strictEqual(published.authorName, 'Student_Sri_NIT');

        const found = agentMarketplaceService.searchAgents({ department: 'ECE', keyword: 'Chebyshev' });
        assert.strictEqual(found.length, 1);
    });

    it('4: Should upvote and fork community agents with incremented metrics', () => {
        const agentId = 'market_gate_nat_trap_solver';
        const upvoteRes = agentMarketplaceService.upvoteAgent(agentId);
        assert.ok(upvoteRes.upvotes > 215);

        const forkRes = agentMarketplaceService.forkAndExecute(agentId);
        assert.ok(forkRes.executableBlueprint);
        assert.strictEqual(forkRes.executableBlueprint.name, 'GATE_NAT_Trap_Auditor');
    });
});
