const express = require('express');
const router = express.Router();
const Associate = require('../models/Associate');
const Activity = require('../models/Activity');

// GET /api/associates - Get all associates
router.get('/', async (req, res) => {
  try {
    const associates = await Associate.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: associates
    });
  } catch (error) {
    console.error('Error fetching associates:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching associates' 
    });
  }
});

// POST /api/associates - Create a new associate
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      notes,
      status,
      dateAdded
    } = req.body;

    // Check if associate with email already exists
    const existingAssociate = await Associate.findOne({ email });
    if (existingAssociate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Associate with this email already exists' 
      });
    }

    const newAssociate = new Associate({
      name,
      email,
      phone,
      company,
      address,
      city,
      state,
      zipCode,
      notes,
      status: status || 'Active',
      dateAdded: dateAdded ? new Date(dateAdded) : new Date()
    });

    const savedAssociate = await newAssociate.save();
    
    // Create activity log
    try {
      console.log('Creating activity for associate:', savedAssociate.name);
      const activity = await Activity.createActivity(
        'associate_added',
        savedAssociate._id,
        'Associate',
        savedAssociate.name,
        `Added new associate: ${savedAssociate.name}${savedAssociate.company ? ` from ${savedAssociate.company}` : ''}`,
        { email: savedAssociate.email, company: savedAssociate.company }
      );
      console.log('Activity created successfully:', activity);
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't fail the request if activity logging fails
    }
    
    res.status(201).json({
      success: true,
      data: savedAssociate
    });
  } catch (error) {
    console.error('Error creating associate:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', error.errors);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Associate with this email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating associate' 
    });
  }
});

// PUT /api/associates/:id - Update an associate
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedAssociate = await Associate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAssociate) {
      return res.status(404).json({ message: 'Associate not found' });
    }

    res.json(updatedAssociate);
  } catch (error) {
    console.error('Error updating associate:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating associate' });
  }
});

// DELETE /api/associates/:id - Delete an associate
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAssociate = await Associate.findByIdAndDelete(id);

    if (!deletedAssociate) {
      return res.status(404).json({ message: 'Associate not found' });
    }

    res.json({ message: 'Associate deleted successfully' });
  } catch (error) {
    console.error('Error deleting associate:', error);
    res.status(500).json({ message: 'Server error while deleting associate' });
  }
});

// GET /api/associates/:id - Get a single associate
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const associate = await Associate.findById(id);

    if (!associate) {
      return res.status(404).json({ message: 'Associate not found' });
    }

    res.json(associate);
  } catch (error) {
    console.error('Error fetching associate:', error);
    res.status(500).json({ message: 'Server error while fetching associate' });
  }
});

// Test route for bulk import
router.get('/bulk-test', (req, res) => {
  res.json({ message: 'Bulk route is working!' });
});

// POST /api/associates/bulk - Bulk import associates
router.post('/bulk', async (req, res) => {
  try {
    const { associates } = req.body;

    if (!associates || !Array.isArray(associates) || associates.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid data format. Expected an array of associates.' 
      });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (let i = 0; i < associates.length; i++) {
      const associateData = associates[i];
      
      try {
        // Validate required fields
        if (!associateData.name || !associateData.email) {
          results.failed.push({
            row: i + 1,
            data: associateData,
            error: 'Name and email are required fields'
          });
          continue;
        }

        // Check for duplicate email
        const existingAssociate = await Associate.findOne({ email: associateData.email });
        if (existingAssociate) {
          results.duplicates.push({
            row: i + 1,
            data: associateData,
            existing: existingAssociate
          });
          continue;
        }

        // Create new associate
        const newAssociate = new Associate({
          name: associateData.name,
          email: associateData.email,
          phone: associateData.phone || '',
          company: associateData.company || '',
          address: associateData.address || '',
          city: associateData.city || '',
          state: associateData.state || '',
          zipCode: associateData.zipCode || '',
          notes: associateData.notes || '',
          status: associateData.status || 'Active',
          dateAdded: new Date()
        });

        const savedAssociate = await newAssociate.save();

        // Log activity
        await Activity.create({
          type: 'Associate',
          action: 'Added',
          description: `Associate "${savedAssociate.name}" added via bulk import`,
          date: new Date()
        });

        results.successful.push({
          row: i + 1,
          data: savedAssociate
        });

      } catch (error) {
        results.failed.push({
          row: i + 1,
          data: associateData,
          error: error.message
        });
      }
    }

    // Send comprehensive response
    const totalProcessed = results.successful.length + results.failed.length + results.duplicates.length;
    
    res.json({
      message: `Bulk import completed. ${results.successful.length} associates added successfully.`,
      summary: {
        total: totalProcessed,
        successful: results.successful.length,
        failed: results.failed.length,
        duplicates: results.duplicates.length
      },
      results
    });

  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

module.exports = router;