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
  projectLocation: {
    type: String,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    index: true
  },
  // Support for multiple associates (1-5 per project)
  projectAssociates: [{
    associateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Associate',
      required: true,
      index: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    paymentGivenDate: {
      type: Date
    },
    // Multiple payment transactions for this associate (10-15 stages)
    paymentTransactions: [{
      transactionDate: {
        type: Date,
        required: true
      },
      paymentMode: {
        type: String,
        enum: ['Cheque', 'NEFT', 'RTGS', 'UPI', 'Cash', 'DD', 'Bank Transfer'],
        default: 'Cheque'
      },
      chequeNeftNumber: {
        type: String,
        default: ''
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      percentageShare: {
        type: Number,
        default: 0
      },
      notes: {
        type: String,
        default: ''
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Calculated total associate allocation (sum of all associates)
  totalAssociateAmount: {
    type: Number,
    default: 0
  },
  totalAssociatePaid: {
    type: Number,
    default: 0
  },
  totalAssociatePending: {
    type: Number,
    default: 0
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
  
  // Calculate total associate allocation from all associates
  if (this.projectAssociates && this.projectAssociates.length > 0) {
    // Calculate total percentage and amount for all associates
    const totalAssociatePercentage = this.projectAssociates.reduce((sum, assoc) => {
      return sum + (assoc.percentage || 0);
    }, 0);
    
    this.totalAssociateAmount = Math.round((receivedFees * totalAssociatePercentage) / 100);
    
    this.totalAssociatePaid = this.projectAssociates.reduce((sum, assoc) => {
      return sum + (assoc.amountPaid || 0);
    }, 0);
    
    this.totalAssociatePending = this.totalAssociateAmount - this.totalAssociatePaid;
  } else {
    this.totalAssociateAmount = 0;
    this.totalAssociatePaid = 0;
    this.totalAssociatePending = 0;
  }
  
  // Calculate remaining amount after associate allocation for expense distribution
  const amountForExpenses = receivedFees - (this.totalAssociateAmount || 0);
  
  // Calculate expense amounts from percentages based on remaining amount
  this.profitMargin = Math.round((amountForExpenses * (this.profitMarginPercent || 0)) / 100);
  this.drawing = Math.round((amountForExpenses * (this.drawingPercent || 0)) / 100);
  this.documents = Math.round((amountForExpenses * (this.documentsPercent || 0)) / 100);
  this.siteVisit = Math.round((amountForExpenses * (this.siteVisitPercent || 0)) / 100);
  this.marketingAndMisc = Math.round((amountForExpenses * (this.marketingAndMiscPercent || 0)) / 100);
  this.officeManagement = Math.round((amountForExpenses * (this.officeManagementPercent || 0)) / 100);
  
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
    
    // Calculate total associate allocation if projectAssociates are being updated
    if (update.$set) {
      if (update.$set.projectAssociates && update.$set.projectAssociates.length > 0) {
        const totalAssociatePercentage = update.$set.projectAssociates.reduce((sum, assoc) => {
          return sum + (assoc.percentage || 0);
        }, 0);
        
        update.$set.totalAssociateAmount = Math.round((receivedFees * totalAssociatePercentage) / 100);
        
        update.$set.totalAssociatePaid = update.$set.projectAssociates.reduce((sum, assoc) => {
          return sum + (assoc.amountPaid || 0);
        }, 0);
        
        update.$set.totalAssociatePending = update.$set.totalAssociateAmount - update.$set.totalAssociatePaid;
      }
      
      // Calculate remaining amount after associate allocation
      const associateAllocation = update.$set.totalAssociateAmount || 0;
      const amountForExpenses = receivedFees - associateAllocation;
    
      // If percentage fields are being updated, calculate the amounts from remaining balance
      if (update.$set.profitMarginPercent !== undefined) {
        update.$set.profitMargin = Math.round((amountForExpenses * (update.$set.profitMarginPercent || 0)) / 100);
      }
      if (update.$set.drawingPercent !== undefined) {
        update.$set.drawing = Math.round((amountForExpenses * (update.$set.drawingPercent || 0)) / 100);
      }
      if (update.$set.documentsPercent !== undefined) {
        update.$set.documents = Math.round((amountForExpenses * (update.$set.documentsPercent || 0)) / 100);
      }
      if (update.$set.siteVisitPercent !== undefined) {
        update.$set.siteVisit = Math.round((amountForExpenses * (update.$set.siteVisitPercent || 0)) / 100);
      }
      if (update.$set.marketingAndMiscPercent !== undefined) {
        update.$set.marketingAndMisc = Math.round((amountForExpenses * (update.$set.marketingAndMiscPercent || 0)) / 100);
      }
      if (update.$set.officeManagementPercent !== undefined) {
        update.$set.officeManagement = Math.round((amountForExpenses * (update.$set.officeManagementPercent || 0)) / 100);
      }
    }
  }
  
  next();
});

financeProjectSchema.set('toJSON', { virtuals: true });
financeProjectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FinanceProject', financeProjectSchema);
