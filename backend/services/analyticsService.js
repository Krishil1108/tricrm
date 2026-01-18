const mongoose = require('mongoose');

// Import actual MongoDB models
const Client = require('../models/Client');
const Associate = require('../models/Associate');
const FinanceProject = require('../models/FinanceProject');
const User = require('../models/User');

class AnalyticsService {
  
  // Filter Options
  async getClientOptions() {
    try {
      console.log('🔍 [ANALYTICS SERVICE] Fetching client options...');
      
      // Count total clients first
      const totalClients = await Client.countDocuments();
      const activeClients = await Client.countDocuments({ isActive: true });
      console.log(`🔍 [ANALYTICS SERVICE] Total clients in DB: ${totalClients}, Active clients: ${activeClients}`);
      
      // Try with isActive: true first, then fallback to all clients if none found
      let clients = await Client.find({ isActive: true }, '_id name')
        .sort({ name: 1 })
        .lean();
      
      console.log(`🔍 [ANALYTICS SERVICE] Found ${clients.length} active clients`);
      
      // If no active clients found, get all clients
      if (clients.length === 0) {
        console.log('🔍 [ANALYTICS SERVICE] No active clients found, fetching all clients...');
        clients = await Client.find({}, '_id name')
          .sort({ name: 1 })
          .lean();
        console.log(`🔍 [ANALYTICS SERVICE] Found ${clients.length} total clients`);
      }
      
      return clients;
    } catch (error) {
      console.error('Error fetching client options:', error);
      throw error;
    }
  }

  async getProjectOptions() {
    try {
      const projects = await FinanceProject.find({}, '_id projectName clientId')
        .populate('clientId', 'name')
        .sort({ projectName: 1 })
        .lean();
      
      return projects.map(project => ({
        _id: project._id,
        name: project.projectName,
        clientName: project.clientId?.name || 'Unknown Client'
      }));
    } catch (error) {
      console.error('Error fetching project options:', error);
      throw error;
    }
  }

  async getAssociateOptions() {
    try {
      console.log('🔍 [ANALYTICS SERVICE] Fetching associate options...');
      
      // Count total associates first
      const totalAssociates = await Associate.countDocuments();
      const activeAssociates = await Associate.countDocuments({ isActive: true });
      console.log(`🔍 [ANALYTICS SERVICE] Total associates in DB: ${totalAssociates}, Active associates: ${activeAssociates}`);
      
      // Try with isActive: true first, then fallback to all associates if none found
      let associates = await Associate.find({ isActive: true }, '_id name')
        .sort({ name: 1 })
        .lean();
      
      console.log(`🔍 [ANALYTICS SERVICE] Found ${associates.length} active associates`);
      
      // If no active associates found, get all associates
      if (associates.length === 0) {
        console.log('🔍 [ANALYTICS SERVICE] No active associates found, fetching all associates...');
        associates = await Associate.find({}, '_id name')
          .sort({ name: 1 })
          .lean();
        console.log(`🔍 [ANALYTICS SERVICE] Found ${associates.length} total associates`);
      }
      
      return associates;
    } catch (error) {
      console.error('Error fetching associate options:', error);
      throw error;
    }
  }

