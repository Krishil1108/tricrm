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
    type: mongoose.Schema.Types.Mixed,
    default: {
      modules: {
        home: true,
        clients: true,
        associates: true,
        finance: true,
        finance_dashboard: true,
        expenses: true,
        analytics: true,
        settings: true,
        admin: false
      },
      home: {
        view: true,
        stats_cards: true,
        view_amounts: true,
        quick_actions: true
      },
      clients: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        duplicate: true,
        export: true,
        import: true,
        view_details: true,
        view_projects: true,
        stats_cards: true,
        view_amounts: true
      },
      client_projects: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        stats_cards: true,
        view_amounts: true,
        distribution_section: true
      },
      associates: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        export: true,
        import: true,
        view_projects: true,
        stats_cards: true,
        view_amounts: true
      },
      associate_projects: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        stats_cards: true,
        view_amounts: true,
        owner_view: true
      },
      finance: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        import: true,
        export: true,
        add_payment: true,
        viewStats: true,
        stats_cards: true,
        view_amounts: true,
        expense_distribution: true,
        associate_distribution: true,
        configure_percentages: true
      },
      finance_dashboard: {
        view: true,
        stats_cards: true,
        view_amounts: true,
        charts: true,
        action_buttons: true
      },
      expenses: {
        view: true,
        create: true,
        edit: true,
        delete: true,
        import: true,
        export: true,
        stats_cards: true,
        view_amounts: true
      },
      analytics: {
        view: true,
        stats_cards: true,
        view_amounts: true,
        charts: true
      },
      settings: {
        view: true,
        viewCompanySettings: true,
        editCompanySettings: true,
        manageUsers: true,
        manageRoles: true
      }
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

