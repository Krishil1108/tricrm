const analyticsService = require('../services/analyticsService');

console.log('📊 [ANALYTICS CONTROLLER] Loading analytics controller...');

class AnalyticsController {
  
  // Get filter options for dropdowns
  async getClientOptions(req, res) {
    console.log('📊 [ANALYTICS CONTROLLER] getClientOptions called');
    try {
      const clients = await analyticsService.getClientOptions();
      console.log(`📊 [ANALYTICS CONTROLLER] Retrieved ${clients.length} clients`);
      res.json(clients);
    } catch (error) {
      console.error('❌ [ANALYTICS CONTROLLER] Error fetching client options:', error);
      res.status(500).json({ error: 'Failed to fetch client options', details: error.message });
    }
  }

  async getProjectOptions(req, res) {
    console.log('📊 [ANALYTICS CONTROLLER] getProjectOptions called');
    try {
      const projects = await analyticsService.getProjectOptions();
      console.log(`📊 [ANALYTICS CONTROLLER] Retrieved ${projects.length} projects`);
      res.json(projects);
    } catch (error) {
      console.error('❌ [ANALYTICS CONTROLLER] Error fetching project options:', error);
      res.status(500).json({ error: 'Failed to fetch project options', details: error.message });
    }
  }
      console.error('Error fetching project options:', error);
      res.status(500).json({ error: 'Failed to fetch project options' });
    }
  }

  async getAssociateOptions(req, res) {
    try {
      const associates = await analyticsService.getAssociateOptions();
      res.json(associates);
    } catch (error) {
      console.error('Error fetching associate options:', error);
      res.status(500).json({ error: 'Failed to fetch associate options' });
    }
  }

  // Main dashboard data
  async getDashboardData(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const dashboardData = await analyticsService.getDashboardData(filters);
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // Individual section data
  async getSummaryData(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const summaryData = await analyticsService.getSummaryData(filters);
      res.json(summaryData);
    } catch (error) {
      console.error('Error fetching summary data:', error);
      res.status(500).json({ error: 'Failed to fetch summary data' });
    }
  }

  async getClientAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const clientAnalytics = await analyticsService.getClientAnalytics(filters);
      res.json(clientAnalytics);
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      res.status(500).json({ error: 'Failed to fetch client analytics' });
    }
  }

  async getAssociateAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const associateAnalytics = await analyticsService.getAssociateAnalytics(filters);
      res.json(associateAnalytics);
    } catch (error) {
      console.error('Error fetching associate analytics:', error);
      res.status(500).json({ error: 'Failed to fetch associate analytics' });
    }
  }

  async getProjectAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const projectAnalytics = await analyticsService.getProjectAnalytics(filters);
      res.json(projectAnalytics);
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      res.status(500).json({ error: 'Failed to fetch project analytics' });
    }
  }

  async getPaymentAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const paymentAnalytics = await analyticsService.getPaymentAnalytics(filters);
      res.json(paymentAnalytics);
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      res.status(500).json({ error: 'Failed to fetch payment analytics' });
    }
  }

  async getProfitMarginAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const profitMarginAnalytics = await analyticsService.getProfitMarginAnalytics(filters);
      res.json(profitMarginAnalytics);
    } catch (error) {
      console.error('Error fetching profit margin analytics:', error);
      res.status(500).json({ error: 'Failed to fetch profit margin analytics' });
    }
  }

  async getPercentageConfigAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const percentageConfigAnalytics = await analyticsService.getPercentageConfigAnalytics(filters);
      res.json(percentageConfigAnalytics);
    } catch (error) {
      console.error('Error fetching percentage config analytics:', error);
      res.status(500).json({ error: 'Failed to fetch percentage config analytics' });
    }
  }

  async getCrossComparisonAnalytics(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const crossComparisonAnalytics = await analyticsService.getCrossComparisonAnalytics(filters);
      res.json(crossComparisonAnalytics);
    } catch (error) {
      console.error('Error fetching cross comparison analytics:', error);
      res.status(500).json({ error: 'Failed to fetch cross comparison analytics' });
    }
  }

  // Export functionality
  async exportChartData(req, res) {
    try {
      const { chartType, format, filters } = req.body;
      const filterParams = this.extractFilters(filters);
      const exportData = await analyticsService.exportChartData(chartType, format, filterParams);
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting chart data:', error);
      res.status(500).json({ error: 'Failed to export chart data' });
    }
  }

  async exportDashboardData(req, res) {
    try {
      const filters = this.extractFilters(req.query);
      const { format = 'xlsx' } = req.query;
      const exportData = await analyticsService.exportDashboardData(filters, format);
      
      res.setHeader('Content-Disposition', `attachment; filename=dashboard-export.${format}`);
      res.setHeader('Content-Type', format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf');
      res.send(exportData);
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      res.status(500).json({ error: 'Failed to export dashboard data' });
    }
  }

  // Helper method to extract and validate filters
  extractFilters(query) {
    const {
      dateRange = 'month',
      startDate,
      endDate,
      clientIds,
      projectIds,
      associateIds,
      status = 'all'
    } = query;

    // Parse comma-separated IDs
    const parseIds = (idString) => {
      if (!idString) return [];
      return idString.split(',').filter(Boolean);
    };

    // Calculate date range if not custom
    let filterStartDate = startDate;
    let filterEndDate = endDate;

    if (dateRange !== 'custom') {
      const now = new Date();
      filterEndDate = now.toISOString().split('T')[0];

      switch (dateRange) {
        case 'today':
          filterStartDate = filterEndDate;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filterStartDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          filterStartDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          filterStartDate = yearAgo.toISOString().split('T')[0];
          break;
        default:
          // Default to last month
          const defaultDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          filterStartDate = defaultDate.toISOString().split('T')[0];
      }
    }

    return {
      dateRange,
      startDate: filterStartDate,
      endDate: filterEndDate,
      clientIds: parseIds(clientIds),
      projectIds: parseIds(projectIds),
      associateIds: parseIds(associateIds),
      status: status === 'all' ? null : status
    };
  }
}

module.exports = new AnalyticsController();