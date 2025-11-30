const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { authenticate, isAdmin } = require('../middleware/auth');
const Client = require('../models/Client');
const Associate = require('../models/Associate');
const Activity = require('../models/Activity');
const FinanceProject = require('../models/FinanceProject');
const Meeting = require('../models/Meeting');
const Note = require('../models/Note');
const BankExpense = require('../models/BankExpense');
const User = require('../models/User');
const Role = require('../models/Role');
const ConfigurationVersion = require('../models/ConfigurationVersion');
const StockTransaction = require('../models/StockTransaction');
const PasswordResetToken = require('../models/PasswordResetToken');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, Excel, and ZIP files are allowed.'));
    }
  }
});

// Helper function to safely export data
const safeExportData = async (model, modelName, options = {}) => {
  try {
    let query = model.find();
    
    // Apply sorting if specified
    if (options.sort) {
      query = query.sort(options.sort);
    }
    
    // Apply population if specified
    if (options.populate) {
      query = query.populate(options.populate);
    }
    
    const data = await query.exec();
    
    // Transform data to remove sensitive fields and populate references
    const transformedData = data.map(doc => {
      const obj = doc.toObject();
      
      // Remove sensitive fields
      delete obj.__v;
      if (modelName === 'User') {
        delete obj.password;
        delete obj.refreshTokens;
      }
      if (modelName === 'PasswordResetToken') {
        delete obj.token;
      }
      
      return obj;
    });
    
    return transformedData;
  } catch (error) {
    console.error(`Error exporting ${modelName}:`, error);
    throw error;
  }
};

// Helper function to safely import data
const safeImportData = async (model, modelName, data, options = {}) => {
  const results = {
    successful: [],
    errors: [],
    updated: [],
    created: []
  };

  for (let i = 0; i < data.length; i++) {
    try {
      const item = data[i];
      
      // Skip invalid items
      if (!item || typeof item !== 'object') {
        results.errors.push({
          index: i,
          error: 'Invalid data format',
          data: item
        });
        continue;
      }

      // Remove fields that should not be imported
      delete item.__v;
      if (modelName === 'User') {
        delete item.refreshTokens;
        // Don't import passwords for security
        if (!item.password) {
          item.password = 'TempPassword123!'; // Temporary password, user should reset
        }
      }

      // Set import metadata
      item.importedAt = new Date();
      
      let existingItem = null;
      let isUpdate = false;

      // Check if item exists (based on unique identifiers)
      if (modelName === 'Client' && item.email) {
        existingItem = await model.findOne({ email: item.email });
      } else if (modelName === 'Associate' && item.email) {
        existingItem = await model.findOne({ email: item.email });
      } else if (modelName === 'FinanceProject' && item.projectNumber) {
        existingItem = await model.findOne({ projectNumber: item.projectNumber });
      } else if (modelName === 'User' && item.email) {
        existingItem = await model.findOne({ email: item.email });
      } else if (item._id) {
        existingItem = await model.findById(item._id);
      }

      let savedItem;
      if (existingItem && options.updateExisting !== false) {
        // Update existing item
        Object.assign(existingItem, item);
        savedItem = await existingItem.save();
        results.updated.push(savedItem);
        isUpdate = true;
      } else if (!existingItem) {
        // Create new item
        const newItem = new model(item);
        savedItem = await newItem.save();
        results.created.push(savedItem);
      } else {
        // Item exists but update not allowed
        results.errors.push({
          index: i,
          error: 'Item already exists and updates are disabled',
          data: item
        });
        continue;
      }

      results.successful.push(savedItem);

      // Create activity log for important entities
      if (['Client', 'Associate', 'FinanceProject'].includes(modelName)) {
        try {
          await Activity.createActivity(
            isUpdate ? `${modelName.toLowerCase()}_updated` : `${modelName.toLowerCase()}_added`,
            savedItem._id,
            modelName,
            savedItem.name || savedItem.projectName || savedItem.email,
            `${modelName} ${isUpdate ? 'updated' : 'imported'} via data import`,
            { importedAt: new Date() }
          );
        } catch (activityError) {
          console.error('Error creating activity:', activityError);
        }
      }

    } catch (error) {
      results.errors.push({
        index: i,
        error: error.message,
        data: data[i]
      });
    }
  }

  return results;
};

