const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    default: 60,
    min: 1
  },
  location: {
    type: String,
    trim: true
  },
  attendees: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  type: {
    type: String,
    enum: ['Meeting', 'Call', 'Video Call', 'Presentation', 'Training', 'Interview'],
    default: 'Meeting'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  reminderMinutes: {
    type: Number,
    default: 15,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient querying by date
meetingSchema.index({ dateTime: 1 });
meetingSchema.index({ status: 1 });

// Virtual for end time
meetingSchema.virtual('endTime').get(function() {
  if (this.dateTime && this.duration) {
    return new Date(this.dateTime.getTime() + this.duration * 60000);
  }
  return null;
});

// Virtual for meeting date only
meetingSchema.virtual('meetingDate').get(function() {
  if (this.dateTime) {
    return this.dateTime.toISOString().split('T')[0];
  }
  return null;
});

module.exports = mongoose.model('Meeting', meetingSchema);