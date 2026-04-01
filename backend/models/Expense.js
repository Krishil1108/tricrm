const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  // Category reference
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: true,
    index: true
  },
  
  // Firm and Bank Account
  firm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Firm',
    required: true,
    index: true
  },
  bankAccount: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // Expense Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Payment Details
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'Card', 'DD', 'Other'],
    default: 'Cash'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  
  // Description
  title: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags for additional categorization
  tags: [{
    type: String,
    trim: true
  }],
  
  // Recurring expense support
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: {
      values: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      message: '{VALUE} is not a valid frequency'
    },
    required: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid'],
    default: 'paid'
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for analytics queries
expenseSchema.index({ date: -1, category: 1 });
expenseSchema.index({ firm: 1, date: -1 });
expenseSchema.index({ category: 1, firm: 1, date: -1 });
expenseSchema.index({ createdAt: -1 });

// Text index for search
expenseSchema.index({ title: 'text', notes: 'text' });

// Virtual for formatted amount (INR)
expenseSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(this.amount);
});

// Virtual for fiscal year
expenseSchema.virtual('fiscalYear').get(function() {
  if (!this.date) return null;
  const d = new Date(this.date);
  const month = d.getMonth();
  const year = d.getFullYear();
  // Indian fiscal year: April to March
  if (month >= 3) { // April onwards
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
});

// Virtual for quarter
expenseSchema.virtual('quarter').get(function() {
  if (!this.date) return null;
  const d = new Date(this.date);
  const month = d.getMonth();
  // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
  if (month >= 3 && month <= 5) return 'Q1';
  if (month >= 6 && month <= 8) return 'Q2';
  if (month >= 9 && month <= 11) return 'Q3';
  return 'Q4';
});

expenseSchema.set('toJSON', { virtuals: true });
expenseSchema.set('toObject', { virtuals: true });

// Static method for aggregated analytics
expenseSchema.statics.getAnalytics = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate || filters.endDate) {
    matchStage.date = {};
    if (filters.startDate) matchStage.date.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.date.$lte = new Date(filters.endDate);
  }
  
  if (filters.category) {
    matchStage.category = new mongoose.Types.ObjectId(filters.category);
  }
  
  if (filters.firm) {
    matchStage.firm = new mongoose.Types.ObjectId(filters.firm);
  }

  const pipeline = [
    { $match: matchStage },
    {
      $facet: {
        // Total summary
        summary: [
          {
            $group: {
              _id: null,
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 },
              avgAmount: { $avg: '$amount' },
              minAmount: { $min: '$amount' },
              maxAmount: { $max: '$amount' }
            }
          }
        ],
        // By category
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
          { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              name: '$categoryInfo.name',
              color: '$categoryInfo.color',
              icon: '$categoryInfo.icon',
              totalAmount: 1,
              count: 1
            }
          },
          { $sort: { totalAmount: -1 } }
        ],
        // By firm
        byFirm: [
          {
            $group: {
              _id: '$firm',
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: 'firms',
              localField: '_id',
              foreignField: '_id',
              as: 'firmInfo'
            }
          },
          { $unwind: { path: '$firmInfo', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              name: '$firmInfo.name',
              totalAmount: 1,
              count: 1
            }
          },
          { $sort: { totalAmount: -1 } }
        ],
        // Daily trend (last 30 days)
        dailyTrend: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 30 }
        ],
        // Monthly trend
        monthlyTrend: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 12 }
        ]
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0];
};

module.exports = mongoose.model('Expense', expenseSchema);