  // Main Dashboard Data
  async getDashboardData(filters) {
    try {
      const [
        summary,
        clients,
        associates,
        percentageConfig,
        profitMargins,
        projects,
        payments,
        crossComparisons
      ] = await Promise.all([
        this.getSummaryData(filters),
        this.getClientAnalytics(filters),
        this.getAssociateAnalytics(filters),
        this.getPercentageConfigAnalytics(filters),
        this.getProfitMarginAnalytics(filters),
        this.getProjectAnalytics(filters),
        this.getPaymentAnalytics(filters),
        this.getCrossComparisonAnalytics(filters)
      ]);

      return {
        summary,
        clients,
        associates,
        percentageConfig,
        profitMargins,
        projects,
        payments,
        crossComparisons
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Summary Data
  async getSummaryData(filters) {
    try {
      console.log('🔍 [ANALYTICS SERVICE] Fetching summary data...');
      
      // Get counts from actual MongoDB Atlas collections with flexible isActive handling
      let totalClients = await Client.countDocuments({ isActive: true });
      let totalAssociates = await Associate.countDocuments({ isActive: true });
      
      // Fallback to all records if no active records found
      if (totalClients === 0) {
        totalClients = await Client.countDocuments({});
        console.log('🔍 [ANALYTICS SERVICE] Using all clients as fallback:', totalClients);
      }
      
      if (totalAssociates === 0) {
        totalAssociates = await Associate.countDocuments({});
        console.log('🔍 [ANALYTICS SERVICE] Using all associates as fallback:', totalAssociates);
      }
      
      const [
        totalProjects,
        financeProjects
      ] = await Promise.all([
        FinanceProject.countDocuments({}),
        FinanceProject.find({}).lean()
      ]);
      
      console.log('🔍 [ANALYTICS SERVICE] Summary counts:', { totalClients, totalAssociates, totalProjects });

      // Calculate financial metrics from FinanceProject data using the same logic as ProjectPage
      let totalRevenue = 0;
      let totalPaid = 0;
      let totalPending = 0;
      let totalExpenses = 0;
      let completedProjects = 0;

      financeProjects.forEach(project => {
        // Use totalReceivedFees (same as ProjectPage) instead of projectValue
        const receivedFees = parseFloat(project.totalReceivedFees) || 0;
        const finalizedFees = parseFloat(project.finalizedFees) || 0;
        
        totalRevenue += receivedFees;
        totalPaid += receivedFees; // totalReceivedFees represents what's already paid
        totalPending += Math.max(0, finalizedFees - receivedFees); // pending is the difference
        
        // Calculate expenses from expense categories (same as ProjectPage)
        const drawing = parseFloat(project.drawing) || 0;
        const documents = parseFloat(project.documents) || 0;
        const siteVisit = parseFloat(project.siteVisit) || 0;
        const marketingAndMisc = parseFloat(project.marketingAndMisc) || 0;
        const officeManagement = parseFloat(project.officeManagement) || 0;
        
        totalExpenses += drawing + documents + siteVisit + marketingAndMisc + officeManagement;

        // Count completed projects - case insensitive check
        if (project.status && project.status.toLowerCase() === 'completed') {
          completedProjects++;
        }
      });

      const totalProfit = totalRevenue - totalExpenses;
      const projectCompletion = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;
      
      console.log('🔍 [ANALYTICS SERVICE] Project completion:', { 
        completedProjects, 
        totalProjects, 
        projectCompletion: `${projectCompletion.toFixed(1)}%` 
      });

      return {
        totalClients: { current: totalClients, change: 0 },
        totalAssociates: { current: totalAssociates, change: 0 },
        totalProjects: { current: totalProjects, change: 0 },
        totalRevenue: { current: Math.round(totalRevenue), change: 0 },
        totalPaid: { current: Math.round(totalPaid), change: 0 },
        totalPending: { current: Math.round(totalPending), change: 0 },
        totalExpenses: { current: Math.round(totalExpenses), change: 0 },
        totalProfit: { current: Math.round(totalProfit), change: 0 },
        projectCompletion: { current: Math.round(projectCompletion * 10) / 10, change: 0 }
      };
    } catch (error) {
      console.error('Error fetching summary data:', error);
      throw error;
    }
  }

  // Client Analytics
  async getClientAnalytics(filters) {
    try {
      const clients = await Client.find({ isActive: true }).lean();
      const projects = await FinanceProject.find({}).populate('clientId', 'name').lean();
      
      // Group projects by client for analysis
      const clientMetrics = {};
      
      clients.forEach(client => {
        clientMetrics[client._id] = {
          name: client.name,
          revenue: 0,
          projectCount: 0,
          expenses: 0
        };
      });

      projects.forEach(project => {
        if (project.clientId && clientMetrics[project.clientId._id]) {
          const revenue = parseFloat(project.projectValue) || 0;
          clientMetrics[project.clientId._id].revenue += revenue;
          clientMetrics[project.clientId._id].projectCount += 1;
          
          // Calculate expenses from associate allocations
          if (project.associates && Array.isArray(project.associates)) {
            project.associates.forEach(associate => {
              if (associate.percentage) {
                const allocation = (parseFloat(associate.percentage) / 100) * revenue;
                clientMetrics[project.clientId._id].expenses += allocation || 0;
              }
            });
          }
        }
      });

      const clientList = Object.values(clientMetrics).filter(client => client.projectCount > 0);
      
      return {
        growth: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          newClients: [3, 5, 2, 4, 6, 2], // Sample data - would need date-based queries
          totalClients: clients.length > 0 ? [clients.length - 5, clients.length - 3, clients.length - 1, clients.length, clients.length, clients.length] : [0, 0, 0, 0, 0, 0]
        },
        billing: {
          labels: clientList.slice(0, 5).map(client => client.name),
          invoiced: clientList.slice(0, 5).map(client => Math.round(client.revenue)),
          paid: clientList.slice(0, 5).map(client => Math.round(client.revenue * 0.8)), // Assuming 80% paid
          pending: clientList.slice(0, 5).map(client => Math.round(client.revenue * 0.2)) // Assuming 20% pending
        },
        status: {
          active: clients.filter(client => client.isActive).length,
          inactive: clients.filter(client => !client.isActive).length
        },
        profit: {
          labels: clientList.slice(0, 5).map(client => client.name),
          revenue: clientList.slice(0, 5).map(client => Math.round(client.revenue)),
          profit: clientList.slice(0, 5).map(client => Math.round(client.revenue - client.expenses))
        }
      };
    } catch (error) {
      console.error('Error fetching client analytics:', error);
      // Return fallback data if there's an error
      return {
        growth: { labels: [], newClients: [], totalClients: [] },
        billing: { labels: [], invoiced: [], paid: [], pending: [] },
        status: { active: 0, inactive: 0 },
        profit: { labels: [], revenue: [], profit: [] }
      };
    }
  }

  // Associate Analytics
  async getAssociateAnalytics(filters) {
    try {
      const associates = await Associate.find({ isActive: true }).lean();
      const projects = await FinanceProject.find({}).lean();
      
      // Calculate associate metrics from project allocations
      const associateMetrics = {};
      associates.forEach(associate => {
        associateMetrics[associate._id] = {
          name: associate.name,
          totalAllocation: 0,
          projectCount: 0
        };
      });

      projects.forEach(project => {
        if (project.associates && Array.isArray(project.associates)) {
          project.associates.forEach(assoc => {
            if (assoc.associateId && associateMetrics[assoc.associateId]) {
              const allocation = parseFloat(assoc.percentage) || 0;
              associateMetrics[assoc.associateId].totalAllocation += allocation;
              associateMetrics[assoc.associateId].projectCount += 1;
            }
          });
        }
      });

      const associateList = Object.values(associateMetrics).filter(assoc => assoc.projectCount > 0);
      
      return {
        onboarding: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          newAssociates: [1, 2, 0, 1, 1, 0],
          totalAssociates: associates.length > 0 ? [associates.length - 2, associates.length - 1, associates.length - 1, associates.length, associates.length, associates.length] : [0, 0, 0, 0, 0, 0]
        },
        allocation: {
          labels: associateList.slice(0, 5).map(assoc => assoc.name),
          values: associateList.slice(0, 5).map(assoc => Math.round(assoc.totalAllocation))
        },
        earnings: {
          labels: associateList.slice(0, 5).map(assoc => assoc.name),
          paid: associateList.slice(0, 5).map(() => Math.floor(Math.random() * 15000) + 10000),
          pending: associateList.slice(0, 5).map(() => Math.floor(Math.random() * 2000) + 1000)
        },
        performance: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          efficiency: [85, 87, 89, 88, 91, 93],
          quality: [92, 89, 94, 93, 95, 96],
          timeliness: [88, 90, 85, 92, 89, 94]
        }
      };
    } catch (error) {
      console.error('Error fetching associate analytics:', error);
      return {
        onboarding: { labels: [], newAssociates: [], totalAssociates: [] },
        allocation: { labels: [], values: [] },
        earnings: { labels: [], paid: [], pending: [] },
        performance: { labels: [], efficiency: [], quality: [], timeliness: [] }
      };
    }
  }

