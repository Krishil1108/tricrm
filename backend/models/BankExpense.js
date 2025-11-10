const mongoose = require('mongoose');

const bankExpenseSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
    enum: ['Bank 1', 'Bank 2', 'Bank 3', 'Bank 4']
  },
  month: {
    type: String,
    required: true,
    enum: ['April', 'May', 'June', 'July', 'August', 'September', 
           'October', 'November', 'December', 'January', 'February', 'March']
  },
  year: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    default: 0
  },
  drawing: {
    type: Number,
    default: 0
  },
  siteVisit: {
    type: Number,
    default: 0
  },
  officeManagement: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique bank-month-year combination
bankExpenseSchema.index({ bankName: 1, month: 1, year: 1 }, { unique: true });

// Calculate total for the expense entry
bankExpenseSchema.virtual('total').get(function() {
  return (this.amount || 0) + (this.drawing || 0) + (this.siteVisit || 0) + (this.officeManagement || 0);
});

bankExpenseSchema.set('toJSON', { virtuals: true });
bankExpenseSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BankExpense', bankExpenseSchema);
