/**
 * placementRoutes.js
 * Endpoints for Placement Intelligence, Hiring Rounds, OA Patterns, and Solved Questions
 */

const express = require('express');
const router = express.Router();
const placementService = require('../services/placementIntelligenceService');

// GET /api/placements/stats - Overall stats
router.get('/stats', (req, res) => {
  try {
    const stats = placementService.getPlacementStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve placement stats.", error: error.message });
  }
});

// GET /api/placements/nitap-eee - NIT Andhra Pradesh EEE specific internship & job opportunities
router.get('/nitap-eee', (req, res) => {
  try {
    const data = placementService.getNitApEeeOpportunities();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch NIT AP EEE opportunities.", error: error.message });
  }
});

// GET /api/placements/companies - List of companies filtered by sector & search
router.get('/companies', (req, res) => {
  try {
    const { sector, search } = req.query;
    const companies = placementService.getCompanies(sector, search);
    res.json({
      success: true,
      count: companies.length,
      companies
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch companies.", error: error.message });
  }
});

// GET /api/placements/companies/:companyId - Full detailed profile
router.get('/companies/:companyId', (req, res) => {
  try {
    const { companyId } = req.params;
    const details = placementService.getCompanyDetails(companyId);
    if (!details) {
      return res.status(404).json({ message: `Company with ID '${companyId}' not found.` });
    }
    res.json({
      success: true,
      company: details
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch company details.", error: error.message });
  }
});

// POST /api/placements/ask-copilot - Antigravity Placement Copilot
router.post('/ask-copilot', async (req, res) => {
  try {
    const { query, companyId, topic } = req.body;
    if (!query) {
      return res.status(400).json({ message: "Missing query prompt." });
    }
    const response = await placementService.askPlacementCopilot(query, companyId, topic);
    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    res.status(500).json({ message: "Copilot request failed.", error: error.message });
  }
});

module.exports = router;
