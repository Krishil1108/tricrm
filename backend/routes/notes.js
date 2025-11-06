const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Activity = require('../models/Activity');

// GET /api/notes - Get all notes
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      priority, 
      status, 
      isStarred,
      tags,
      search,
      limit = 50,
      page = 1,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    let filter = {};
    
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (isStarred !== undefined) filter.isStarred = isStarred === 'true';
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { relatedTo: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const notes = await Note.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Note.countDocuments(filter);

    res.json({
      notes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/notes - Create new note
router.post('/', async (req, res) => {
  try {
    const noteData = req.body;

    // Validate required fields
    if (!noteData.title || !noteData.content) {
      return res.status(400).json({ 
        message: 'Title and content are required' 
      });
    }

    const note = new Note(noteData);
    const savedNote = await note.save();

    // Create activity log
    try {
      await Activity.createActivity(
        'note_added',
        savedNote._id,
        'Note',
        savedNote.title,
        `Added note: ${savedNote.title}${savedNote.category !== 'General' ? ` (${savedNote.category})` : ''}`,
        { 
          category: savedNote.category,
          priority: savedNote.priority,
          isReminder: savedNote.isReminder,
          relatedTo: savedNote.relatedTo 
        }
      );
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't fail the request if activity logging fails
    }

    res.status(201).json({
      message: 'Note created successfully',
      note: savedNote
    });
  } catch (error) {
    console.error('Error creating note:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/notes/:id - Update note
router.put('/:id', async (req, res) => {
  try {
    const updateData = req.body;
    
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({
      message: 'Note updated successfully',
      note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.errors 
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/notes/:id - Delete note
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    res.json({ 
      message: 'Note deleted successfully',
      note 
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/notes/reminders/due - Get due reminders
router.get('/filter/reminders', async (req, res) => {
  try {
    const now = new Date();
    
    const dueReminders = await Note.find({
      isReminder: true,
      reminderDateTime: { $lte: now },
      status: 'Active'
    })
    .sort({ reminderDateTime: 1 });

    res.json(dueReminders);
  } catch (error) {
    console.error('Error fetching due reminders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/notes/:id/star - Toggle star status
router.patch('/:id/star', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.isStarred = !note.isStarred;
    await note.save();

    res.json({
      message: `Note ${note.isStarred ? 'starred' : 'unstarred'} successfully`,
      note
    });
  } catch (error) {
    console.error('Error toggling star:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/notes/:id/archive - Toggle archive status
router.patch('/:id/archive', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.status = note.status === 'Archived' ? 'Active' : 'Archived';
    await note.save();

    res.json({
      message: `Note ${note.status === 'Archived' ? 'archived' : 'unarchived'} successfully`,
      note
    });
  } catch (error) {
    console.error('Error toggling archive:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid note ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/notes/stats - Get notes statistics
router.get('/filter/stats', async (req, res) => {
  try {
    const total = await Note.countDocuments();

    const categoryStats = await Note.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const priorityStats = await Note.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const statusStats = await Note.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      total,
      byCategory: categoryStats,
      byPriority: priorityStats,
      byStatus: statusStats
    });
  } catch (error) {
    console.error('Error fetching note stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;