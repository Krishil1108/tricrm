const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['client_added', 'inventory_added', 'meeting_scheduled', 'note_added', 'client_updated', 'inventory_updated', 'meeting_updated', 'note_updated', 'inventory_deleted']
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Client', 'Inventory', 'Meeting', 'Note']
  },
  entityName: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  userId: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ timestamp: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ entityType: 1 });
activitySchema.index({ userId: 1 });

// Virtual for formatted timestamp
activitySchema.virtual('formattedTime').get(function() {
  if (this.timestamp) {
    return this.timestamp.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  return null;
});

// Static method to create activity
activitySchema.statics.createActivity = async function(type, entityId, entityType, entityName, description, metadata = {}, userId = null) {
  try {
    const activity = new this({
      type,
      description,
      entityId,
      entityType,
      entityName,
      metadata,
      userId
    });
    
    return await activity.save();
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

// Static method to get recent activities
activitySchema.statics.getRecentActivities = async function(limit = 10, userId = null) {
  try {
    const filter = userId ? { userId } : {};
    
    return await this.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
};

module.exports = mongoose.model('Activity', activitySchema);