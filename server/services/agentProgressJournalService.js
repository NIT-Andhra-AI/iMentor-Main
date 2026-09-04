/**
 * server/services/agentProgressJournalService.js
 * 
 * Manages Live Real-Time Subagent Progress Streaming (SSE / WebSocket)
 * and Persistent Checkpoint Auto-Resume during computational bottlenecks.
 */

const EventEmitter = require('events');

class AgentProgressJournalService extends EventEmitter {
    constructor() {
        super();
        this.missionCheckpoints = new Map();
        this.activeEventStreams = new Map();
    }

    /**
     * Initialize a mission checkpoint journal
     */
    initMissionJournal(missionId, goal, department, subagents = []) {
        const journal = {
            missionId,
            goal,
            department,
            totalSubagents: subagents.length,
            completedCount: 0,
            isBottlenecked: false,
            createdAt: new Date().toISOString(),
            subagents: subagents.map(s => ({
                id: s.id || s.name,
                name: s.name,
                role: s.role || s.specialty,
                state: 'PLANNED',
                progress: 0,
                currentAction: 'Queued for execution',
                intermediateData: {},
                completedSteps: [],
                lastUpdated: new Date().toISOString()
            }))
        };
        this.missionCheckpoints.set(missionId, journal);
        return journal;
    }

    /**
     * Record step progress and emit live event to connected student streams
     */
    recordProgress(missionId, subagentId, update = {}) {
        const journal = this.missionCheckpoints.get(missionId);
        if (!journal) return null;

        const sub = journal.subagents.find(s => s.id === subagentId || s.name === subagentId);
        if (!sub) return null;

        if (update.state) sub.state = update.state;
        if (typeof update.progress === 'number') sub.progress = update.progress;
        if (update.action) sub.currentAction = update.action;
        if (update.stepLog) sub.completedSteps.push(update.stepLog);
        if (update.intermediateData) {
            sub.intermediateData = { ...sub.intermediateData, ...update.intermediateData };
        }
        sub.lastUpdated = new Date().toISOString();

        if (update.state === 'COMPLETED') {
            journal.completedCount = journal.subagents.filter(s => s.state === 'COMPLETED').length;
        }

        const eventPayload = {
            missionId,
            subagentId: sub.id,
            agentName: sub.name,
            state: sub.state,
            progress: sub.progress,
            currentAction: sub.currentAction,
            completedStepsCount: sub.completedSteps.length,
            timestamp: new Date().toISOString()
        };

        this.emit(`progress:${missionId}`, eventPayload);
        return eventPayload;
    }

    /**
     * Auto-resume interrupted mission without student intervention
     */
    autoResumeMission(missionId) {
        const journal = this.missionCheckpoints.get(missionId);
        if (!journal) throw new Error(`Mission ${missionId} not found in checkpoint memory`);

        const resumedSubagents = [];
        journal.subagents.forEach(sub => {
            if (sub.state !== 'COMPLETED') {
                sub.state = 'RESUMING';
                sub.currentAction = `Auto-resuming from step ${sub.completedSteps.length}: ${sub.currentAction}`;
                sub.lastUpdated = new Date().toISOString();
                resumedSubagents.push(sub);

                this.emit(`progress:${missionId}`, {
                    missionId,
                    subagentId: sub.id,
                    agentName: sub.name,
                    state: 'RESUMING',
                    progress: sub.progress,
                    currentAction: sub.currentAction,
                    message: 'Auto-resumed from persistent checkpoint without student intervention',
                    timestamp: new Date().toISOString()
                });
            }
        });

        journal.isBottlenecked = false;
        return {
            missionId,
            resumedCount: resumedSubagents.length,
            resumedSubagents
        };
    }

    /**
     * Get snapshot of active journal
     */
    getJournal(missionId) {
        return this.missionCheckpoints.get(missionId) || null;
    }
}

const agentProgressJournalService = new AgentProgressJournalService();

module.exports = agentProgressJournalService;