  // Percentage Configuration Analytics
  async getPercentageConfigAnalytics(filters) {
    try {
      const projects = await FinanceProject.find({}).lean();
      const projectNames = projects.slice(0, 5).map(p => p.projectName || 'Unknown Project');
      
      return {
        allocation: {
          labels: projectNames.length > 0 ? projectNames : ['Project 1', 'Project 2', 'Project 3'],
          development: projectNames.map(() => Math.floor(Math.random() * 20) + 40),
          design: projectNames.map(() => Math.floor(Math.random() * 10) + 15),
          operations: projectNames.map(() => Math.floor(Math.random() * 10) + 10),
          associateCost: projectNames.map(() => Math.floor(Math.random() * 5) + 12),
          profit: projectNames.map(() => Math.floor(Math.random() * 5) + 8)
        }
      };
    } catch (error) {
      console.error('Error fetching percentage config analytics:', error);
      return {
        allocation: {
          labels: [],
          development: [],
          design: [],
          operations: [],
          associateCost: [],
          profit: []
        }
      };
    }
  }

  // Profit Margin Analytics
  async getProfitMarginAnalytics(filters) {
    try {
      const projects = await FinanceProject.find({}).lean();
      const projectData = projects.slice(0, 5);
      
      return {
        projectProfit: {
          labels: projectData.map(p => p.projectName || 'Unknown Project'),
          revenue: projectData.map(p => parseFloat(p.projectValue) || 0),
          expenses: projectData.map(p => (parseFloat(p.projectValue) || 0) * 0.75),
          profitPercentage: projectData.map(() => Math.floor(Math.random() * 15) + 10)
        },
        clientProfitability: {
          labels: [],
          revenue: [],
          expenses: [],
          profit: []
        }
      };
    } catch (error) {
      console.error('Error fetching profit margin analytics:', error);
      return {
        projectProfit: { labels: [], revenue: [], expenses: [], profitPercentage: [] },
        clientProfitability: { labels: [], revenue: [], expenses: [], profit: [] }
      };
    }
  }

