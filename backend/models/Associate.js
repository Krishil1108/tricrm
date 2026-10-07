const mongoose = require('mongoose');

const associateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
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
  zipCode: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes to speed up lookups, search, and sorting
associateSchema.index({ name: 1 });
associateSchema.index({ email: 1 });
associateSchema.index({ status: 1 });
associateSchema.index({ createdAt: -1 });
associateSchema.index({ name: 'text', company: 'text', email: 'text' });

module.exports = mongoose.model('Associate', associateSchema);
