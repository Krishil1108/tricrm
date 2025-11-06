const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['General', 'Client', 'Project', 'Meeting', 'Task', 'Idea', 'Important'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  relatedTo: {
    type: String,
    trim: true
  },
  isReminder: {
    type: Boolean,
    default: false
  },
  reminderDateTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Completed'],
    default: 'Active'
  },
  dateCreated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    trim: true
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    enum: ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'],
    default: 'default'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
noteSchema.index({ category: 1 });
noteSchema.index({ priority: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ dateCreated: 1 });
noteSchema.index({ reminderDateTime: 1 });
noteSchema.index({ status: 1 });

// Virtual for formatted date
noteSchema.virtual('formattedDate').get(function() {
  if (this.dateCreated) {
    return this.dateCreated.toLocaleDateString();
  }
  return null;
});

// Method to check if reminder is due
noteSchema.methods.isReminderDue = function() {
  if (!this.isReminder || !this.reminderDateTime) {
    return false;
  }
  return new Date() >= this.reminderDateTime;
};

module.exports = mongoose.model('Note', noteSchema);