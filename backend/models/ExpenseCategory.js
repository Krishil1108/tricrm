const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: 'folder'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
expenseCategorySchema.index({ slug: 1 });
expenseCategorySchema.index({ isActive: 1, sortOrder: 1 });

// Pre-save hook to generate slug
expenseCategorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Static method to get or create default categories
expenseCategorySchema.statics.ensureDefaultCategories = async function() {
  const defaultCategories = [
    { 
      name: 'Profit Margin', 
      slug: 'profit-margin',
      icon: 'trending-up',
      color: '#10b981',
      description: 'Profit margin related expenses',
      isSystem: true,
      sortOrder: 1
    },
    { 
      name: 'Drawing', 
      slug: 'drawing',
      icon: 'pen-tool',
      color: '#6366f1',
      description: 'Drawing and design related expenses',
      isSystem: true,
      sortOrder: 2
    },
    { 
      name: 'Documents', 
      slug: 'documents',
      icon: 'file-text',
      color: '#f59e0b',
      description: 'Documentation and paperwork expenses',
      isSystem: true,
      sortOrder: 3
    },
    { 
      name: 'Site Visit', 
      slug: 'site-visit',
      icon: 'map-pin',
      color: '#ef4444',
      description: 'Travel and site inspection expenses',
      isSystem: true,
      sortOrder: 4
    },
    { 
      name: 'Marketing & Miscellaneous', 
      slug: 'marketing-miscellaneous',
      icon: 'megaphone',
      color: '#8b5cf6',
      description: 'Marketing campaigns and other miscellaneous expenses',
      isSystem: true,
      sortOrder: 5
    },
    { 
      name: 'Office Management', 
      slug: 'office-management',
      icon: 'briefcase',
      color: '#06b6d4',
      description: 'Office supplies, rent, utilities, etc.',
      isSystem: true,
      sortOrder: 6
    }
  ];

  for (const category of defaultCategories) {
    await this.findOneAndUpdate(
      { slug: category.slug },
      { $setOnInsert: category },
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
