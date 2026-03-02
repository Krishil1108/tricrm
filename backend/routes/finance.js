const express = require('express');
const router = express.Router();
const FinanceProject = require('../models/FinanceProject');
const BankExpense = require('../models/BankExpense');
const { authenticate } = require('../middleware/auth');
const ConfigurationVersionService = require('../services/ConfigurationVersionService');
const { applyDefaultPercentages, DEFAULT_PERCENTAGES } = require('../scripts/applyDefaultPercentages');
const multer = require('multer');
const XLSX = require('xlsx');

// Security: Limit XLSX processing to prevent DoS attacks
const XLSX_OPTIONS = {
  cellFormula: false, // Disable formula evaluation
  cellHTML: false,    // Disable HTML content
  cellNF: false,      // Disable number formats
  cellStyles: false,  // Disable styles
  sheetStubs: false,  // Disable empty cells
  bookVBA: false,     // Disable VBA macros
  password: null      // No password support
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// ==================== PROJECT ROUTES ====================

// Get all finance projects
router.get('/projects', authenticate, async (req, res) => {
  try {
    const { status, search, sortBy = 'srNo', order = 'asc' } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOrder = order === 'desc' ? -1 : 1;
    
    const projects = await FinanceProject.find(query)
      .sort({ [sortBy]: sortOrder })
      .populate('createdBy', 'username email');
    
    res.sendSuccess(projects, 'Projects fetched successfully');
  } catch (error) {
    console.error('Error fetching finance projects:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single project
router.get('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await FinanceProject.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.sendSuccess(project, 'Project fetched successfully');
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get projects by client ID
router.get('/clients/:clientId/projects', authenticate, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { status, search, sortBy = 'srNo', order = 'asc' } = req.query;
    
    // Build query for projects with the specific clientId
    let query = { clientId: clientId };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };
    
    const projects = await FinanceProject.find(query)
      .sort(sort)
      .populate('createdBy', 'username email')
      .populate('projectAssociates.associateId', 'name company');
    
    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error fetching client projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching client projects',
      error: error.message 
    });
  }
});

// Get projects by associate
router.get('/projects/associate/:associateId', authenticate, async (req, res) => {
  try {
    const { associateId } = req.params;
    const { search, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build query for projects where this associate is in projectAssociates array
    let query = { 
      'projectAssociates.associateId': associateId 
    };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };
    
    const projects = await FinanceProject.find(query)
      .sort(sort)
      .populate('createdBy', 'username email');
    
    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    console.error('Error fetching associate projects:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching associate projects',
      error: error.message 
    });
  }
});

