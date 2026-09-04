/**
 * server/routes/healthRoutes.js
 *
 * Dedicated Health & Revival API endpoints for iMentor platform.
 */

const express = require('express');
const router = express.Router();
const healthRevivalAgent = require('../services/healthRevivalAgent');

// Public lightweight health probe
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Detailed Health Revival Agent Status
router.get('/revival-status', (req, res) => {
  res.json(healthRevivalAgent.getStatus());
});

// Trigger immediate manual revival audit
router.post('/revive', async (req, res) => {
  try {
    const report = await healthRevivalAgent.auditAndReviveAll();
    res.json({
      message: 'Autonomous Health Revival Audit executed successfully.',
      report,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Revival audit failed',
      error: error.message,
    });
  }
});

module.exports = router;
