const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  ifscCode: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  accountType: {
    type: String,
    enum: ['Current', 'Savings', 'Cash', 'Other'],
    default: 'Current'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const firmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  shortName: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true
  },
  bankAccounts: [bankAccountSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
firmSchema.index({ name: 1 });
firmSchema.index({ isActive: 1 });

// Virtual to get default bank account
firmSchema.virtual('defaultBankAccount').get(function() {
  if (!this.bankAccounts || this.bankAccounts.length === 0) return null;
  const defaultAccount = this.bankAccounts.find(acc => acc.isDefault && acc.isActive);
  return defaultAccount || this.bankAccounts.find(acc => acc.isActive) || this.bankAccounts[0];
});

// Virtual to get active bank accounts count
firmSchema.virtual('activeBankAccountsCount').get(function() {
  if (!this.bankAccounts) return 0;
  return this.bankAccounts.filter(acc => acc.isActive).length;
});

firmSchema.set('toJSON', { virtuals: true });
firmSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Firm', firmSchema);
