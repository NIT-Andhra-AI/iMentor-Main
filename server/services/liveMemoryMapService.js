/**
 * server/services/liveMemoryMapService.js
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                 LIVE MEMORY MAP & PROGRESS PERSISTENCE AGENT            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Asynchronously processes student tutor interactions in the background to build
 * and update the student's Live Concept Memory Map, calculate Bloom taxonomy
 * progression, and push real-time updates over WebSockets.
 */

'use strict';

const StudentKnowledgeState = require('../models/StudentKnowledgeState');
const TutorSession = require('../models/TutorSession');
const knowledgeStateService = require('./knowledgeStateService');
const { getSocketIO } = require('./socketService');
const log = require('../utils/logger');

class LiveMemoryMapService {
  /**
   * Process a completed tutor interaction asynchronously in the background.
   * Updates student knowledge state, recalculates graph connections, and emits live socket updates.
   *
   * @param {string} userId
   * @param {string} sessionId
   * @param {Object} turnData
   */
  async updateLiveMemoryMapAsync(userId, sessionId, turnData = {}) {
    if (!userId) return;

    setImmediate(async () => {
      try {
        const {
          topic,
          conceptName,
          pedagogicalMove,
          masteryScore,
          cognitiveLevel,
          understandingLevel,
          userQuery,
          botResponse,
        } = turnData;

        const concept = conceptName || topic || 'General Concept';

        // 1. Update event-based Knowledge State
        const eventType = pedagogicalMove === 'ADVANCE_LEVEL' || pedagogicalMove === 'JUMP_LEVEL'
          ? 'concept_mastered'
          : understandingLevel === 'MISCONCEPTION' || understandingLevel === 'NO_FOUNDATION'
          ? 'student_answer_wrong'
          : 'student_answer_correct';

        await knowledgeStateService.updateKnowledgeFromTutorEvent(userId, sessionId, eventType, {
          conceptName: concept,
          topic: concept,
          masteryScore: masteryScore || 0,
        });

        // 2. Fetch full updated knowledge state
        const knowledgeState = await StudentKnowledgeState.findOne({ userId }).lean();
        if (!knowledgeState) return;

        // 3. Build live memory map structure
        const liveMap = this.buildMemoryMapGraph(knowledgeState);

        // 4. Emit live update over Socket.io
        try {
          const io = getSocketIO();
          if (io) {
            io.to(userId.toString()).emit('memory_map:updated', {
              sessionId,
              concept,
              liveMap,
              timestamp: new Date().toISOString(),
            });
            log.info('LIVE_MEMORY_MAP', `📡 Pushed live memory map update to user ${userId} for concept '${concept}'`);
          }
        } catch (socketErr) {
          log.debug('LIVE_MEMORY_MAP', `Socket emit skipped: ${socketErr.message}`);
        }
      } catch (err) {
        log.error('LIVE_MEMORY_MAP', `Failed to update live memory map in background: ${err.message}`);
      }
    });
  }

  /**
   * Build node-link graph format suitable for visual memory maps.
   */
  buildMemoryMapGraph(knowledgeState) {
    const concepts = knowledgeState.concepts || [];

    const nodes = concepts.map((c) => ({
      id: c.conceptName,
      label: c.conceptName,
      mastery: Math.round((c.masteryScoreNormalized || 0) * 100),
      understandingLevel: c.understandingLevel || 'learning',
      interactions: c.totalInteractions || 0,
      lastInteraction: c.lastInteractionDate,
    }));

    // Build connections between concepts
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        // Link concepts if both have interactions
        if (nodes[i].interactions > 0 && nodes[j].interactions > 0) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            strength: Math.min(nodes[i].mastery, nodes[j].mastery) / 100,
          });
        }
      }
    }

    return {
      nodes,
      links,
      summary: {
        totalConcepts: nodes.length,
        masteredConcepts: nodes.filter((n) => n.mastery >= 80).length,
        strugglingConcepts: nodes.filter((n) => n.mastery < 40 && n.interactions > 0).length,
        overallMastery: nodes.length > 0
          ? Math.round(nodes.reduce((sum, n) => sum + n.mastery, 0) / nodes.length)
          : 0,
      },
    };
  }
}

const liveMemoryMapService = new LiveMemoryMapService();
module.exports = liveMemoryMapService;
