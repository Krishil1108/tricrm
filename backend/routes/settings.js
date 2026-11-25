const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');

// GET /api/settings - Get company settings (returns existing or creates default)
router.get('/', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching company settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company settings',
      error: error.message
    });
  }
});

// PUT /api/settings - Update company settings
router.put('/', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.user && req.user._id) {
      updateData.updatedBy = req.user._id;
    }
    delete updateData._id;
    delete updateData.__v;

    const settings = await CompanySettings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Company settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating company settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update company settings',
      error: error.message
    });
  }
});

// POST /api/settings/quotation/next - Increment & return next quotation number
router.post('/quotation/next', async (req, res) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    const current = settings.quotationSettings?.currentNumber || 1001;
    const prefix = settings.quotationSettings?.prefix || 'Q';
    const separator = settings.quotationSettings?.separator || '-';
    const suffix = settings.quotationSettings?.suffix || '';

    const nextQuotationNumber = `${prefix}${separator}${current}${suffix ? separator + suffix : ''}`;

    // Atomically increment current number
    if (!settings.quotationSettings) {
      settings.quotationSettings = {};
    }
    settings.quotationSettings.currentNumber = current + 1;
    await settings.save();

    return res.status(200).json({
      success: true,
      data: {
        quotationNumber: nextQuotationNumber,
        nextNumber: settings.quotationSettings.currentNumber
      }
    });
  } catch (error) {
    console.error('Error generating quotation number:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate quotation number',
      error: error.message
    });
  }
});

module.exports = router;