// Create new project
router.post('/projects', authenticate, async (req, res) => {
  try {
    // Get current configuration version
    const currentConfig = await ConfigurationVersionService.getCurrentVersion();
    
    const projectData = {
      ...req.body,
      createdBy: req.user._id,
      configVersion: currentConfig.version,
      configSnapshot: currentConfig.configuration
    };
    
    const project = new FinanceProject(projectData);
    await project.save();
    
    res.sendSuccess(project, 'Project created successfully');
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project number already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await FinanceProject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.sendSuccess(project, 'Project updated successfully');
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/projects/:id', authenticate, async (req, res) => {
  try {
    const project = await FinanceProject.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.sendSuccess(null, 'Project deleted successfully');
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply default expense percentages to projects without configuration
router.post('/projects/apply-default-percentages', authenticate, async (req, res) => {
  try {
    const result = await applyDefaultPercentages();
    
    res.sendSuccess({
      updated: result.updated,
      projects: result.projects,
      defaultPercentages: DEFAULT_PERCENTAGES
    }, `Successfully applied default percentages to ${result.updated} project(s)`);
  } catch (error) {
    console.error('Error applying default percentages:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== BANK EXPENSE ROUTES ====================

// Get all bank expenses
router.get('/expenses', authenticate, async (req, res) => {
  try {
    const { bankName, year, month } = req.query;
    
    let query = {};
    
    if (bankName && bankName !== 'all') query.bankName = bankName;
    if (year && year !== 'all') query.year = year;
    if (month && month !== 'all') query.month = month;
    
    const expenses = await BankExpense.find(query)
      .sort({ year: -1, month: 1 })
      .populate('createdBy', 'username email');
    
    res.sendSuccess(expenses, 'Expenses fetched successfully');
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create/Update bank expense
router.post('/expenses', authenticate, async (req, res) => {
  try {
    const { bankName, month, year } = req.body;
    
    const expense = await BankExpense.findOneAndUpdate(
      { bankName, month, year },
      { ...req.body, createdBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    
    res.sendSuccess(expense, 'Expense saved successfully');
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete expense
router.delete('/expenses/:id', authenticate, async (req, res) => {
  try {
    const expense = await BankExpense.findByIdAndDelete(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.sendSuccess(null, 'Expense deleted successfully');
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get finance dashboard stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { year } = req.query;
    
    // Project stats
    const totalProjects = await FinanceProject.countDocuments();
    const activeProjects = await FinanceProject.countDocuments({ status: 'Active' });
    const completedProjects = await FinanceProject.countDocuments({ status: 'Completed' });
    
    // Revenue stats
    const projectStats = await FinanceProject.aggregate([
      {
        $group: {
          _id: null,
          totalFinalizedFees: { $sum: '$finalizedFees' },
          totalReceivedFees: { $sum: '$totalReceivedFees' },
          totalDrawing: { $sum: '$drawing' },
          totalDocuments: { $sum: '$documents' },
          totalSiteVisit: { $sum: '$siteVisit' },
          totalMarketingMisc: { $sum: '$marketingAndMisc' },
          totalOfficeManagement: { $sum: '$officeManagement' }
        }
      }
    ]);
    
    // Bank expense stats
    let expenseQuery = {};
    if (year && year !== 'all') expenseQuery.year = year;
    
    const expenseStats = await BankExpense.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: '$bankName',
          totalAmount: { $sum: '$amount' },
          totalDrawing: { $sum: '$drawing' },
          totalSiteVisit: { $sum: '$siteVisit' },
          totalOfficeManagement: { $sum: '$officeManagement' }
        }
      }
    ]);
    
    const stats = projectStats[0] || {};
    const totalExpenses = (stats.totalDrawing || 0) + 
                          (stats.totalDocuments || 0) + 
                          (stats.totalSiteVisit || 0) + 
                          (stats.totalMarketingMisc || 0) + 
                          (stats.totalOfficeManagement || 0);
    
    const result = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: await FinanceProject.countDocuments({ status: 'On Hold' })
      },
      revenue: {
        totalFinalizedFees: stats.totalFinalizedFees || 0,
        totalReceivedFees: stats.totalReceivedFees || 0,
        totalExpenses: totalExpenses,
        netProfit: (stats.totalReceivedFees || 0) - totalExpenses
      },
      expenses: {
        byCategory: {
          drawing: stats.totalDrawing || 0,
          documents: stats.totalDocuments || 0,
          siteVisit: stats.totalSiteVisit || 0,
          marketingMisc: stats.totalMarketingMisc || 0,
          officeManagement: stats.totalOfficeManagement || 0
        },
        byBank: expenseStats
      }
    };
    
    res.sendSuccess(result, 'Statistics fetched successfully');
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== IMPORT/EXPORT ROUTES ====================

// Import projects from Excel
router.post('/import/projects', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Security: Add file size check and safe parsing options
    if (req.file.buffer.length > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    
    const workbook = XLSX.read(req.file.buffer, { 
      type: 'buffer',
      ...XLSX_OPTIONS
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const projects = [];
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Skip header rows or empty rows
        if (!row['Project number'] || row['Project number'] === '#NAME?' || row['Project number'] === '#VALUE!') continue;
        
        const projectData = {
          srNo: parseInt(row['Sr. No.']) || i + 1,
          projectNumber: String(row['Project number']).trim(),
          projectName: String(row['Project name'] || '').trim(),
          link: String(row['Link'] || '').trim(),
          finalizedFees: parseInt(row['Finalized Fees']) || 0,  // Use parseInt to avoid decimal issues
          totalReceivedFees: parseInt(row['Total received fees']) || 0,  // Use parseInt to avoid decimal issues
          year2024_25: parseInt(row['2024-25']) || 0,  // Use parseInt to avoid decimal issues
          profitMargin: parseInt(row['Profit margin']) || 0,  // Use parseInt to avoid decimal issues
          drawing: parseInt(row['Drawing']) || 0,  // Use parseInt to avoid decimal issues
          documents: parseInt(row['Documents']) || 0,  // Use parseInt to avoid decimal issues
          siteVisit: parseInt(row['Site visit']) || 0,  // Use parseInt to avoid decimal issues
          marketingAndMisc: parseInt(row['Marketing and Misc']) || 0,  // Use parseInt to avoid decimal issues
          officeManagement: parseInt(row['Office management']) || 0,  // Use parseInt to avoid decimal issues
          status: row['Status'] || 'Active',
          createdBy: req.user._id
        };
        
        // Update if exists, create if new
        const project = await FinanceProject.findOneAndUpdate(
          { projectNumber: projectData.projectNumber },
          projectData,
          { new: true, upsert: true, runValidators: true }
        );
        
        projects.push(project);
      } catch (error) {
        errors.push({ row: i + 1, error: error.message });
      }
    }
    
    res.sendSuccess({
      imported: projects.length,
      errors: errors.length,
      errorDetails: errors
    }, `Successfully imported ${projects.length} projects`);
  } catch (error) {
    console.error('Error importing projects:', error);
    res.status(500).json({ message: 'Import failed', error: error.message });
  }
});

// Export projects to Excel
router.get('/export/projects', authenticate, async (req, res) => {
  try {
    const projects = await FinanceProject.find().sort({ srNo: 1 });
    
    const data = projects.map(p => ({
      'Sr. No.': p.srNo,
      'Project number': p.projectNumber,
      'Project name': p.projectName,
      'Link': p.link,
      'Finalized Fees': p.finalizedFees,
      'Total received fees': p.totalReceivedFees,
      '2024-25': p.year2024_25,
      'Profit margin': p.profitMargin,
      'Drawing': p.drawing,
      'Documents': p.documents,
      'Site visit': p.siteVisit,
      'Marketing and Misc': p.marketingAndMisc,
      'Office management': p.officeManagement,
      'Total Expenses': p.totalExpenses,
      'Net Profit': p.netProfit,
      'Status': p.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finance Projects');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=finance_projects.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting projects:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// Export expenses to Excel
router.get('/export/expenses', authenticate, async (req, res) => {
  try {
    const { year } = req.query;
    let query = {};
    if (year && year !== 'all') query.year = year;
    
    const expenses = await BankExpense.find(query).sort({ bankName: 1, month: 1 });
    
    const data = expenses.map(e => ({
      'Bank Name': e.bankName,
      'Month': e.month,
      'Year': e.year,
      'Amount': e.amount,
      'Drawing': e.drawing,
      'Site Visit': e.siteVisit,
      'Office Management': e.officeManagement,
      'Total': e.total,
      'Description': e.description
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bank Expenses');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', `attachment; filename=bank_expenses_${year || 'all'}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Error exporting expenses:', error);
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
});

// ==================== ASSOCIATE PAYMENT ROUTES ====================

// Add payment transaction for an associate
router.post('/projects/associate-payment', authenticate, async (req, res) => {
  try {
    const { 
      projectId, 
      associateId, 
      transactionDate, 
      paymentMode, 
      chequeNeftNumber, 
      amount, 
      percentageShare, 
      notes 
    } = req.body;

    // Find the project
    const project = await FinanceProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the associate in the project
    const associateIndex = project.projectAssociates.findIndex(
      assoc => assoc.associateId.toString() === associateId
    );

    if (associateIndex === -1) {
      return res.status(404).json({ message: 'Associate not found in project' });
    }

    // Create new payment transaction
    const newTransaction = {
      transactionDate: new Date(transactionDate),
      paymentMode,
      chequeNeftNumber: chequeNeftNumber || '',
      amount: parseFloat(amount),
      percentageShare: parseFloat(percentageShare),
      notes: notes || '',
      createdAt: new Date()
    };

    // Add transaction to the associate's payment history
    if (!project.projectAssociates[associateIndex].paymentTransactions) {
      project.projectAssociates[associateIndex].paymentTransactions = [];
    }
    
    project.projectAssociates[associateIndex].paymentTransactions.push(newTransaction);

    // Update the total amount paid to associate
    const existingPaid = project.projectAssociates[associateIndex].amountPaid || 0;
    project.projectAssociates[associateIndex].amountPaid = existingPaid + parseFloat(amount);

    // Update payment given date to latest transaction date
    project.projectAssociates[associateIndex].paymentGivenDate = new Date(transactionDate);

    // Save the project
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Payment transaction added successfully',
      transaction: newTransaction
    });

  } catch (error) {
    console.error('Error adding associate payment transaction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to add payment transaction', 
      error: error.message 
    });
  }
});

// Get payment transactions for an associate in a project
router.get('/projects/:projectId/associate/:associateId/payments', authenticate, async (req, res) => {
  try {
    const { projectId, associateId } = req.params;

    const project = await FinanceProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the associate in the project
    const associate = project.projectAssociates.find(
      assoc => assoc.associateId.toString() === associateId
    );

    if (!associate) {
      return res.status(404).json({ message: 'Associate not found in project' });
    }

    const transactions = associate.paymentTransactions || [];

    res.json({
      success: true,
      data: {
        associate: {
          associateId: associate.associateId,
          percentage: associate.percentage,
          amountPaid: associate.amountPaid,
          paymentGivenDate: associate.paymentGivenDate
        },
        transactions: transactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate))
      }
    });

  } catch (error) {
    console.error('Error fetching associate payment transactions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment transactions', 
      error: error.message 
    });
  }
});

// Update payment transaction for an associate
router.put('/projects/:projectId/associate/:associateId/payments/:transactionId', authenticate, async (req, res) => {
  try {
    const { projectId, associateId, transactionId } = req.params;
    const { 
      transactionDate, 
      paymentMode, 
      chequeNeftNumber, 
      amount, 
      percentageShare, 
      notes 
    } = req.body;

    const project = await FinanceProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the associate in the project
    const associateIndex = project.projectAssociates.findIndex(
      assoc => assoc.associateId.toString() === associateId
    );

    if (associateIndex === -1) {
      return res.status(404).json({ message: 'Associate not found in project' });
    }

    // Find the transaction
    const transactions = project.projectAssociates[associateIndex].paymentTransactions || [];
    const transactionIndex = transactions.findIndex(
      trans => trans._id.toString() === transactionId
    );
    console.log('Transaction index found:', transactionIndex);

    if (transactionIndex === -1) {
      console.log('ERROR: Transaction not found for ID:', transactionId);
      console.log('Available transaction IDs:', transactions.map(t => t._id.toString()));
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Get old amount to recalculate total
    const oldAmount = transactions[transactionIndex].amount;
    const newAmount = parseFloat(amount);
    const amountDifference = newAmount - oldAmount;

    // Update the transaction
    transactions[transactionIndex] = {
      ...transactions[transactionIndex].toObject(),
      transactionDate: new Date(transactionDate),
      paymentMode,
      chequeNeftNumber: chequeNeftNumber || '',
      amount: newAmount,
      percentageShare: parseFloat(percentageShare),
      notes: notes || '',
      updatedAt: new Date()
    };

    // Update the total amount paid to associate
    const currentPaid = project.projectAssociates[associateIndex].amountPaid || 0;
    project.projectAssociates[associateIndex].amountPaid = currentPaid + amountDifference;

    // Save the project
    await project.save();

    res.json({
      success: true,
      message: 'Payment transaction updated successfully',
      transaction: transactions[transactionIndex]
    });

  } catch (error) {
    console.error('Error updating associate payment transaction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update payment transaction', 
      error: error.message 
    });
  }
});

// Delete payment transaction for an associate
router.delete('/projects/:projectId/associate/:associateId/payments/:transactionId', authenticate, async (req, res) => {
  try {
    const { projectId, associateId, transactionId } = req.params;
    console.log('=== DELETE TRANSACTION DEBUG ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Route params:', { projectId, associateId, transactionId });
    console.log('ProjectId type:', typeof projectId, 'length:', projectId?.length);
    console.log('AssociateId type:', typeof associateId, 'length:', associateId?.length);
    console.log('TransactionId type:', typeof transactionId, 'length:', transactionId?.length);

    const project = await FinanceProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the associate in the project
    const associateIndex = project.projectAssociates.findIndex(
      assoc => assoc.associateId.toString() === associateId
    );
    console.log('Associate index found:', associateIndex);

    if (associateIndex === -1) {
      console.log('ERROR: Associate not found for ID:', associateId);
      return res.status(404).json({ message: 'Associate not found in project' });
    }

    // Find and remove the transaction
    const transactions = project.projectAssociates[associateIndex].paymentTransactions || [];
    console.log('Looking for transaction:', transactionId);
    console.log('Available transactions:', transactions.map(t => ({ id: t._id.toString(), date: t.transactionDate, amount: t.amount })));
    
    const transactionIndex = transactions.findIndex(
      trans => trans._id.toString() === transactionId
    );
    console.log('Transaction index found:', transactionIndex);

    if (transactionIndex === -1) {
      console.log('ERROR: Transaction not found for ID:', transactionId);
      console.log('Transaction ID type:', typeof transactionId);
      console.log('Available transaction IDs:', transactions.map(t => t._id.toString()));
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Get the amount to subtract from total
    const deletedAmount = transactions[transactionIndex].amount;

    // Remove the transaction
    transactions.splice(transactionIndex, 1);

    // Update the total amount paid to associate
    const currentPaid = project.projectAssociates[associateIndex].amountPaid || 0;
    project.projectAssociates[associateIndex].amountPaid = Math.max(0, currentPaid - deletedAmount);

    // Save the project
    await project.save();

    res.json({
      success: true,
      message: 'Payment transaction deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting associate payment transaction:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete payment transaction', 
      error: error.message 
    });
  }
});

// ==================== FINANCIAL OVERVIEW ROUTE ====================

/**
 * GET /api/finance/overview
 * Consolidated financial overview with optional filters:
 *   clientId      – filter by client ObjectId (or "all")
 *   financialYear – e.g. "2024-25"  (India April-March FY)
 *   search        – text search on projectName / projectNumber
 *
 * Returns:
 *   { projects[], summary{}, filterOptions{ financialYears[], clients[] } }
 */
router.get('/overview', authenticate, async (req, res) => {
  try {
    const { clientId, financialYear, search } = req.query;
    const Client = require('../models/Client');

    // ── Build base query ──────────────────────────────────────────────────────
    let query = {};
    if (clientId && clientId !== 'all') query.clientId = clientId;
    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // ── Financial-year date bounds (April 1 → March 31) ───────────────────────
    let fyStartDate = null;
    let fyEndDate   = null;
    if (financialYear && financialYear !== 'all') {
      const startYear = parseInt(financialYear.split('-')[0], 10);
      fyStartDate = new Date(`${startYear}-04-01T00:00:00.000Z`);
      fyEndDate   = new Date(`${startYear + 1}-03-31T23:59:59.999Z`);
      // Restrict to projects that have ≥1 payment in this FY
      query['payments'] = {
        $elemMatch: { date: { $gte: fyStartDate, $lte: fyEndDate } }
      };
    }

    // ── Fetch projects ────────────────────────────────────────────────────────
    const projects = await FinanceProject.find(query)
      .sort({ srNo: 1 })
      .populate('clientId', 'name company email phone')
      .populate('projectAssociates.associateId', 'name company');

    // ── Enrich each project with FY-scoped payment data ───────────────────────
    const enrichedProjects = projects.map(p => {
      const proj = p.toObject({ virtuals: true });

      const allPayments = proj.payments || [];
      const fyPayments  = (fyStartDate && fyEndDate)
        ? allPayments.filter(pay => {
            const d = new Date(pay.date);
            return d >= fyStartDate && d <= fyEndDate;
          })
        : allPayments;

      proj.fyReceivedFees = fyPayments.reduce((s, pay) => s + (pay.amount || 0), 0);
      proj.fyPayments     = fyPayments;

      // Always derive all-time received from actual payment entries (ignore stale stored field).
      // This prevents imported projects with totalReceivedFees set but no payment records from
      // showing phantom received amounts.
      const allTimeReceived = allPayments.reduce((s, pay) => s + (pay.amount || 0), 0);
      proj.totalReceivedFees = allTimeReceived;
      proj.pendingFees = (proj.finalizedFees || 0) - allTimeReceived;

      return proj;
    });

    // ── Compute aggregate summary ─────────────────────────────────────────────
    const summary = enrichedProjects.reduce((acc, p) => {
      acc.totalFinalizedFees   += p.finalizedFees        || 0;
      acc.totalReceivedFees    += p.fyReceivedFees       || 0;
      acc.totalProfitMargin    += p.profitMargin         || 0;
      acc.totalDrawing         += p.drawing              || 0;
      acc.totalDocuments       += p.documents            || 0;
      acc.totalSiteVisit       += p.siteVisit            || 0;
      acc.totalMarketingMisc   += p.marketingAndMisc     || 0;
      acc.totalOfficeManagement+= p.officeManagement     || 0;
      acc.totalAssociatePaid   += p.totalAssociatePaid   || 0;
      acc.totalAssociateAmount += p.totalAssociateAmount || 0;
      return acc;
    }, {
      totalFinalizedFees: 0, totalReceivedFees: 0,
      totalProfitMargin: 0, totalDrawing: 0, totalDocuments: 0,
      totalSiteVisit: 0, totalMarketingMisc: 0, totalOfficeManagement: 0,
      totalAssociatePaid: 0, totalAssociateAmount: 0
    });

    summary.totalExpenses = summary.totalDrawing + summary.totalDocuments +
                            summary.totalSiteVisit + summary.totalMarketingMisc +
                            summary.totalOfficeManagement;
    summary.pendingFees   = summary.totalFinalizedFees - summary.totalReceivedFees;
    summary.netProfit     = summary.totalReceivedFees  - summary.totalExpenses - summary.totalAssociatePaid;
    summary.projectCount  = enrichedProjects.length;

    // ── Build financial-year options from all payment dates ───────────────────
    const allRaw = await FinanceProject.find({}, 'payments.date').lean();
    const fySet  = new Set();
    allRaw.forEach(p => {
      (p.payments || []).forEach(pay => {
        const d = new Date(pay.date);
        if (isNaN(d)) return;
        const mo     = d.getUTCMonth(); // 0-indexed
        const yr     = d.getUTCFullYear();
        const fyYear = mo >= 3 ? yr : yr - 1; // April = month 3
        fySet.add(`${fyYear}-${String(fyYear + 1).slice(-2)}`);
      });
    });

    // ── Clients list for filter dropdown ─────────────────────────────────────
    const clients = await Client.find({}, 'name company').sort({ name: 1 }).lean();

    res.json({
      success: true,
      data: {
        projects: enrichedProjects,
        summary,
        filterOptions: {
          financialYears: [...fySet].sort().reverse(),
          clients
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ── Reconcile: fix all projects where totalReceivedFees != sum of payments ──
router.post('/reconcile-received-fees', authenticate, async (req, res) => {
  try {
    const projects = await FinanceProject.find({}).select('projectName projectNumber payments totalReceivedFees');
    let fixed = 0;
    const details = [];

    for (const p of projects) {
      const correctTotal = (p.payments || []).reduce((s, pay) => s + (pay.amount || 0), 0);
      if (p.totalReceivedFees !== correctTotal) {
        details.push({
          project: `${p.projectNumber} – ${p.projectName}`,
          was: p.totalReceivedFees,
          now: correctTotal
        });
        await FinanceProject.findByIdAndUpdate(p._id, { $set: { totalReceivedFees: correctTotal } });
        fixed++;
      }
    }

    res.json({
      success: true,
      message: `Reconciliation complete. Fixed ${fixed} project(s).`,
      fixed,
      details
    });
  } catch (err) {
    console.error('Reconcile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
