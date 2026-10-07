const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    default: ''
  },
  permissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isSystemRole: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  strict: false
});

// Indexes for fast lookup
roleSchema.index({ name: 1 });
roleSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Role', roleSchema);

