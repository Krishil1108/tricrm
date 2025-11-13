const mongoose = require('mongoose');

const configurationVersionSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true,
    unique: true
  },
  configuration: {
    // Default expense fields
    profitMarginPercent: { type: Number, default: 0 },
    drawingPercent: { type: Number, default: 0 },
    documentsPercent: { type: Number, default: 0 },
    siteVisitPercent: { type: Number, default: 0 },
    marketingAndMiscPercent: { type: Number, default: 0 },
    officeManagementPercent: { type: Number, default: 0 },
    
    // Field visibility settings
    fieldVisibility: {
      profitMargin: { type: Boolean, default: false },
      drawing: { type: Boolean, default: false },
      documents: { type: Boolean, default: false },
      siteVisit: { type: Boolean, default: false },
      marketingAndMisc: { type: Boolean, default: false },
      officeManagement: { type: Boolean, default: false }
    },
    
    // Associates configuration
    includeAssociates: { type: Boolean, default: false },
    numberOfAssociates: { type: Number, default: 1 },
    associates: [{
      id: String,
      name: String,
      company: String,
      percentage: Number
    }],
    
    // Custom fields
    customFields: [{
      name: String,
      fieldName: String,
      percentage: Number,
      visible: { type: Boolean, default: false }
    }]
  },
  appliedFrom: {
    type: Date,
    required: true,
    default: Date.now
  },
  appliedTo: {
    type: Date,
    default: null // null means current active version
  },
  changeDescription: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
configurationVersionSchema.index({ version: 1 });
configurationVersionSchema.index({ appliedFrom: 1, appliedTo: 1 });

const ConfigurationVersion = mongoose.model('ConfigurationVersion', configurationVersionSchema);

module.exports = ConfigurationVersion;
