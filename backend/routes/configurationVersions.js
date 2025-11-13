const express = require('express');
const router = express.Router();
const ConfigurationVersionService = require('../services/ConfigurationVersionService');
const { authenticate } = require('../middleware/auth');

// Get current active configuration
router.get('/current', authenticate, async (req, res) => {
  try {
    const currentConfig = await ConfigurationVersionService.getCurrentVersion();
    
    // Convert Mongoose document to plain object
    const configData = currentConfig.toObject ? currentConfig.toObject() : currentConfig;
    
    res.json({
      success: true,
      data: configData
    });
  } catch (error) {
    console.error('Error fetching current configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current configuration',
      error: error.message
    });
  }
});

// Save new configuration version
router.post('/save', authenticate, async (req, res) => {
  try {
    const { configuration, changeDescription } = req.body;
    
    if (!configuration) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    
    const newVersion = await ConfigurationVersionService.saveNewVersion(
      configuration,
      changeDescription,
      req.user?._id
    );
    
    // Convert Mongoose document to plain object
    const versionData = newVersion.toObject ? newVersion.toObject() : newVersion;
    
    res.json({
      success: true,
      message: 'Configuration saved successfully',
      data: versionData
    });
  } catch (error) {
    console.error('Error saving configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving configuration',
      error: error.message
    });
  }
});

// Get configuration by version number
router.get('/version/:versionNumber', authenticate, async (req, res) => {
  try {
    const versionNumber = parseInt(req.params.versionNumber);
    const config = await ConfigurationVersionService.getVersionByNumber(versionNumber);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration version not found'
      });
    }
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching configuration version:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration version',
      error: error.message
    });
  }
});

// Get all configuration versions
router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await ConfigurationVersionService.getVersionHistory(limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching configuration history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration history',
      error: error.message
    });
  }
});

// Get all versions (complete data)
router.get('/all', authenticate, async (req, res) => {
  try {
    const versions = await ConfigurationVersionService.getAllVersions();
    
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error fetching all versions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching all versions',
      error: error.message
    });
  }
});

module.exports = router;
