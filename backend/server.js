const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
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

// Middleware
app.use(cors());
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
app.use(helmet());

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

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.log('MongoDB connection error:', err));

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
const meetingRoutes = require('./routes/meetings');
const noteRoutes = require('./routes/notes');
const activityRoutes = require('./routes/activities');

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);

// Protected routes (authentication required)
app.use('/api/users', authenticate, userRoutes);
app.use('/api/roles', authenticate, roleRoutes);
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/meetings', authenticate, meetingRoutes);
app.use('/api/notes', authenticate, noteRoutes);
app.use('/api/activities', authenticate, activityRoutes);

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

// Catch all handler
app.get('*', (req, res) => {
  res.json({ message: 'API endpoint not found' });
});

// Global Error Handler Middleware (MUST be last)
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});