// Export all CRM data
router.get('/export/all', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('Starting full data export...');
    
    const exportData = {
      metadata: {
        exportDate: new Date(),
        exportedBy: req.user.email,
        version: '1.0',
        description: 'Complete CRM data export'
      },
      data: {}
    };

    // Export all data models
    const models = [
      { model: Client, name: 'clients', options: { sort: { name: 1 } } },
      { model: Associate, name: 'associates', options: { sort: { name: 1 } } },
      { model: FinanceProject, name: 'financeProjects', options: { sort: { srNo: 1 }, populate: 'clientId projectAssociates.associateId' } },
      { model: Activity, name: 'activities', options: { sort: { timestamp: -1 } } },
      { model: Meeting, name: 'meetings', options: { sort: { date: -1 } } },
      { model: Note, name: 'notes', options: { sort: { createdAt: -1 } } },
      { model: BankExpense, name: 'bankExpenses', options: { sort: { date: -1 } } },
      { model: User, name: 'users', options: { sort: { email: 1 } } },
      { model: Role, name: 'roles', options: { sort: { name: 1 } } },
      { model: ConfigurationVersion, name: 'configurationVersions', options: { sort: { version: 1 } } },
      { model: StockTransaction, name: 'stockTransactions', options: { sort: { createdAt: -1 } } }
    ];

    for (const { model, name, options } of models) {
      try {
        console.log(`Exporting ${name}...`);
        exportData.data[name] = await safeExportData(model, name, options);
        console.log(`Exported ${exportData.data[name].length} ${name}`);
      } catch (error) {
        console.error(`Error exporting ${name}:`, error);
        exportData.data[name] = [];
        exportData.metadata.errors = exportData.metadata.errors || [];
        exportData.metadata.errors.push(`Failed to export ${name}: ${error.message}`);
      }
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="crm_data_export_${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(exportData);
    
  } catch (error) {
    console.error('Error in full data export:', error);
    res.status(500).json({ 
      message: 'Export failed', 
      error: error.message 
    });
  }
});

// Export data as Excel workbook
router.get('/export/excel', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('Starting Excel export...');
    
    const workbook = XLSX.utils.book_new();

    // Export each model as a separate worksheet
    const models = [
      { model: Client, name: 'Clients' },
      { model: Associate, name: 'Associates' },
      { model: FinanceProject, name: 'Finance Projects' },
      { model: Meeting, name: 'Meetings' },
      { model: Note, name: 'Notes' },
      { model: BankExpense, name: 'Bank Expenses' },
      { model: Activity, name: 'Activities' }
    ];

    for (const { model, name } of models) {
      try {
        const data = await safeExportData(model, name);
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      } catch (error) {
        console.error(`Error adding ${name} to Excel:`, error);
        // Add error sheet
        const errorSheet = XLSX.utils.json_to_sheet([{ error: `Failed to export ${name}: ${error.message}` }]);
        XLSX.utils.book_append_sheet(workbook, errorSheet, `${name}_Error`);
      }
    }

    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="crm_data_export_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    res.send(buffer);
    
  } catch (error) {
    console.error('Error in Excel export:', error);
    res.status(500).json({ 
      message: 'Excel export failed', 
      error: error.message 
    });
  }
});

// Import all CRM data
router.post('/import/all', authenticate, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let importData;
    
    // Parse different file types
    if (req.file.mimetype === 'application/json') {
      importData = JSON.parse(req.file.buffer.toString());
    } else {
      return res.status(400).json({ message: 'Only JSON files are supported for full import' });
    }

    // Validate import data structure
    if (!importData.data || typeof importData.data !== 'object') {
      return res.status(400).json({ message: 'Invalid import file format' });
    }

    const importResults = {
      metadata: {
        importDate: new Date(),
        importedBy: req.user.email,
        sourceFile: req.file.originalname
      },
      results: {}
    };

    // Import data models in correct order (to handle dependencies)
    const importOrder = [
      { model: Role, name: 'roles', dataKey: 'roles' },
      { model: User, name: 'users', dataKey: 'users' },
      { model: Client, name: 'clients', dataKey: 'clients' },
      { model: Associate, name: 'associates', dataKey: 'associates' },
      { model: ConfigurationVersion, name: 'configurationVersions', dataKey: 'configurationVersions' },
      { model: FinanceProject, name: 'financeProjects', dataKey: 'financeProjects' },
      { model: Meeting, name: 'meetings', dataKey: 'meetings' },
      { model: Note, name: 'notes', dataKey: 'notes' },
      { model: BankExpense, name: 'bankExpenses', dataKey: 'bankExpenses' },
      { model: StockTransaction, name: 'stockTransactions', dataKey: 'stockTransactions' },
      { model: Activity, name: 'activities', dataKey: 'activities' }
    ];

    for (const { model, name, dataKey } of importOrder) {
      try {
        const data = importData.data[dataKey] || [];
        
        if (data.length > 0) {
          console.log(`Importing ${data.length} ${name}...`);
          const result = await safeImportData(model, name, data, {
            updateExisting: req.body.updateExisting !== 'false'
          });
          importResults.results[name] = result;
          console.log(`Imported ${name}: ${result.successful.length} successful, ${result.errors.length} errors`);
        } else {
          importResults.results[name] = { 
            successful: [], 
            errors: [], 
            message: 'No data to import' 
          };
        }
        
      } catch (error) {
        console.error(`Error importing ${name}:`, error);
        importResults.results[name] = {
          successful: [],
          errors: [{ error: error.message }],
          message: `Import failed: ${error.message}`
        };
      }
    }

    // Calculate totals
    const totals = Object.values(importResults.results).reduce((acc, result) => {
      acc.successful += result.successful ? result.successful.length : 0;
      acc.errors += result.errors ? result.errors.length : 0;
      acc.created += result.created ? result.created.length : 0;
      acc.updated += result.updated ? result.updated.length : 0;
      return acc;
    }, { successful: 0, errors: 0, created: 0, updated: 0 });

    importResults.summary = totals;

    res.json({
      message: `Import completed. ${totals.successful} items processed successfully, ${totals.errors} errors occurred.`,
      results: importResults
    });

  } catch (error) {
    console.error('Error in full data import:', error);
    res.status(500).json({ 
      message: 'Import failed', 
      error: error.message 
    });
  }
});

