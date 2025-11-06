const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');

// GET /api/activities - Get all activities with pagination
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 50,
      page = 1,
      type,
      entityType,
      userId,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (type) filter.type = type;
    if (entityType) filter.entityType = entityType;
    if (userId) filter.userId = userId;
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.timestamp = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.timestamp = { $lte: new Date(endDate) };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const activities = await Activity.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Activity.countDocuments(filter);

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/activities/recent - Get recent activities (last 10 by default)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 10, userId } = req.query;
    
    const activities = await Activity.getRecentActivities(parseInt(limit), userId);
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/activities/:id - Get single activity
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Error fetching activity:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/activities - Create new activity
router.post('/', async (req, res) => {
  try {
    const { type, description, entityId, entityType, entityName, metadata, userId } = req.body;

    // Validate required fields
    if (!type || !description || !entityId || !entityType || !entityName) {
      return res.status(400).json({ 
        message: 'Type, description, entityId, entityType, and entityName are required' 
      });
    }

    const activity = await Activity.createActivity(
      type, 
      entityId, 
      entityType, 
      entityName, 
      description, 
      metadata, 
      userId
    );

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/activities/:id - Delete activity
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ 
      message: 'Activity deleted successfully',
      activity 
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid activity ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/activities/stats/summary - Get activity statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { userId, days = 30 } = req.query;
    
    const filter = {};
    if (userId) filter.userId = userId;
    
    // Get activities from last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    filter.timestamp = { $gte: startDate };

    const stats = await Activity.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const totalActivities = await Activity.countDocuments(filter);

    res.json({
      totalActivities,
      activityTypes: stats,
      period: `Last ${days} days`
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;