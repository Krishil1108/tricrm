const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const FinanceProject = require('../models/FinanceProject');
const Associate = require('../models/Associate');
const Note = require('../models/Note');

// GET /api/search?q=... - Unified global search across CRM entities
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.json({
        success: true,
        data: { clients: [], projects: [], associates: [], notes: [] }
      });
    }

    const regex = { $regex: q, $options: 'i' };

    const [clients, projects, associates, notes] = await Promise.all([
      Client.find({ $or: [{ name: regex }, { company: regex }, { email: regex }] })
        .select('name company email phone')
        .limit(5)
        .lean(),
      FinanceProject.find({ $or: [{ projectName: regex }, { projectNumber: regex }] })
        .select('projectName projectNumber status')
        .limit(5)
        .lean(),
      Associate.find({ $or: [{ name: regex }, { company: regex }, { email: regex }] })
        .select('name company email')
        .limit(5)
        .lean(),
      Note.find({ $or: [{ title: regex }, { content: regex }] })
        .select('title category priority')
        .limit(5)
        .lean()
    ]);

    return res.json({
      success: true,
      data: { clients, projects, associates, notes }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

module.exports = router;
