const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Firm = require('../models/Firm');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for attachment uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/expenses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and documents are allowed'));
  }
});

// ==================== EXPENSE CATEGORY ROUTES ====================

// Get all categories (including defaults)
router.get('/categories', authenticate, async (req, res) => {
  try {
    // Ensure default categories exist
    await ExpenseCategory.ensureDefaultCategories();
    
    const { includeInactive } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    
    const categories = await ExpenseCategory.find(query)
      .sort({ sortOrder: 1, name: 1 });
    
    res.sendSuccess(categories, 'Categories fetched successfully');
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create custom category
router.post('/categories', authenticate, async (req, res) => {
  try {
    const { name, description, icon, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Get max sort order
    const maxOrder = await ExpenseCategory.findOne().sort({ sortOrder: -1 });
    const sortOrder = (maxOrder?.sortOrder || 0) + 1;
    
    const category = new ExpenseCategory({
      name,
      description,
      icon: icon || 'folder',
      color: color || '#6366f1',
      isSystem: false,
      sortOrder,
      createdBy: req.user._id
    });
    
    await category.save();
    res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update category
router.put('/categories/:id', authenticate, async (req, res) => {
  try {
    const { name, description, icon, color, isActive } = req.body;
    
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Don't allow editing system category names
    if (category.isSystem && name && name !== category.name) {
      return res.status(400).json({ message: 'Cannot rename system categories' });
    }
    
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon) category.icon = icon;
    if (color) category.color = color;
    if (isActive !== undefined) category.isActive = isActive;
    
    await category.save();
    res.sendSuccess(category, 'Category updated successfully');
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete custom category
router.delete('/categories/:id', authenticate, async (req, res) => {
  try {
    const category = await ExpenseCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    if (category.isSystem) {
      return res.status(400).json({ message: 'Cannot delete system categories' });
    }
    
    // Check if category has expenses
    const expenseCount = await Expense.countDocuments({ category: category._id });
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${expenseCount} expenses. Please reassign or delete expenses first.` 
      });
    }
    
    await ExpenseCategory.findByIdAndDelete(req.params.id);
    res.sendSuccess(null, 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== FIRM ROUTES ====================

// Get all firms
router.get('/firms', authenticate, async (req, res) => {
  try {
    const { includeInactive, search } = req.query;
    const query = includeInactive === 'true' ? {} : { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { shortName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const firms = await Firm.find(query)
      .sort({ name: 1 })
      .populate('createdBy', 'username email');
    
    res.sendSuccess(firms, 'Firms fetched successfully');
  } catch (error) {
    console.error('Error fetching firms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single firm
router.get('/firms/:id', authenticate, async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    res.sendSuccess(firm, 'Firm fetched successfully');
  } catch (error) {
    console.error('Error fetching firm:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create firm
router.post('/firms', authenticate, async (req, res) => {
  try {
    const firmData = {
      ...req.body,
      createdBy: req.user._id
    };
    
    const firm = new Firm(firmData);
    await firm.save();
    
    res.status(201).json({ success: true, data: firm, message: 'Firm created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Firm with this name already exists' });
    }
    console.error('Error creating firm:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update firm
router.put('/firms/:id', authenticate, async (req, res) => {
  try {
    const firm = await Firm.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    res.sendSuccess(firm, 'Firm updated successfully');
  } catch (error) {
    console.error('Error updating firm:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete firm
router.delete('/firms/:id', authenticate, async (req, res) => {
  try {
    // Check if firm has expenses
    const expenseCount = await Expense.countDocuments({ firm: req.params.id });
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete firm with ${expenseCount} expenses. Please delete expenses first.` 
      });
    }
    
    const firm = await Firm.findByIdAndDelete(req.params.id);
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    res.sendSuccess(null, 'Firm deleted successfully');
  } catch (error) {
    console.error('Error deleting firm:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add bank account to firm
router.post('/firms/:id/bank-accounts', authenticate, async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.id);
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    const bankAccount = req.body;
    
    // If this is the first account or marked as default, update other accounts
    if (bankAccount.isDefault || firm.bankAccounts.length === 0) {
      firm.bankAccounts.forEach(acc => acc.isDefault = false);
      bankAccount.isDefault = true;
    }
    
    firm.bankAccounts.push(bankAccount);
    await firm.save();
    
    res.sendSuccess(firm, 'Bank account added successfully');
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bank account
router.put('/firms/:firmId/bank-accounts/:accountId', authenticate, async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.firmId);
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    const account = firm.bankAccounts.id(req.params.accountId);
    if (!account) {
      return res.status(404).json({ message: 'Bank account not found' });
    }
    
    // Handle default flag
    if (req.body.isDefault) {
      firm.bankAccounts.forEach(acc => acc.isDefault = false);
    }
    
    Object.assign(account, req.body);
    await firm.save();
    
    res.sendSuccess(firm, 'Bank account updated successfully');
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete bank account
router.delete('/firms/:firmId/bank-accounts/:accountId', authenticate, async (req, res) => {
  try {
    const firm = await Firm.findById(req.params.firmId);
    if (!firm) {
      return res.status(404).json({ message: 'Firm not found' });
    }
    
    // Check if any expenses use this bank account
    const expenseCount = await Expense.countDocuments({ 
      firm: req.params.firmId,
      bankAccount: req.params.accountId 
    });
    if (expenseCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete bank account with ${expenseCount} expenses.` 
      });
    }
    
    firm.bankAccounts.pull(req.params.accountId);
    await firm.save();
    
    res.sendSuccess(firm, 'Bank account deleted successfully');
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== EXPENSE ROUTES ====================

// Get all expenses with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      category, firm, bankAccount,
      startDate, endDate,
      minAmount, maxAmount,
      search, status,
      page = 1, limit = 50,
      sortBy = 'date', sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (category) query.category = category;
    if (firm) query.firm = firm;
    if (bankAccount) query.bankAccount = bankAccount;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('category', 'name slug icon color')
        .populate('firm', 'name shortName bankAccounts')
        .populate('createdBy', 'username email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query)
    ]);
    
    // Enrich expenses with bank account info
    const enrichedExpenses = expenses.map(expense => {
      const expenseObj = expense.toObject();
      if (expense.firm && expense.firm.bankAccounts) {
        const bankAcc = expense.firm.bankAccounts.find(
          acc => acc._id.toString() === expense.bankAccount.toString()
        );
        expenseObj.bankAccountInfo = bankAcc || null;
      }
      return expenseObj;
    });
    
    res.sendSuccess({
      expenses: enrichedExpenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Expenses fetched successfully');
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single expense
router.get('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('category', 'name slug icon color')
      .populate('firm', 'name shortName bankAccounts')
      .populate('createdBy', 'username email');
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.sendSuccess(expense, 'Expense fetched successfully');
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create expense
router.post('/', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      createdBy: req.user._id,
      date: new Date(req.body.date)
    };
    
    // Handle file attachments
    if (req.files && req.files.length > 0) {
      expenseData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }
    
    // Parse tags if string
    if (typeof expenseData.tags === 'string') {
      expenseData.tags = expenseData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    const expense = new Expense(expenseData);
    await expense.save();
    
    // Populate for response
    await expense.populate([
      { path: 'category', select: 'name slug icon color' },
      { path: 'firm', select: 'name shortName bankAccounts' },
      { path: 'createdBy', select: 'username email' }
    ]);
    
    res.status(201).json({ success: true, data: expense, message: 'Expense created successfully' });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update expense
router.put('/:id', authenticate, upload.array('attachments', 5), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const updateData = {
      ...req.body,
      updatedBy: req.user._id
    };
    
    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }
    
    // Handle new attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
      }));
      updateData.attachments = [...(expense.attachments || []), ...newAttachments];
    }
    
    // Parse tags if string
    if (typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name slug icon color' },
      { path: 'firm', select: 'name shortName bankAccounts' },
      { path: 'createdBy', select: 'username email' }
    ]);
    
    res.sendSuccess(updatedExpense, 'Expense updated successfully');
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete expense
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    // Delete associated files
    if (expense.attachments && expense.attachments.length > 0) {
      expense.attachments.forEach(att => {
        if (att.path && fs.existsSync(att.path)) {
          fs.unlinkSync(att.path);
        }
      });
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    res.sendSuccess(null, 'Expense deleted successfully');
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove attachment from expense
router.delete('/:id/attachments/:attachmentId', authenticate, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    const attachment = expense.attachments.id(req.params.attachmentId);
    if (attachment) {
      if (attachment.path && fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
      expense.attachments.pull(req.params.attachmentId);
      await expense.save();
    }
    
    res.sendSuccess(expense, 'Attachment removed successfully');
  } catch (error) {
    console.error('Error removing attachment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== ANALYTICS ROUTES ====================

// Get expense analytics
router.get('/analytics/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, category, firm, timeframe = 'monthly' } = req.query;
    
    const analytics = await Expense.getAnalytics({
      startDate,
      endDate,
      category,
      firm
    });
    
    res.sendSuccess(analytics, 'Analytics fetched successfully');
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get expense trends by timeframe
router.get('/analytics/trends', authenticate, async (req, res) => {
  try {
    const { timeframe = 'monthly', periods = 12, category, firm } = req.query;
    
    const matchStage = {};
    if (category) matchStage.category = new mongoose.Types.ObjectId(category);
    if (firm) matchStage.firm = new mongoose.Types.ObjectId(firm);
    
    let groupFormat;
    switch (timeframe) {
      case 'daily':
        groupFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupFormat = '%Y-W%V';
        break;
      case 'quarterly':
        groupFormat = '%Y-Q';
        break;
      case 'yearly':
        groupFormat = '%Y';
        break;
      default:
        groupFormat = '%Y-%m';
    }
    
    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: timeframe === 'quarterly' 
            ? { 
                year: { $year: '$date' },
                quarter: { $ceil: { $divide: [{ $month: '$date' }, 3] } }
              }
            : { $dateToString: { format: groupFormat, date: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: parseInt(periods) }
    ];
    
    const trends = await Expense.aggregate(pipeline);
    
    // Format quarterly results
    const formattedTrends = trends.map(t => ({
      period: timeframe === 'quarterly' 
        ? `${t._id.year}-Q${t._id.quarter}`
        : t._id,
      totalAmount: t.totalAmount,
      count: t.count,
      avgAmount: Math.round(t.avgAmount)
    })).reverse();
    
    res.sendSuccess(formattedTrends, 'Trends fetched successfully');
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get year-over-year comparison
router.get('/analytics/comparison', authenticate, async (req, res) => {
  try {
    const { years = 3 } = req.query;
    const currentYear = new Date().getFullYear();
    
    const pipeline = [
      {
        $addFields: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        }
      },
      {
        $match: {
          year: { $gte: currentYear - parseInt(years) + 1 }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ];
    
    const data = await Expense.aggregate(pipeline);
    
    // Organize by year
    const byYear = {};
    data.forEach(d => {
      if (!byYear[d._id.year]) {
        byYear[d._id.year] = Array(12).fill(null).map((_, i) => ({
          month: i + 1,
          totalAmount: 0,
          count: 0
        }));
      }
      byYear[d._id.year][d._id.month - 1] = {
        month: d._id.month,
        totalAmount: d.totalAmount,
        count: d.count
      };
    });
    
    res.sendSuccess(byYear, 'Comparison data fetched successfully');
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get fiscal year summary
router.get('/analytics/fiscal-year', authenticate, async (req, res) => {
  try {
    const { fy } = req.query;
    
    // Parse fiscal year (format: 2024-2025)
    let startDate, endDate;
    if (fy) {
      const [startYear] = fy.split('-');
      startDate = new Date(`${startYear}-04-01`);
      endDate = new Date(`${parseInt(startYear) + 1}-03-31T23:59:59`);
    } else {
      // Current fiscal year
      const now = new Date();
      const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(`${startYear}-04-01`);
      endDate = new Date(`${startYear + 1}-03-31T23:59:59`);
    }
    
    const pipeline = [
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$category',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'expensecategories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            { $unwind: '$categoryInfo' },
            {
              $project: {
                name: '$categoryInfo.name',
                color: '$categoryInfo.color',
                totalAmount: 1,
                count: 1
              }
            },
            { $sort: { totalAmount: -1 } }
          ],
          byMonth: [
            {
              $group: {
                _id: { $month: '$date' },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];
    
    const [result] = await Expense.aggregate(pipeline);
    
    res.sendSuccess({
      fiscalYear: fy || `${startDate.getFullYear()}-${startDate.getFullYear() + 1}`,
      startDate,
      endDate,
      ...result
    }, 'Fiscal year summary fetched successfully');
  } catch (error) {
    console.error('Error fetching fiscal year summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
