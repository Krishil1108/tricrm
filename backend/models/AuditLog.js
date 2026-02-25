const mongoose = require('mongoose');

/**
 * AuditLog Schema
 * Records security-relevant mutations: login, logout, create, update, delete, permission changes.
 * Stored separately so they cannot be overwritten by normal business logic.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    username: {
      type: String,
      default: 'anonymous',
    },

    // What they did
    action: {
      type: String,
      required: true,
      enum: [
        'LOGIN',
        'LOGIN_FAILED',
        'LOGOUT',
        'REGISTER',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET',
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'PERMISSION_CHANGE',
        'ROLE_CHANGE',
        'EXPORT',
        'OTHER',
      ],
    },

    // Resource targeted (e.g. "User", "Client", "FinanceProject")
    resource: {
      type: String,
      default: null,
    },
    resourceId: {
      type: String,
      default: null,
    },

    // HTTP context
    method: {
      type: String,
      default: null,
    },
    path: {
      type: String,
      default: null,
    },

    // Network
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },

    // Outcome
    success: {
      type: Boolean,
      default: true,
    },
    statusCode: {
      type: Number,
      default: null,
    },

    // Additional context (safe subset — never store passwords/tokens)
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,   // adds createdAt + updatedAt
    // Audit logs are append-only; prevent accidental updates via Mongoose
    strict: true,
  }
);

// Index for common query patterns
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
