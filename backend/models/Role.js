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
      associates: { type: Boolean, default: false },
      dashboard: { type: Boolean, default: false },
      finance: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
      admin: { type: Boolean, default: false }
    },
    
    // Client module permissions
    clients: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      duplicate: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      import: { type: Boolean, default: false },
      view_projects: { type: Boolean, default: false },
      view_details: { type: Boolean, default: false },
      stats_cards: { type: Boolean, default: false }
    },
    
    // Associates module permissions
    associates: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      import: { type: Boolean, default: false },
      view_projects: { type: Boolean, default: false },
      stats_cards: { type: Boolean, default: false }
    },
    
    // Finance/Projects permissions
    finance: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      import: { type: Boolean, default: false },
      export: { type: Boolean, default: false },
      add_payment: { type: Boolean, default: false },
      viewStats: { type: Boolean, default: false },
      expense_distribution: { type: Boolean, default: false },
      associate_distribution: { type: Boolean, default: false },
      configure_percentages: { type: Boolean, default: false }
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
