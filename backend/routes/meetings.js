const express = require('express');
const router = express.Router();
const Meeting = require('../models/Meeting');
const Activity = require('../models/Activity');

// GET /api/meetings - Get all meetings
router.get('/', async (req, res) => {
  try {
    const { 
      date, 
      startDate, 
      endDate, 
      status, 
      type, 
      priority,
      limit = 50,
      page = 1,
      sort = 'dateTime'
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (date) {
      const selectedDate = new Date(date);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.dateTime = {
        $gte: selectedDate,
        $lt: nextDay
      };
    } else if (startDate && endDate) {
      filter.dateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const meetings = await Meeting.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Meeting.countDocuments(filter);

    res.json({
      meetings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/meetings/:id - Get single meeting
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid meeting ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/meetings - Create new meeting
router.post('/', async (req, res) => {
  try {
    const meetingData = req.body;

    // Validate required fields
    if (!meetingData.title || !meetingData.dateTime) {
      return res.status(400).json({ 
        message: 'Title and dateTime are required' 
      });
    }

    // Validate dateTime is not in the past (optional check)
    const meetingDate = new Date(meetingData.dateTime);
    if (meetingDate < new Date()) {
      console.warn('Meeting scheduled in the past:', meetingDate);
    }

    const meeting = new Meeting(meetingData);
    const savedMeeting = await meeting.save();

    // Create activity log
    try {
      await Activity.createActivity(
        'meeting_scheduled',
        savedMeeting._id,
        'Meeting',
        savedMeeting.title,
        `Scheduled meeting: ${savedMeeting.title} for ${savedMeeting.dateTime.toLocaleDateString()}`,
        { 
          type: savedMeeting.type,
          dateTime: savedMeeting.dateTime,
          duration: savedMeeting.duration,
          location: savedMeeting.location 
        }
      );
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't fail the request if activity logging fails
    }

    res.status(201).json({
      message: 'Meeting created successfully',
      meeting: savedMeeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/meetings/:id - Update meeting
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({
      message: 'Meeting updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.errors 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid meeting ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/meetings/:id - Delete meeting
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({ 
      message: 'Meeting deleted successfully',
      meeting 
    });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid meeting ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/meetings/upcoming - Get upcoming meetings (next 7 days)
router.get('/filter/upcoming', async (req, res) => {
  try {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const meetings = await Meeting.find({
      dateTime: {
        $gte: now,
        $lte: nextWeek
      },
      status: { $ne: 'Cancelled' }
    })
    .sort({ dateTime: 1 })
    .limit(10);

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching upcoming meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/meetings/:id/status - Update meeting status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    res.json({
      message: 'Meeting status updated successfully',
      meeting
    });
  } catch (error) {
    console.error('Error updating meeting status:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid status value' 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid meeting ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;