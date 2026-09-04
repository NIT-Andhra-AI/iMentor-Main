/**
 * server/tests/test_agent_progress_journal.js
 * 
 * Unit tests verifying:
 * 1. Live real-time subagent progress event emission (Promise-based)
 * 2. Persistent checkpoint state preservation
 * 3. Zero-loss auto-resume during computational bottlenecks without student intervention
 */

const assert = require('assert');
const agentProgressJournalService = require('../services/agentProgressJournalService');

describe('Live Subagent Progress & Persistent Memory Auto-Resume Service', () => {
    it('1: Should initialize mission journal and stream live progress updates', async () => {
        const missionId = 'mission_test_stream_101';
        const subagents = [
            { id: 'sa_web', name: 'web_search_agent', role: 'Fetch live solar data' },
            { id: 'sa_calc', name: 'financial_npv_modeler', role: 'Calculate cashflows' }
        ];

        agentProgressJournalService.initMissionJournal(missionId, 'Solar feasibility study', 'EEE', subagents);

        const eventPromise = new Promise((resolve) => {
            let eventCount = 0;
            const progressHandler = (event) => {
                eventCount++;
                assert.strictEqual(event.missionId, missionId);
                if (eventCount === 2) {
                    agentProgressJournalService.off(`progress:${missionId}`, progressHandler);
                    resolve();
                }
            };
            agentProgressJournalService.on(`progress:${missionId}`, progressHandler);
        });

        // Record updates
        agentProgressJournalService.recordProgress(missionId, 'sa_web', {
            state: 'RUNNING',
            progress: 50,
            action: 'Querying NASA insolation',
            stepLog: 'Retrieved 5.2 peak sun hours'
        });

        agentProgressJournalService.recordProgress(missionId, 'sa_web', {
            state: 'COMPLETED',
            progress: 100,
            action: 'Insolation complete',
            stepLog: 'Total annual energy = 7,500 kWh',
            intermediateData: { kwh_annual: 7500 }
        });

        await eventPromise;
    });

    it('2: Should auto-resume interrupted subagents from exact checkpoint without losing prior progress', () => {
        const missionId = 'mission_test_resume_202';
        const subagents = [
            { id: 'sa_1', name: 'data_gatherer', role: 'Gather data' },
            { id: 'sa_2', name: 'simulation_engine', role: 'Run Python simulation' }
        ];

        agentProgressJournalService.initMissionJournal(missionId, 'Simulate power converter', 'EEE', subagents);

        // Subagent 1 completes
        agentProgressJournalService.recordProgress(missionId, 'sa_1', {
            state: 'COMPLETED',
            progress: 100,
            action: 'Done',
            stepLog: 'Step 1 complete',
            intermediateData: { v_in: 24, v_out: 12 }
        });

        // Subagent 2 gets paused at 40% due to computational bottleneck
        agentProgressJournalService.recordProgress(missionId, 'sa_2', {
            state: 'PAUSED_BOTTLENECK',
            progress: 40,
            action: 'Running RK4 differential equation step',
            stepLog: 'Computed t = 0 to 5ms',
            intermediateData: { inductor_current_peak: 4.8 }
        });

        // Trigger Auto-Resume (no student input needed)
        const resumeResult = agentProgressJournalService.autoResumeMission(missionId);
        assert.strictEqual(resumeResult.resumedCount, 1);
        assert.strictEqual(resumeResult.resumedSubagents[0].id, 'sa_2');

        const journal = agentProgressJournalService.getJournal(missionId);
        const sub2 = journal.subagents.find(s => s.id === 'sa_2');
        assert.strictEqual(sub2.state, 'RESUMING');
        assert.strictEqual(sub2.progress, 40); // Preserved progress
        assert.strictEqual(sub2.intermediateData.inductor_current_peak, 4.8); // Preserved intermediate memory
    });
});
