const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: {
    // Module access permissions
    modules: {
      home: { type: Boolean, default: true },
      clients: { type: Boolean, default: false },
      dashboard: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
      settings: { type: Boolean, default: false }
    },
    
    // Client module permissions
    clients: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      duplicate: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      import: { type: Boolean, default: false }
    },
    
    // Meeting/Activity permissions
    meetings: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    
    // Notes permissions
    notes: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    
    // Dashboard permissions
    dashboard: {
      view: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false },
      viewReports: { type: Boolean, default: false },
      exportReports: { type: Boolean, default: false }
    },
    
    // Settings permissions
    settings: {
      view: { type: Boolean, default: false },
      viewCompanySettings: { type: Boolean, default: false },
      editCompanySettings: { type: Boolean, default: false },
      manageUsers: { type: Boolean, default: false },
      manageRoles: { type: Boolean, default: false }
    },
    
    // Finance permissions
    finance: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      import: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      viewStats: { type: Boolean, default: false }
    }
  },
  
  isSystemRole: {
    type: Boolean,
    default: false // System roles (like Admin) cannot be deleted
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
