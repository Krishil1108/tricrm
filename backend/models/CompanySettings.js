const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Trimity Consultant',
    trim: true
  },
  tagline: {
    type: String,
    default: 'Innovation, Precision, Excellence',
    trim: true
  },
  phone: {
    type: String,
    default: '(555) 123-4567',
    trim: true
  },
  address: {
    type: String,
    default: '123 Business Street, City, State 12345',
    trim: true
  },
  website: {
    type: String,
    default: 'www.trimity.com',
    trim: true
  },
  email: {
    type: String,
    default: 'info@trimity.com',
    trim: true,
    lowercase: true
  },
  industry: {
    type: String,
    default: 'technology',
    trim: true
  },
  logoUrl: {
    type: String,
    default: null
  },
  quotationSettings: {
    prefix: { type: String, default: 'Q' },
    startingNumber: { type: Number, default: 1001 },
    currentNumber: { type: Number, default: 1001 },
    separator: { type: String, default: '-' },
    suffix: { type: String, default: '' },
    resetPeriod: { type: String, default: 'never' }
  },
  notifications: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      emailNotifications: true,
      systemAlerts: true,
      activityNotifications: true,
      weeklyReports: true,
      marketingEmails: true,
      pushNotifications: true,
      smsNotifications: true,
      desktopNotifications: true,
      soundEnabled: true
    }
  },
  security: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      passwordExpiry: '90',
      loginNotifications: true,
      deviceTracking: true,
      ipWhitelist: false,
      encryptionEnabled: true,
      auditLogging: true
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
