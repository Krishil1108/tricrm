const express = require('express');
const router = express.Router();
// NOTE: authenticate is applied at the app.use() level in server.js for all /api/analytics routes.
// Do NOT apply it again here — that caused double JWT verification (2 DB lookups per request).
const analyticsController = require('../controllers/analyticsController');

const isDev = process.env.NODE_ENV !== 'production';

const allowDebugEndpoint = (req, res, next) => {
  if (isDev) return next();
  return res.status(404).json({ success: false, message: 'Endpoint not found' });
};

// ─── Dev-only debug endpoints (no auth — only reachable in development) ───────

router.get('/test', allowDebugEndpoint, (req, res) => {
  res.json({ 
    message: 'Analytics test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/health', allowDebugEndpoint, (req, res) => {
  res.json({ 
    status: 'Analytics routes are working',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/analytics/filter-options/clients',
      '/api/analytics/filter-options/projects',
      '/api/analytics/filter-options/associates',
      '/api/analytics/dashboard',
      '/api/analytics/monthly-client-growth'
    ]
  });
});

router.get('/debug-routes', allowDebugEndpoint, (req, res) => {
  res.json({
    message: 'Analytics routes debug info',
    registeredRoutes: router.stack.map(layer => ({
      method: layer.route ? Object.keys(layer.route.methods)[0].toUpperCase() : 'MIDDLEWARE',
      path: layer.route ? layer.route.path : 'N/A'
    })),
    controllerMethods: Object.getOwnPropertyNames(analyticsController).filter(
      name => typeof analyticsController[name] === 'function'
    ),
    timestamp: new Date().toISOString()
  });
});

// ─── All routes below are already protected by authenticate in server.js ──────

const { cacheMiddleware } = require('../utils/cache');

// Filter options (cached 120s)
router.get('/filter-options',            cacheMiddleware(120, 'analytics_filters'), analyticsController.getCombinedFilterOptions);
router.get('/filter-options/clients',    cacheMiddleware(120, 'analytics_filters'), analyticsController.getClientOptions);
router.get('/filter-options/projects',   cacheMiddleware(120, 'analytics_filters'), analyticsController.getProjectOptions);
router.get('/filter-options/associates', cacheMiddleware(120, 'analytics_filters'), analyticsController.getAssociateOptions);

// Main dashboard data (cached 30s)
router.get('/dashboard',         cacheMiddleware(30, 'analytics_dashboard'), analyticsController.getDashboardData);
router.get('/interactive-chart', cacheMiddleware(30, 'analytics_chart'),     analyticsController.getInteractiveChart);

// Clients
router.get('/clients/monthly',   analyticsController.getClientsMonthly);

// Enhanced analytics
router.get('/projects/analytics',           analyticsController.getProjectsAnalytics);
router.get('/revenue/analytics',            analyticsController.getRevenueAnalytics);
router.get('/associates/performance',       analyticsController.getAssociatePerformance);
router.get('/payments/analytics',           analyticsController.getPaymentAnalytics);
router.get('/netprofit/analytics',          analyticsController.getNetProfitAnalytics);
router.get('/expenses/analytics',           analyticsController.getExpensesAnalytics);
router.get('/expenses/estimated-vs-actual', analyticsController.getEstimatedVsActualExpenses);
router.get('/advanced-chart',               analyticsController.getAdvancedChart);
router.get('/monthly-client-growth',        analyticsController.getMonthlyClientGrowth);

// Test endpoint (dev only)
router.get('/test-monthly-client-growth', allowDebugEndpoint, (req, res) => {
  res.json({ 
    message: 'Monthly client growth endpoint is working',
    timestamp: new Date().toISOString(),
    labels: ['Nov 2025', 'Dec 2025'],
    values: [2, 3],
    totalClients: 5
  });
});

// Individual analytics sections
router.get('/summary',            analyticsController.getSummaryData);
router.get('/clients',            analyticsController.getClientAnalytics);
router.get('/associates',         analyticsController.getAssociateAnalytics);
router.get('/projects',           analyticsController.getProjectAnalytics);
router.get('/payments',           analyticsController.getPaymentAnalytics);
router.get('/profit-margins',     analyticsController.getProfitMarginAnalytics);
router.get('/percentage-config',  analyticsController.getPercentageConfigAnalytics);
router.get('/cross-comparisons',  analyticsController.getCrossComparisonAnalytics);

// Export endpoints
router.post('/export/chart',      analyticsController.exportChartData);
router.get('/export/dashboard',   analyticsController.exportDashboardData);

module.exports = router;