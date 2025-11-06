const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryItem',
    required: true
  },
  
  transactionType: {
    type: String,
    enum: ['stock_in', 'stock_out', 'adjustment', 'transfer', 'reservation', 'release_reservation'],
    required: true
  },
  
  quantity: {
    type: Number,
    required: true
  },
  
  // Stock levels after transaction
  stockBefore: {
    type: Number,
    required: true
  },
  stockAfter: {
    type: Number,
    required: true
  },
  
  // Transaction details
  reference: {
    type: String, // Could be PO number, quotation number, etc.
    trim: true
  },
  referenceType: {
    type: String,
    enum: ['purchase_order', 'quotation', 'sale', 'adjustment', 'transfer', 'manual'],
    default: 'manual'
  },
  
  // Pricing at time of transaction (for stock_in transactions)
  unitPrice: {
    type: Number,
    min: 0
  },
  totalValue: {
    type: Number,
    min: 0
  },
  
  // Supplier info (for stock_in transactions)
  supplier: {
    name: String,
    invoiceNumber: String,
    invoiceDate: Date
  },
  
  // Location details
  location: {
    from: {
      warehouse: String,
      section: String,
      row: String,
      shelf: String
    },
    to: {
      warehouse: String,
      section: String,
      row: String,
      shelf: String
    }
  },
  
  // User who performed the transaction
  performedBy: {
    type: String,
    required: true
  },
  
  // Additional details
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  
  // Approval workflow (for high-value transactions)
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved'
    },
    approvedBy: String,
    approvedAt: Date,
    approvalNotes: String
  }
}, {
  timestamps: true
});

// Pre-save middleware to calculate total value
stockTransactionSchema.pre('save', function(next) {
  if (this.unitPrice && this.quantity) {
    this.totalValue = Math.round((this.quantity * this.unitPrice) * 100) / 100;
  }
  next();
});

// Indexes for better query performance
stockTransactionSchema.index({ inventoryItem: 1, createdAt: -1 });
stockTransactionSchema.index({ transactionType: 1, createdAt: -1 });
stockTransactionSchema.index({ reference: 1, referenceType: 1 });
stockTransactionSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);