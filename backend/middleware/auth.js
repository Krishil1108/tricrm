const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

// JWT Secret - In production, move to environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Verify JWT Token and authenticate user
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Authentication required.' 
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user with role and permissions
      const user = await User.findById(decoded.id)
        .populate('role')
        .select('-password');

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found.' 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false, 
          message: 'Account is inactive. Please contact administrator.' 
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      }
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token.' 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.', 
      error: error.message 
    });
  }
};

// Check if user has specific permission
const checkPermission = (module, action) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. No role assigned.' 
        });
      }

      const role = req.user.role;
      
      // Admin role check - if role name is 'Admin', grant all access
      if (role.name === 'Admin' || role.name === 'admin') {
        return next();
      }

      // Check module access first
      if (module && role.permissions && role.permissions.modules) {
        if (!role.permissions.modules[module]) {
          return res.status(403).json({ 
            success: false, 
            message: `Access denied to ${module} module.` 
          });
        }
      }

      // Check specific action permission
      if (action && role.permissions && role.permissions[module]) {
        if (!role.permissions[module][action]) {
          return res.status(403).json({ 
            success: false, 
            message: `Access denied. You don't have permission to ${action} in ${module}.` 
          });
        }
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error during permission check.', 
        error: error.message 
      });
    }
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  try {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    if (req.user.role.name !== 'Admin' && req.user.role.name !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin check.', 
      error: error.message 
    });
  }
};

// Check module access only (for basic route protection)
const hasModuleAccess = (moduleName) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. No role assigned.' 
        });
      }

      const role = req.user.role;
      
      // Admin has access to everything
      if (role.name === 'Admin' || role.name === 'admin') {
        return next();
      }

      // Check module access
      if (role.permissions && role.permissions.modules && role.permissions.modules[moduleName]) {
        return next();
      }

      return res.status(403).json({ 
        success: false, 
        message: `Access denied to ${moduleName} module.` 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Server error during module access check.', 
        error: error.message 
      });
    }
  };
};

module.exports = {
  generateToken,
  authenticate,
  checkPermission,
  isAdmin,
  hasModuleAccess,
  JWT_SECRET
};
