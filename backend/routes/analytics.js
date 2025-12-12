const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// Middleware to authenticate all analytics routes
router.use(authenticate);

// Filter options endpoints
router.get('/filter-options/clients', analyticsController.getClientOptions);
router.get('/filter-options/projects', analyticsController.getProjectOptions);
router.get('/filter-options/associates', analyticsController.getAssociateOptions);

// Main dashboard data endpoint
router.get('/dashboard', analyticsController.getDashboardData);

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

module.exports = router;