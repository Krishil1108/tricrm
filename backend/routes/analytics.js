const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Debug logging for route registration
console.log('📊 [ANALYTICS] Registering analytics routes...');

// Simple test endpoint (no auth required for debugging)
router.get('/test', (req, res) => {
  console.log('🧪 [ANALYTICS] Test endpoint accessed');
  res.json({ 
    message: 'Analytics test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint (no auth required for testing)
router.get('/health', (req, res) => {
  console.log('📊 [ANALYTICS] Health check accessed');
  res.json({ 
    status: 'Analytics routes are working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    routes: [
      '/api/analytics/health',
      '/api/analytics/debug-routes', 
      '/api/analytics/filter-options/clients',
      '/api/analytics/filter-options/projects',
      '/api/analytics/filter-options/associates',
      '/api/analytics/dashboard',
      '/api/analytics/monthly-client-growth',
      '/api/analytics/test-monthly-client-growth'
    ]
  });
});

// Debug route to list all registered routes
router.get('/debug-routes', (req, res) => {
  console.log('📊 [ANALYTICS] Debug routes accessed');
  res.json({
    message: 'Analytics routes debug info',
    registeredRoutes: router.stack.map(layer => ({
      method: layer.route ? Object.keys(layer.route.methods)[0].toUpperCase() : 'MIDDLEWARE',
      path: layer.route ? layer.route.path : 'N/A'
    })),
    controllerMethods: Object.getOwnPropertyNames(analyticsController).filter(name => typeof analyticsController[name] === 'function'),
    timestamp: new Date().toISOString()
  });
});

// Middleware to authenticate all other analytics routes
router.use((req, res, next) => {
  console.log(`📊 [ANALYTICS] Processing request: ${req.method} ${req.path}`);
  authenticate(req, res, next);
});

// Filter options endpoints
router.get('/filter-options/clients', (req, res, next) => {
  console.log('📊 [ANALYTICS] Clients filter options requested');
  analyticsController.getClientOptions(req, res, next);
});

router.get('/filter-options/projects', (req, res, next) => {
  console.log('📊 [ANALYTICS] Projects filter options requested');
  analyticsController.getProjectOptions(req, res, next);
});

router.get('/filter-options/associates', (req, res, next) => {
  console.log('📊 [ANALYTICS] Associates filter options requested');
  analyticsController.getAssociateOptions(req, res, next);
});

// Main dashboard data endpoint
router.get('/dashboard', (req, res, next) => {
  console.log('📊 [ANALYTICS] Dashboard data requested with filters:', req.query);
  analyticsController.getDashboardData(req, res, next);
});

// Interactive chart endpoint
router.get('/interactive-chart', (req, res, next) => {
  console.log('📊 [ANALYTICS] Interactive chart requested with config:', req.query);
  analyticsController.getInteractiveChart(req, res, next);
});

// Clients by creation date (flexible grouping)
router.get('/clients/monthly', (req, res, next) => {
  console.log('📊 [ANALYTICS] Clients monthly requested with params:', req.query);
  analyticsController.getClientsMonthly(req, res, next);
});

// Enhanced analytics endpoints
router.get('/projects/analytics', (req, res, next) => {
  console.log('📊 [ANALYTICS] Projects analytics requested');
  analyticsController.getProjectsAnalytics(req, res, next);
});

router.get('/revenue/analytics', (req, res, next) => {
  console.log('📊 [ANALYTICS] Revenue analytics requested');
  analyticsController.getRevenueAnalytics(req, res, next);
});

router.get('/associates/performance', (req, res, next) => {
  console.log('📊 [ANALYTICS] Associate performance requested');
  analyticsController.getAssociatePerformance(req, res, next);
});

router.get('/payments/analytics', (req, res, next) => {
  console.log('📊 [ANALYTICS] Payment analytics requested');
  analyticsController.getPaymentAnalytics(req, res, next);
});

router.get('/netprofit/analytics', (req, res, next) => {
  console.log('📊 [ANALYTICS] Net profit analytics requested');
  analyticsController.getNetProfitAnalytics(req, res, next);
});

router.get('/expenses/analytics', (req, res, next) => {
  console.log('📊 [ANALYTICS] Expenses analytics requested');
  analyticsController.getExpensesAnalytics(req, res, next);
});

router.get('/expenses/estimated-vs-actual', (req, res, next) => {
  console.log('📊 [ANALYTICS] Estimated vs actual expenses requested');
  analyticsController.getEstimatedVsActualExpenses(req, res, next);
});

// Advanced chart endpoint with Python support
router.get('/advanced-chart', (req, res, next) => {
  console.log('📊 [ANALYTICS] Advanced chart requested with config:', req.query);
  analyticsController.getAdvancedChart(req, res, next);
});

// Monthly client growth endpoint
router.get('/monthly-client-growth', authenticate, (req, res, next) => {
  console.log('📊 [ANALYTICS] Monthly client growth requested with timeRange:', req.query.timeRange);
  console.log('📊 [ANALYTICS] User:', req.user ? req.user.id : 'No user found');
  analyticsController.getMonthlyClientGrowth(req, res, next);
});

// Test endpoint for monthly client growth (no auth for debugging)
router.get('/test-monthly-client-growth', (req, res) => {
  console.log('📊 [ANALYTICS] Test monthly client growth endpoint accessed');
  res.json({ 
    message: 'Monthly client growth endpoint is working',
    timestamp: new Date().toISOString(),
    labels: ['Nov 2025', 'Dec 2025'],
    values: [2, 3],
    totalClients: 5
  });
});

// Individual analytics sections
router.get('/summary', analyticsController.getSummaryData);
router.get('/clients', analyticsController.getClientAnalytics);
router.get('/associates', analyticsController.getAssociateAnalytics);
router.get('/projects', analyticsController.getProjectAnalytics);
router.get('/payments', analyticsController.getPaymentAnalytics);
router.get('/profit-margins', analyticsController.getProfitMarginAnalytics);
router.get('/percentage-config', analyticsController.getPercentageConfigAnalytics);
router.get('/cross-comparisons', analyticsController.getCrossComparisonAnalytics);

// Export endpoints
router.post('/export/chart', analyticsController.exportChartData);
router.get('/export/dashboard', analyticsController.exportDashboardData);

console.log('📊 [ANALYTICS] Analytics routes module loaded successfully');
module.exports = router;