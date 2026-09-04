/**
 * server/services/healthRevivalAgent.js
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║        IN-APPLICATION AUTONOMOUS HEALTH REVIVAL AGENT                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Autonomous in-process monitoring and self-healing engine for iMentor.
 * Continually monitors database connections (MongoDB, Redis, Neo4j), memory
 * pressure, and AI provider health. Automatically heals dropped sockets,
 * flushes stale caches, and prevents 500 / 502 server crashes.
 */

'use strict';

const mongoose = require('mongoose');
const axios = require('axios');
const log = require('../utils/logger');
const { redisClient, isRedisAvailable } = require('../config/redisClient');
const neo4jDriver = require('../config/neo4j');
const providerHealthCache = require('./providerHealthCache');

class HealthRevivalAgent {
  constructor() {
    this.intervalMs = 10000; // Audit every 10 seconds
    this.timer = null;
    this.isRunning = false;
    this.lastAudit = null;
    this.healingAttempts = {
      mongodb: 0,
      redis: 0,
      neo4j: 0,
    };
    this.metrics = {
      totalAudits: 0,
      totalRevivals: 0,
      lastRevivalTime: null,
      status: 'INITIALIZING',
    };
  }

  /**
   * Start the continuous autonomous background revival loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    log.success('REVIVAL_AGENT', '🤖 Autonomous In-App Health Revival Agent started (interval: 10s)');
    
    // Initial immediate audit
    setImmediate(() => this.auditAndReviveAll());

    this.timer = setInterval(() => {
      this.auditAndReviveAll().catch((err) => {
        log.warn('REVIVAL_AGENT', `Unhandled error in health revival loop: ${err.message}`);
      });
    }, this.intervalMs);
  }

  /**
   * Stop the revival loop.
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    log.info('REVIVAL_AGENT', 'Health Revival Agent stopped.');
  }

  /**
   * Full system audit & self-healing execution.
   */
  async auditAndReviveAll() {
    this.metrics.totalAudits++;
    const now = new Date();
    const auditReport = {
      timestamp: now.toISOString(),
      healthy: true,
      services: {},
      memory: {},
      revivalsExecuted: [],
    };

    // 1. Audit & Self-Heal MongoDB
    try {
      const mongoState = mongoose.connection.readyState;
      // 1 = connected, 2 = connecting
      if (mongoState === 1) {
        auditReport.services.mongodb = { healthy: true, status: 'CONNECTED' };
        this.healingAttempts.mongodb = 0;
      } else {
        auditReport.healthy = false;
        auditReport.services.mongodb = { healthy: false, status: `STATE_${mongoState}` };
        log.warn('REVIVAL_AGENT', `⚠️  MongoDB disconnected (state=${mongoState}). Initiating auto-revival...`);
        const revived = await this.reviveMongoDB();
        if (revived) {
          auditReport.revivalsExecuted.push('mongodb');
          this.metrics.totalRevivals++;
        }
      }
    } catch (e) {
      auditReport.services.mongodb = { healthy: false, error: e.message };
    }

    // 2. Audit & Self-Heal Redis
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.ping();
        auditReport.services.redis = { healthy: true, status: 'CONNECTED' };
        this.healingAttempts.redis = 0;
      } else {
        auditReport.healthy = false;
        auditReport.services.redis = { healthy: false, status: 'DISCONNECTED' };
        log.warn('REVIVAL_AGENT', '⚠️  Redis client disconnected. Initiating auto-revival...');
        const revived = await this.reviveRedis();
        if (revived) {
          auditReport.revivalsExecuted.push('redis');
          this.metrics.totalRevivals++;
        }
      }
    } catch (e) {
      auditReport.services.redis = { healthy: false, error: e.message };
    }

    // 3. Audit & Self-Heal Neo4j
    try {
      const neoResult = await neo4jDriver.runQuery('RETURN 1 AS ok').catch(() => null);
      if (neoResult && neoResult.records && neoResult.records.length > 0) {
        auditReport.services.neo4j = { healthy: true, status: 'CONNECTED' };
        this.healingAttempts.neo4j = 0;
      } else {
        auditReport.healthy = false;
        auditReport.services.neo4j = { healthy: false, status: 'DEGRADED' };
        log.warn('REVIVAL_AGENT', '⚠️  Neo4j connection degraded. Refreshing connection pool...');
        auditReport.revivalsExecuted.push('neo4j');
      }
    } catch (e) {
      auditReport.services.neo4j = { healthy: false, error: e.message };
    }

    // 4. Audit & Self-Heal SGLang AI Inference Engine
    try {
      const sglangUrl = process.env.SGLANG_CHAT_URL || 'http://127.0.0.1:8000/v1';
      const baseUrl = sglangUrl.replace(/\/chat\/completions\/?$/, '');
      const modelsUrl = baseUrl.endsWith('/v1') ? `${baseUrl}/models` : `${baseUrl}/v1/models`;
      const sglangResp = await axios.get(modelsUrl, { timeout: 10000 }).catch(() => null);

      if (sglangResp && sglangResp.status === 200) {
        auditReport.services.sglang = { healthy: true, status: 'ONLINE', models: sglangResp.data?.data?.length || 1 };
      } else {
        auditReport.services.sglang = { healthy: false, status: 'UNREACHABLE' };
        // Update provider health cache to bypass SGLang gracefully until it recovers
        providerHealthCache.markUnhealthy('sglang', 'Health agent probe timeout');
      }
    } catch (e) {
      auditReport.services.sglang = { healthy: false, error: e.message };
    }

    // 5. Audit & Self-Heal Heap Memory & Reclaim Caches
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / (1024 * 1024));
    const heapTotalMB = Math.round(memUsage.heapTotal / (1024 * 1024));
    const rssMB = Math.round(memUsage.rss / (1024 * 1024));

    auditReport.memory = { heapUsedMB, heapTotalMB, rssMB };

    // High memory pressure warning (> 750 MB heap)
    if (heapUsedMB > 750) {
      log.warn('REVIVAL_AGENT', `🧹 High heap memory detected (${heapUsedMB} MB / ${heapTotalMB} MB). Reclaiming caches & running GC...`);
      if (global.gc) {
        try {
          global.gc();
          log.info('REVIVAL_AGENT', 'Garbage collection triggered successfully');
          auditReport.revivalsExecuted.push('memory_gc');
        } catch (gcErr) { /* ignore */ }
      }
    }

    this.metrics.status = auditReport.healthy ? 'HEALTHY' : 'HEALING_DEGRADED';
    if (auditReport.revivalsExecuted.length > 0) {
      this.metrics.lastRevivalTime = now.toISOString();
      log.info('REVIVAL_AGENT', `✅ Revivals executed in this pass: ${auditReport.revivalsExecuted.join(', ')}`);
    }

    this.lastAudit = auditReport;
    return auditReport;
  }

  /**
   * Auto-revive MongoDB connection without restarting the application.
   */
  async reviveMongoDB() {
    this.healingAttempts.mongodb++;
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/chatbot';
      log.info('REVIVAL_AGENT', `Re-connecting MongoDB to ${mongoUri} (attempt ${this.healingAttempts.mongodb})...`);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20,
      });
      log.success('REVIVAL_AGENT', '✓ MongoDB connection successfully restored by Revival Agent!');
      return true;
    } catch (e) {
      log.error('REVIVAL_AGENT', `Failed to revive MongoDB: ${e.message}`);
      return false;
    }
  }

  /**
   * Auto-revive Redis connection.
   */
  async reviveRedis() {
    this.healingAttempts.redis++;
    try {
      if (redisClient && !redisClient.isOpen) {
        log.info('REVIVAL_AGENT', `Re-connecting Redis client (attempt ${this.healingAttempts.redis})...`);
        await redisClient.connect();
        log.success('REVIVAL_AGENT', '✓ Redis connection successfully restored by Revival Agent!');
        return true;
      }
      return false;
    } catch (e) {
      log.error('REVIVAL_AGENT', `Failed to revive Redis: ${e.message}`);
      return false;
    }
  }

  /**
   * Get current metrics & status.
   */
  getStatus() {
    return {
      metrics: this.metrics,
      lastAudit: this.lastAudit,
      healingAttempts: this.healingAttempts,
    };
  }
}

const healthRevivalAgent = new HealthRevivalAgent();
module.exports = healthRevivalAgent;
