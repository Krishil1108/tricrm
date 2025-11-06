const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Activity = require('../models/Activity');
const { checkPermission } = require('../middleware/auth');

// GET /api/clients - Get all clients
router.get('/', checkPermission('clients', 'view'), async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Server error while fetching clients' });
  }
});

// POST /api/clients - Create a new client
router.post('/', checkPermission('clients', 'create'), async (req, res) => {
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

    // Check if client with email already exists
    const existingClient = await Client.findOne({ email });
    if (existingClient) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const newClient = new Client({
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

    const savedClient = await newClient.save();
    
    // Create activity log
    try {
      console.log('Creating activity for client:', savedClient.name);
      const activity = await Activity.createActivity(
        'client_added',
        savedClient._id,
        'Client',
        savedClient.name,
        `Added new client: ${savedClient.name}${savedClient.company ? ` from ${savedClient.company}` : ''}`,
        { email: savedClient.email, company: savedClient.company }
      );
      console.log('Activity created successfully:', activity);
    } catch (activityError) {
      console.error('Error creating activity log:', activityError);
      // Don't fail the request if activity logging fails
    }
    
    res.status(201).json(savedClient);
  } catch (error) {
    console.error('Error creating client:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }
    res.status(500).json({ message: 'Server error while creating client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', checkPermission('clients', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error while updating client' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', checkPermission('clients', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ message: 'Server error while deleting client' });
  }
});

// GET /api/clients/:id - Get a single client
router.get('/:id', checkPermission('clients', 'view'), async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ message: 'Server error while fetching client' });
  }
});

// Test route for bulk import
router.get('/bulk-test', (req, res) => {
  res.json({ message: 'Bulk route is working!' });
});

// POST /api/clients/bulk - Bulk import clients
router.post('/bulk', async (req, res) => {
  try {
    const { clients } = req.body;

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid data format. Expected an array of clients.' 
      });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i];
      
      try {
        // Validate required fields
        if (!clientData.name || !clientData.email) {
          results.failed.push({
            row: i + 1,
            data: clientData,
            error: 'Name and email are required fields'
          });
          continue;
        }

        // Check for duplicate email
        const existingClient = await Client.findOne({ email: clientData.email });
        if (existingClient) {
          results.duplicates.push({
            row: i + 1,
            data: clientData,
            existing: existingClient
          });
          continue;
        }

        // Create new client
        const newClient = new Client({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone || '',
          company: clientData.company || '',
          address: clientData.address || '',
          city: clientData.city || '',
          state: clientData.state || '',
          zipCode: clientData.zipCode || '',
          notes: clientData.notes || '',
          status: clientData.status || 'Active',
          dateAdded: new Date()
        });

        const savedClient = await newClient.save();

        // Log activity
        await Activity.create({
          type: 'Client',
          action: 'Added',
          description: `Client "${savedClient.name}" added via bulk import`,
          date: new Date()
        });

        results.successful.push({
          row: i + 1,
          data: savedClient
        });

      } catch (error) {
        results.failed.push({
          row: i + 1,
          data: clientData,
          error: error.message
        });
      }
    }

    // Send comprehensive response
    const totalProcessed = results.successful.length + results.failed.length + results.duplicates.length;
    
    res.json({
      message: `Bulk import completed. ${results.successful.length} clients added successfully.`,
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