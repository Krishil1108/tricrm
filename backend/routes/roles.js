const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Role = require('../models/Role');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

// All role routes require authentication and admin privileges
router.use(authenticate);
router.use(isAdmin);

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private (Admin only)
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    res.json({ 
      success: true, 
      roles 
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/roles/:id
// @desc    Get role by ID
// @access  Private (Admin only)
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role not found' 
      });
    }

    res.json({ 
      success: true, 
      role 
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/roles
// @desc    Create new role
// @access  Private (Admin only)
router.post('/', [
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, description, permissions } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.trim() });
    if (existingRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role with this name already exists' 
      });
    }

    // Create new role
    const role = new Role({
      name: name.trim(),
      description: description || '',
      permissions: permissions || {},
      isSystemRole: false
    });

    await role.save();

    res.status(201).json({ 
      success: true, 
      message: 'Role created successfully', 
      role 
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private (Admin only)
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role not found' 
      });
    }

    // Prevent modification of system Admin role name
    if (role.isSystemRole && req.body.name && req.body.name !== role.name) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot rename system role' 
      });
    }

    const { name, description, permissions } = req.body;

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name: name.trim() });
      if (existingRole) {
        return res.status(400).json({ 
          success: false, 
          message: 'Role with this name already exists' 
        });
      }
      role.name = name.trim();
    }

    if (description !== undefined) role.description = description;
    if (permissions) role.permissions = permissions;

    await role.save();

    res.json({ 
      success: true, 
      message: 'Role updated successfully', 
      role 
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private (Admin only)
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role not found' 
      });
    }

    // Prevent deletion of system roles
    if (role.isSystemRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete system role' 
      });
    }

    // Check if any users are assigned this role
    const usersWithRole = await User.countDocuments({ role: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.` 
      });
    }

    await Role.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Role deleted successfully' 
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/roles/:id/users
// @desc    Get users assigned to a role
// @access  Private (Admin only)
router.get('/:id/users', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ 
        success: false, 
        message: 'Role not found' 
      });
    }

    const users = await User.find({ role: role._id })
      .select('-password')
      .sort({ fullName: 1 });

    res.json({ 
      success: true, 
      users,
      count: users.length 
    });
  } catch (error) {
    console.error('Get role users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