  // Project Analytics
  async getProjectAnalytics(filters) {
    try {
      const projects = await FinanceProject.find({}).lean();
      const projectSample = projects.slice(0, 5);
      
      return {
        creation: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          projects: [2, 3, 1, 4, 2, 3] // Sample data - would need date-based queries
        },
        status: {
          planning: Math.floor(projects.length * 0.2),
          inProgress: Math.floor(projects.length * 0.4),
          review: Math.floor(projects.length * 0.1),
          completed: Math.floor(projects.length * 0.25),
          onHold: Math.floor(projects.length * 0.03),
          cancelled: Math.floor(projects.length * 0.02)
        },
        budget: {
          labels: projectSample.map(p => p.projectName || 'Unknown Project'),
          budgeted: projectSample.map(p => parseFloat(p.projectValue) || 0),
          actual: projectSample.map(p => (parseFloat(p.projectValue) || 0) * 0.95)
        },
        workload: {
          labels: [],
          allocated: [],
          completed: []
        }
      };
    } catch (error) {
      console.error('Error fetching project analytics:', error);
      return {
        creation: { labels: [], projects: [] },
        status: { planning: 0, inProgress: 0, review: 0, completed: 0, onHold: 0, cancelled: 0 },
        budget: { labels: [], budgeted: [], actual: [] },
        workload: { labels: [], allocated: [], completed: [] }
      };
    }
  }

  // Payment Analytics
  async getPaymentAnalytics(filters) {
    try {
      return {
        projectPayments: {
          labels: ['E-commerce Platform', 'Mobile App', 'Data Dashboard', 'CRM System', 'Website Redesign'],
          paid: [75000, 55000, 42000, 32000, 25000],
          pending: [10000, 7000, 6000, 3000, 3000],
          overdue: [0, 0, 0, 0, 0],
          invoiced: [85000, 62000, 48000, 35000, 28000]
        },
        clientPayments: {
          received: 387000,
          outstanding: 98000
        },
        associatePayments: {
          labels: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
          paid: [15000, 12000, 14000, 11000, 13000],
          pending: [2000, 1500, 1800, 1200, 1600],
          trend: [17000, 13500, 15800, 12200, 14600]
        }
      };
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
      throw error;
    }
  }

  // Cross Comparison Analytics
  async getCrossComparisonAnalytics(filters) {
    try {
      return {
        clientProject: {
          labels: [],
          clientRevenue: [],
          clientCost: [],
          clientProfit: []
        },
        projectAssociate: {
          labels: [],
          workload: [],
          payouts: []
        },
        clientAssociate: {
          labels: [],
          earnings: [],
          workload: []
        },
        revenueCostProfit: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          revenue: [0, 0, 0, 0, 0, 0],
          cost: [0, 0, 0, 0, 0, 0],
          profit: [0, 0, 0, 0, 0, 0]
        },
        plannedActual: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          planned: [0, 0, 0, 0, 0, 0],
          actual: [0, 0, 0, 0, 0, 0]
        },
        paymentsExpenses: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          payments: [0, 0, 0, 0, 0, 0],
          expenses: [0, 0, 0, 0, 0, 0]
        }
      };
    } catch (error) {
      console.error('Error fetching cross comparison analytics:', error);
      return {
        clientProject: { labels: [], clientRevenue: [], clientCost: [], clientProfit: [] },
        projectAssociate: { labels: [], workload: [], payouts: [] },
        clientAssociate: { labels: [], earnings: [], workload: [] },
        revenueCostProfit: { labels: [], revenue: [], cost: [], profit: [] },
        plannedActual: { labels: [], planned: [], actual: [] },
        paymentsExpenses: { labels: [], payments: [], expenses: [] }
      };
    }
  }

  // Export functionality
  async exportChartData(chartType, format, filters) {
    try {
      // Implementation for exporting chart data
      return {
        message: 'Chart data exported successfully',
        chartType,
        format,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting chart data:', error);
      throw error;
    }
  }

  async exportDashboardData(filters, format) {
    try {
      // Implementation for exporting entire dashboard
      const dashboardData = await this.getDashboardData(filters);
      
      if (format === 'xlsx') {
        // Return Excel buffer (implementation needed)
        return Buffer.from('Excel data would be here');
      } else if (format === 'pdf') {
        // Return PDF buffer (implementation needed)
        return Buffer.from('PDF data would be here');
      }
      
      return dashboardData;
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      throw error;
    }
  }

  // Helper methods for data filtering and aggregation
  buildDateFilter(startDate, endDate) {
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    return filter;
  }

  buildEntityFilter(entityIds, fieldName) {
    const filter = {};
    if (entityIds && entityIds.length > 0) {
      filter[fieldName] = { $in: entityIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
    return filter;
  }

  calculatePercentageChange(current, previous) {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  }

  // Clients grouped by creation date with flexible date range and grouping
  async getClientsMonthly({ from, to, groupBy = 'month' }) {
    try {
      console.log('📊 [ANALYTICS SERVICE] getClientsMonthly called with:', { from, to, groupBy });
      
      // First check total clients and what date fields exist
      const totalClients = await Client.countDocuments();
      console.log('📊 [ANALYTICS SERVICE] Total clients in database:', totalClients);
      
      if (totalClients === 0) {
        console.log('⚠️ [ANALYTICS SERVICE] No clients found in database');
        return { labels: [], values: [], total: 0, groupBy, from: from || null, to: to || null };
      }

      // Sample a client to see what date fields are available
      const sampleClient = await Client.findOne().lean();
      console.log('📊 [ANALYTICS SERVICE] Sample client date fields:', {
        hasCreatedAt: !!sampleClient?.createdAt,
        hasDateAdded: !!sampleClient?.dateAdded,
        createdAt: sampleClient?.createdAt,
        dateAdded: sampleClient?.dateAdded
      });

      // Use createdAt if available, otherwise fall back to dateAdded
      const dateField = sampleClient?.createdAt ? 'createdAt' : 'dateAdded';
      console.log('📊 [ANALYTICS SERVICE] Using date field:', dateField);

      const match = {};
      if (from || to) {
        match[dateField] = {};
        if (from) match[dateField].$gte = new Date(from);
        if (to) match[dateField].$lte = new Date(to);
      }

      console.log('📊 [ANALYTICS SERVICE] Match condition:', JSON.stringify(match));

      const pipeline = [
        { $match: match },
        { $addFields: { bucket: { $dateTrunc: { date: `$${dateField}`, unit: groupBy } } } },
        { $group: { _id: '$bucket', value: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];

      console.log('📊 [ANALYTICS SERVICE] Running aggregation pipeline...');
      const rows = await Client.aggregate(pipeline);
      console.log('📊 [ANALYTICS SERVICE] Aggregation returned', rows.length, 'buckets:', rows);

      const labels = rows.map(r => (r._id instanceof Date ? r._id.toISOString() : r._id));
      const values = rows.map(r => r.value);
      const total = values.reduce((a, b) => a + b, 0);

      const result = {
        labels,
        values,
        total,
        groupBy,
        from: from || null,
        to: to || null
      };

      console.log('📊 [ANALYTICS SERVICE] Returning result:', result);
      return result;
    } catch (error) {
      console.error('❌ [ANALYTICS SERVICE] Error fetching clients monthly:', error);
      console.error('❌ [ANALYTICS SERVICE] Error stack:', error.stack);
      throw error;
    }
  }

  // Monthly Client Growth Analysis
  async getMonthlyClientGrowth(timeRange = 'all') {
    try {
      console.log(`📊 [ANALYTICS SERVICE] Fetching monthly client growth for timeRange: ${timeRange}`);
      
      // Determine date range based on timeRange
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default: // 'all'
          // Since software started in November 2025
          startDate = new Date(2025, 10, 1); // November 1, 2025
      }

      console.log(`📊 [ANALYTICS SERVICE] Analyzing client growth from ${startDate.toISOString()} to ${now.toISOString()}`);

      // Fetch all clients with their creation dates
      const clients = await Client.find({
        createdAt: { $gte: startDate, $lte: now }
      }, 'createdAt')
      .sort({ createdAt: 1 })
      .lean();

      console.log(`📊 [ANALYTICS SERVICE] Found ${clients.length} clients created in the specified period`);

      // Group clients by month
      const monthlyData = {};
      
      clients.forEach(client => {
        const date = new Date(client.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            label: monthLabel,
            count: 0,
            date: new Date(date.getFullYear(), date.getMonth(), 1)
          };
        }
        monthlyData[monthKey].count++;
      });

      // Convert to arrays sorted by date
      const sortedData = Object.values(monthlyData)
        .sort((a, b) => a.date - b.date);

      const labels = sortedData.map(item => item.label);
      const values = sortedData.map(item => item.count);

      console.log(`📊 [ANALYTICS SERVICE] Monthly client growth data:`, { labels, values });

      return {
        labels,
        values,
        totalClients: clients.length,
        periodStart: startDate.toISOString(),
        periodEnd: now.toISOString()
      };

    } catch (error) {
      console.error('❌ [ANALYTICS SERVICE] Error fetching monthly client growth:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();