// Create backup
router.post('/backup/create', authenticate, isAdmin, async (req, res) => {
  try {
    console.log('Creating backup...');
    
    const backupData = {
      metadata: {
        backupDate: new Date(),
        createdBy: req.user.email,
        version: '1.0',
        type: 'full_backup',
        description: 'Complete CRM database backup'
      },
      data: {}
    };

    // Export all data for backup
    const models = [
      { model: Client, name: 'clients', options: { sort: { name: 1 } } },
      { model: Associate, name: 'associates', options: { sort: { name: 1 } } },
      { model: FinanceProject, name: 'financeProjects', options: { sort: { srNo: 1 } } },
      { model: Activity, name: 'activities', options: { sort: { timestamp: -1 } } },
      { model: Meeting, name: 'meetings', options: { sort: { date: -1 } } },
      { model: Note, name: 'notes', options: { sort: { createdAt: -1 } } },
      { model: BankExpense, name: 'bankExpenses', options: { sort: { date: -1 } } },
      { model: User, name: 'users', options: { sort: { email: 1 } } },
      { model: Role, name: 'roles', options: { sort: { name: 1 } } },
      { model: ConfigurationVersion, name: 'configurationVersions', options: { sort: { version: 1 } } },
      { model: StockTransaction, name: 'stockTransactions', options: { sort: { createdAt: -1 } } }
    ];

    for (const { model, name, options } of models) {
      try {
        backupData.data[name] = await safeExportData(model, name, options);
      } catch (error) {
        console.error(`Error backing up ${name}:`, error);
        backupData.data[name] = [];
        backupData.metadata.errors = backupData.metadata.errors || [];
        backupData.metadata.errors.push(`Failed to backup ${name}: ${error.message}`);
      }
    }

    // Calculate statistics
    const stats = Object.entries(backupData.data).reduce((acc, [key, data]) => {
      acc[key] = Array.isArray(data) ? data.length : 0;
      acc.total += acc[key];
      return acc;
    }, { total: 0 });

    backupData.metadata.statistics = stats;

    // Set response headers for download
    const filename = `crm_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.json(backupData);
    
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ 
      message: 'Backup creation failed', 
      error: error.message 
    });
  }
});

// Restore from backup
router.post('/backup/restore', authenticate, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No backup file uploaded' });
    }

    let backupData;
    
    // Parse backup file
    if (req.file.mimetype === 'application/json') {
      backupData = JSON.parse(req.file.buffer.toString());
    } else {
      return res.status(400).json({ message: 'Only JSON backup files are supported' });
    }

    // Validate backup file structure
    if (!backupData.data || !backupData.metadata || backupData.metadata.type !== 'full_backup') {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    // Warning: This will replace existing data
    if (req.body.confirmReplace !== 'true') {
      return res.status(400).json({ 
        message: 'Backup restore requires confirmation. Set confirmReplace=true to proceed.',
        warning: 'This operation will replace existing data!'
      });
    }

    const restoreResults = {
      metadata: {
        restoreDate: new Date(),
        restoredBy: req.user.email,
        sourceBackup: backupData.metadata,
        sourceFile: req.file.originalname
      },
      results: {}
    };

    // Restore data models in correct order
    const restoreOrder = [
      { model: Role, name: 'roles', dataKey: 'roles' },
      { model: User, name: 'users', dataKey: 'users' },
      { model: Client, name: 'clients', dataKey: 'clients' },
      { model: Associate, name: 'associates', dataKey: 'associates' },
      { model: ConfigurationVersion, name: 'configurationVersions', dataKey: 'configurationVersions' },
      { model: FinanceProject, name: 'financeProjects', dataKey: 'financeProjects' },
      { model: Meeting, name: 'meetings', dataKey: 'meetings' },
      { model: Note, name: 'notes', dataKey: 'notes' },
      { model: BankExpense, name: 'bankExpenses', dataKey: 'bankExpenses' },
      { model: StockTransaction, name: 'stockTransactions', dataKey: 'stockTransactions' },
      { model: Activity, name: 'activities', dataKey: 'activities' }
    ];

    for (const { model, name, dataKey } of restoreOrder) {
      try {
        const data = backupData.data[dataKey] || [];
        
        if (data.length > 0) {
          console.log(`Restoring ${data.length} ${name}...`);
          
          // Clear existing data if specified
          if (req.body.clearExisting === 'true') {
            await model.deleteMany({});
          }
          
          const result = await safeImportData(model, name, data, {
            updateExisting: true
          });
          restoreResults.results[name] = result;
          console.log(`Restored ${name}: ${result.successful.length} successful, ${result.errors.length} errors`);
        } else {
          restoreResults.results[name] = { 
            successful: [], 
            errors: [], 
            message: 'No data to restore' 
          };
        }
        
      } catch (error) {
        console.error(`Error restoring ${name}:`, error);
        restoreResults.results[name] = {
          successful: [],
          errors: [{ error: error.message }],
          message: `Restore failed: ${error.message}`
        };
      }
    }

    // Calculate totals
    const totals = Object.values(restoreResults.results).reduce((acc, result) => {
      acc.successful += result.successful ? result.successful.length : 0;
      acc.errors += result.errors ? result.errors.length : 0;
      acc.created += result.created ? result.created.length : 0;
      acc.updated += result.updated ? result.updated.length : 0;
      return acc;
    }, { successful: 0, errors: 0, created: 0, updated: 0 });

    restoreResults.summary = totals;

    res.json({
      message: `Backup restored. ${totals.successful} items processed successfully, ${totals.errors} errors occurred.`,
      results: restoreResults
    });

  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ 
      message: 'Backup restore failed', 
      error: error.message 
    });
  }
});

// Clean old activities (older than specified days)
router.delete('/cleanup/activities', authenticate, isAdmin, async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 365; // Default to 1 year
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Activity.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    res.json({
      message: `Cleaned up old activities (older than ${daysOld} days)`,
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate
    });

  } catch (error) {
    console.error('Error cleaning up activities:', error);
    res.status(500).json({ 
      message: 'Cleanup failed', 
      error: error.message 
    });
  }
});

// Generate analytics report
router.get('/analytics/report', authenticate, isAdmin, async (req, res) => {
  try {
    const report = {
      generatedAt: new Date(),
      generatedBy: req.user.email,
      summary: {},
      details: {}
    };

    // Get counts for all major entities
    const [
      clientsCount,
      associatesCount,
      financeProjectsCount,
      activitiesCount,
      meetingsCount,
      notesCount,
      usersCount
    ] = await Promise.all([
      Client.countDocuments(),
      Associate.countDocuments(),
      FinanceProject.countDocuments(),
      Activity.countDocuments(),
      Meeting.countDocuments(),
      Note.countDocuments(),
      User.countDocuments()
    ]);

    report.summary = {
      clients: clientsCount,
      associates: associatesCount,
      financeProjects: financeProjectsCount,
      activities: activitiesCount,
      meetings: meetingsCount,
      notes: notesCount,
      users: usersCount
    };

    // Get detailed analytics
    const [
      clientsByStatus,
      associatesByStatus,
      projectsByStatus,
      recentActivities,
      financialSummary
    ] = await Promise.all([
      Client.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Associate.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      FinanceProject.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Activity.find().sort({ timestamp: -1 }).limit(10),
      FinanceProject.aggregate([
        {
          $group: {
            _id: null,
            totalFinalized: { $sum: '$finalizedFees' },
            totalReceived: { $sum: '$totalReceivedFees' },
            totalProfit: { $sum: '$profitMargin' },
            avgProject: { $avg: '$finalizedFees' }
          }
        }
      ])
    ]);

    report.details = {
      clientsByStatus: clientsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      associatesByStatus: associatesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      projectsByStatus: projectsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivities: recentActivities,
      financialSummary: financialSummary[0] || {
        totalFinalized: 0,
        totalReceived: 0,
        totalProfit: 0,
        avgProject: 0
      }
    };

    res.json(report);

  } catch (error) {
    console.error('Error generating analytics report:', error);
    res.status(500).json({ 
      message: 'Report generation failed', 
      error: error.message 
    });
  }
});

module.exports = router;