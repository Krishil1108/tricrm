const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import error handling
const { globalErrorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import response wrapper
const { attachResponseHelpers } = require('./utils/responseWrapper');

// Import Swagger configuration
const { swaggerSpec, swaggerUi } = require('./config/swagger');

// Import security middleware
const { 
  sanitizeInput, 
  mongoSanitize, 
  apiLimiter, 
  authLimiter 
} = require('./middleware/sanitization');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - needed for rate limiting behind proxies/load balancers
// Set to true if behind a proxy, or specify the number of hops
app.set('trust proxy', 1);

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://trimity-crm.onrender.com',
      'https://tricrm-frontend.onrender.com',
      'https://tricrm-frontend.vercel.app',
      'https://tricrm-frontend.netlify.app',
      'https://trido-pm78.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json());

// Response compression middleware (use early for better performance)
app.use(compression({
  level: 6, // Compression level (0-9, 6 is default)
  threshold: 1024, // Only compress responses larger than 1kb
  filter: (req, res) => {
    // Don't compress if explicitly disabled via header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all compressible content types
    return compression.filter(req, res);
  }
}));

// Security Middleware
// Helmet helps secure Express apps by setting various HTTP headers
// Configure CSP to allow inline scripts for React app
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Data sanitization against NoSQL injection attacks
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(sanitizeInput);

// Attach response helper methods to res object
app.use(attachResponseHelpers);

// Rate limiting on all routes
app.use(apiLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  logger.logRequest(req);
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    logger.logResponse(req, res.statusCode, duration);
    return originalJson.call(this, data);
  };
  
  next();
});

// MongoDB connection with optimized settings for deployment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
})
.then(() => {
  console.log('MongoDB connected successfully');
  console.log(`Database: ${mongoose.connection.db.databaseName}`);
})
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
});

// Import authentication middleware
const { authenticate } = require('./middleware/auth');

// ============================================
// API DOCUMENTATION (Swagger)
// ============================================
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API is running
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
app.get('/api/health', (req, res) => {
  res.sendSuccess({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, 'API is running');
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CRM API Documentation',
  customfavIcon: '/favicon.ico'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ============================================
// ROUTES
// ============================================
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const roleRoutes = require('./routes/roles');
const clientRoutes = require('./routes/clients');
const associateRoutes = require('./routes/associates');
const meetingRoutes = require('./routes/meetings');
const noteRoutes = require('./routes/notes');
const activityRoutes = require('./routes/activities');
const financeRoutes = require('./routes/finance');
const configurationVersionRoutes = require('./routes/configurationVersions');
const dataManagementRoutes = require('./routes/dataManagement');
const analyticsRoutes = require('./routes/analytics');

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/roles', authenticate, roleRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/associates', authenticate, associateRoutes);
app.use('/api/meetings', authenticate, meetingRoutes);
app.use('/api/notes', authenticate, noteRoutes);
app.use('/api/activities', authenticate, activityRoutes);
app.use('/api/configuration-versions', authenticate, configurationVersionRoutes);
app.use('/api/finance', authenticate, financeRoutes);
app.use('/api/data', authenticate, dataManagementRoutes);

// Analytics routes with debugging
console.log('📊 [SERVER] Registering analytics routes at /api/analytics...');
try {
  app.use('/api/analytics', analyticsRoutes);
  console.log('✅ [SERVER] Analytics routes registered successfully');
} catch (error) {
  console.error('❌ [SERVER] Failed to register analytics routes:', error);
}

// List all registered routes for debugging
console.log('🔍 [SERVER] All registered routes:');
app._router.stack.forEach((middleware, index) => {
  if (middleware.route) {
    console.log(`   ${Object.keys(middleware.route.methods)[0].toUpperCase()} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    console.log(`   ROUTER ${middleware.regexp.source.replace('\\/?(?=\\/|$)', '')}`);
  }
});

// Basic route
app.get('/api/test', (req, res) => {
  res.sendSuccess({ message: 'Backend server is running!' }, 'Test endpoint');
});

// System Statistics Route (protected)
/**
 * @swagger
 * /api/system/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Retrieve comprehensive system statistics including database info, uptime, and resource usage
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
app.get('/api/system/stats', authenticate, async (req, res) => {
  try {
    const Client = require('./models/Client');
    const Activity = require('./models/Activity');
    
    // Get counts
    const [clientCount, activityCount] = await Promise.all([
      Client.countDocuments(),
      Activity.countDocuments()
    ]);

    // Get database size (approximate)
    const dbStats = await mongoose.connection.db.stats();
    const dbSizeMB = (dbStats.dataSize / (1024 * 1024)).toFixed(2);

    // Calculate uptime
    const uptimeSeconds = process.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeStr = days > 0 
      ? `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''}`
      : hours > 0
        ? `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    // Get last backup time (you can implement actual backup logic)
    const lastBackup = new Date(Date.now() - 2 * 60 * 60 * 1000); // Mock: 2 hours ago
    const backupTimeAgo = getTimeAgo(lastBackup);

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2);
    const memoryTotalMB = (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2);

    res.sendSuccess({
      totalClients: clientCount,
      totalActivities: activityCount,
      dbSize: `${dbSizeMB} MB`,
      lastBackup: backupTimeAgo,
      uptime: uptimeStr,
      systemHealth: 'Excellent',
      memoryUsage: `${memoryUsedMB} / ${memoryTotalMB} MB`,
      timestamp: new Date().toISOString()
    }, 'System statistics retrieved successfully');
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Serve React app static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Catch-all route for React Router - handles all non-API routes
  app.get('*', (req, res) => {
    // Skip API routes - they should return 404 if not found
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    
    // Serve index.html for all other routes (SPA fallback)
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
} else {
  // In development, proxy handles frontend routing
  // Just handle unknown API routes
  app.get('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });
}

// Global Error Handler Middleware (MUST be last)
app.use(globalErrorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Set server timeout for better performance
server.timeout = 30000; // 30 seconds