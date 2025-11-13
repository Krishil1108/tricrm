const mongoose = require('mongoose');

const financeProjectSchema = new mongoose.Schema({
  srNo: {
    type: Number,
    required: true
  },
  projectNumber: {
    type: String,
    required: true,
    unique: true
  },
  projectName: {
    type: String,
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    index: true
  },
  link: {
    type: String
  },
  finalizedFees: {
    type: Number,
    default: 0
  },
  totalReceivedFees: {
    type: Number,
    default: 0
  },
  year2024_25: {
    type: Number,
    default: 0
  },
  // Percentage fields (stored as percentages, e.g., 15 = 15%)
  profitMarginPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  drawingPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  documentsPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  siteVisitPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  marketingAndMiscPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  officeManagementPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Calculated amount fields (auto-calculated from percentages)
  profitMargin: {
    type: Number,
    default: 0
  },
  drawing: {
    type: Number,
    default: 0
  },
  documents: {
    type: Number,
    default: 0
  },
  siteVisit: {
    type: Number,
    default: 0
  },
  marketingAndMisc: {
    type: Number,
    default: 0
  },
  officeManagement: {
    type: Number,
    default: 0
  },
  // Payment details
  payments: [{
    date: {
      type: Date,
      required: true
    },
    chequeNeftNumber: {
      type: String,
      default: ''
    },
    mode: {
      type: String,
      enum: ['Cheque', 'NEFT', 'RTGS', 'UPI', 'Cash', 'DD'],
      default: 'Cheque'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active'
  },
  configVersion: {
    type: Number,
    required: true,
    default: 1,
    index: true
  },
  configSnapshot: {
    type: Object,
    default: {}
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  strict: false  // Allow custom fields to be stored dynamically
});

// Calculate total expenses
financeProjectSchema.virtual('totalExpenses').get(function() {
  return (this.drawing || 0) + 
         (this.documents || 0) + 
         (this.siteVisit || 0) + 
         (this.marketingAndMisc || 0) + 
         (this.officeManagement || 0);
});

// Calculate net profit
financeProjectSchema.virtual('netProfit').get(function() {
  return (this.totalReceivedFees || 0) - this.totalExpenses;
});

// Pre-save hook to auto-calculate amounts from percentages
financeProjectSchema.pre('save', function(next) {
  // Calculate totalReceivedFees from payments if payments exist
  if (this.payments && this.payments.length > 0) {
    this.totalReceivedFees = this.payments.reduce((total, payment) => {
      return total + (payment.amount || 0);
    }, 0);
  }
  
  const receivedFees = this.totalReceivedFees || 0;
  
  // Calculate amounts from percentages
  this.profitMargin = Math.round((receivedFees * (this.profitMarginPercent || 0)) / 100);
  this.drawing = Math.round((receivedFees * (this.drawingPercent || 0)) / 100);
  this.documents = Math.round((receivedFees * (this.documentsPercent || 0)) / 100);
  this.siteVisit = Math.round((receivedFees * (this.siteVisitPercent || 0)) / 100);
  this.marketingAndMisc = Math.round((receivedFees * (this.marketingAndMiscPercent || 0)) / 100);
  this.officeManagement = Math.round((receivedFees * (this.officeManagementPercent || 0)) / 100);
  
  next();
});

// Pre-update hook to auto-calculate amounts from percentages
financeProjectSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Calculate totalReceivedFees from payments if payments are being updated
  if (update.$set?.payments) {
    const totalFromPayments = update.$set.payments.reduce((total, payment) => {
      return total + (payment.amount || 0);
    }, 0);
    update.$set.totalReceivedFees = totalFromPayments;
  }
  
  // Check if we have the data needed for calculation
  if (update.$set || update.totalReceivedFees !== undefined) {
    const receivedFees = update.$set?.totalReceivedFees || update.totalReceivedFees || 0;
    
    // If percentage fields are being updated, calculate the amounts
    if (update.$set) {
      if (update.$set.profitMarginPercent !== undefined) {
        update.$set.profitMargin = Math.round((receivedFees * (update.$set.profitMarginPercent || 0)) / 100);
      }
      if (update.$set.drawingPercent !== undefined) {
        update.$set.drawing = Math.round((receivedFees * (update.$set.drawingPercent || 0)) / 100);
      }
      if (update.$set.documentsPercent !== undefined) {
        update.$set.documents = Math.round((receivedFees * (update.$set.documentsPercent || 0)) / 100);
      }
      if (update.$set.siteVisitPercent !== undefined) {
        update.$set.siteVisit = Math.round((receivedFees * (update.$set.siteVisitPercent || 0)) / 100);
      }
      if (update.$set.marketingAndMiscPercent !== undefined) {
        update.$set.marketingAndMisc = Math.round((receivedFees * (update.$set.marketingAndMiscPercent || 0)) / 100);
      }
      if (update.$set.officeManagementPercent !== undefined) {
        update.$set.officeManagement = Math.round((receivedFees * (update.$set.officeManagementPercent || 0)) / 100);
      }
    }
  }
  
  next();
});

financeProjectSchema.set('toJSON', { virtuals: true });
financeProjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinanceProject', financeProjectSchema);
