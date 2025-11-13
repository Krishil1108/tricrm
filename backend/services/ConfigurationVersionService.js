const ConfigurationVersion = require('../models/ConfigurationVersion');

class ConfigurationVersionService {
  // Get current active configuration version
  static async getCurrentVersion() {
    try {
      const currentConfig = await ConfigurationVersion.findOne({ 
        appliedTo: null 
      }).sort({ version: -1 });
      
      if (!currentConfig) {
        // Create initial version if none exists
        return await this.createInitialVersion();
      }
      
      return currentConfig;
    } catch (error) {
      console.error('Error getting current configuration version:', error);
      throw error;
    }
  }

  // Create initial configuration version
  static async createInitialVersion() {
    try {
      const initialConfig = new ConfigurationVersion({
        version: 1,
        configuration: {
          profitMarginPercent: 0,
          drawingPercent: 0,
          documentsPercent: 0,
          siteVisitPercent: 0,
          marketingAndMiscPercent: 0,
          officeManagementPercent: 0,
          fieldVisibility: {
            profitMargin: false,
            drawing: false,
            documents: false,
            siteVisit: false,
            marketingAndMisc: false,
            officeManagement: false
          },
          includeAssociates: false,
          numberOfAssociates: 1,
          associates: [],
          customFields: []
        },
        appliedFrom: new Date(),
        appliedTo: null,
        changeDescription: 'Initial configuration'
      });
      
      await initialConfig.save();
      return initialConfig;
    } catch (error) {
      console.error('Error creating initial configuration version:', error);
      throw error;
    }
  }

  // Save new configuration version
  static async saveNewVersion(configuration, changeDescription = '', userId = null) {
    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion();
      
      // Check if configuration has actually changed
      const hasChanged = this.hasConfigurationChanged(
        currentVersion.configuration, 
        configuration
      );
      
      if (!hasChanged) {
        console.log('Configuration unchanged, not creating new version');
        return currentVersion;
      }
      
      // Close the current version
      currentVersion.appliedTo = new Date();
      await currentVersion.save();
      
      // Create new version
      const newVersion = new ConfigurationVersion({
        version: currentVersion.version + 1,
        configuration: configuration,
        appliedFrom: new Date(),
        appliedTo: null,
        changeDescription: changeDescription || this.generateChangeDescription(
          currentVersion.configuration, 
          configuration
        ),
        createdBy: userId
      });
      
      await newVersion.save();
      console.log(`Created new configuration version: ${newVersion.version}`);
      return newVersion;
    } catch (error) {
      console.error('Error saving new configuration version:', error);
      throw error;
    }
  }

  // Check if configuration has changed
  static hasConfigurationChanged(oldConfig, newConfig) {
    const oldJson = JSON.stringify(this.normalizeConfig(oldConfig));
    const newJson = JSON.stringify(this.normalizeConfig(newConfig));
    return oldJson !== newJson;
  }

  // Normalize configuration for comparison (remove timestamps, etc.)
  static normalizeConfig(config) {
    const normalized = { ...config };
    delete normalized._id;
    delete normalized.__v;
    delete normalized.createdAt;
    delete normalized.updatedAt;
    return normalized;
  }

  // Generate automatic change description
  static generateChangeDescription(oldConfig, newConfig) {
    const changes = [];
    
    // Check default field changes
    const defaultFields = [
      'profitMarginPercent', 'drawingPercent', 'documentsPercent',
      'siteVisitPercent', 'marketingAndMiscPercent', 'officeManagementPercent'
    ];
    
    defaultFields.forEach(field => {
      if (oldConfig[field] !== newConfig[field]) {
        changes.push(`${field}: ${oldConfig[field]}% → ${newConfig[field]}%`);
      }
    });
    
    // Check visibility changes
    if (oldConfig.fieldVisibility && newConfig.fieldVisibility) {
      Object.keys(newConfig.fieldVisibility).forEach(field => {
        if (oldConfig.fieldVisibility[field] !== newConfig.fieldVisibility[field]) {
          changes.push(`${field} visibility: ${newConfig.fieldVisibility[field] ? 'shown' : 'hidden'}`);
        }
      });
    }
    
    // Check custom fields changes
    const oldCustomFields = oldConfig.customFields || [];
    const newCustomFields = newConfig.customFields || [];
    
    if (oldCustomFields.length !== newCustomFields.length) {
      changes.push(`Custom fields: ${oldCustomFields.length} → ${newCustomFields.length}`);
    } else {
      newCustomFields.forEach((newField, index) => {
        const oldField = oldCustomFields[index];
        if (oldField && (oldField.name !== newField.name || oldField.percentage !== newField.percentage)) {
          changes.push(`Custom field "${newField.name}" modified`);
        }
      });
    }
    
    // Check associates changes
    if (oldConfig.includeAssociates !== newConfig.includeAssociates) {
      changes.push(`Associates: ${newConfig.includeAssociates ? 'enabled' : 'disabled'}`);
    }
    
    return changes.length > 0 ? changes.join('; ') : 'Configuration updated';
  }

  // Get configuration by version number
  static async getVersionByNumber(versionNumber) {
    try {
      return await ConfigurationVersion.findOne({ version: versionNumber });
    } catch (error) {
      console.error('Error getting configuration by version:', error);
      throw error;
    }
  }

  // Get configuration that was active at a specific date
  static async getVersionAtDate(date) {
    try {
      return await ConfigurationVersion.findOne({
        appliedFrom: { $lte: date },
        $or: [
          { appliedTo: { $gt: date } },
          { appliedTo: null }
        ]
      }).sort({ version: -1 });
    } catch (error) {
      console.error('Error getting configuration at date:', error);
      throw error;
    }
  }

  // Get all configuration versions (for history)
  static async getAllVersions() {
    try {
      return await ConfigurationVersion.find()
        .sort({ version: -1 })
        .populate('createdBy', 'name email');
    } catch (error) {
      console.error('Error getting all configuration versions:', error);
      throw error;
    }
  }

  // Get configuration history with change tracking
  static async getVersionHistory(limit = 10) {
    try {
      return await ConfigurationVersion.find()
        .sort({ version: -1 })
        .limit(limit)
        .select('version appliedFrom appliedTo changeDescription createdBy')
        .populate('createdBy', 'name email');
    } catch (error) {
      console.error('Error getting version history:', error);
      throw error;
    }
  }
}

module.exports = ConfigurationVersionService;
