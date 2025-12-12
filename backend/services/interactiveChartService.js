const Client = require('../models/Client');
const Associate = require('../models/Associate');
const FinanceProject = require('../models/FinanceProject');

const generateInteractiveChart = async (req, res) => {
  try {
    const { xAxis, yAxis, aggregation = 'sum', timeRange = 'month' } = req.query;

    if (!xAxis || !yAxis) {
      return res.status(400).json({ error: 'Both xAxis and yAxis are required' });
    }

    console.log('📊 [INTERACTIVE CHART] Generating chart:', { xAxis, yAxis, aggregation, timeRange });

    let labels = [];
    let values = [];

    // Generate time-based filter
    const timeFilter = generateTimeFilter(timeRange);

    switch (xAxis) {
      case 'client':
        ({ labels, values } = await generateClientChart(yAxis, aggregation, timeFilter));
        break;
      case 'associate':
        ({ labels, values } = await generateAssociateChart(yAxis, aggregation, timeFilter));
        break;
      case 'project':
        ({ labels, values } = await generateProjectChart(yAxis, aggregation, timeFilter));
        break;
      case 'month':
        ({ labels, values } = await generateMonthChart(yAxis, aggregation, timeFilter));
        break;
      case 'quarter':
        ({ labels, values } = await generateQuarterChart(yAxis, aggregation, timeFilter));
        break;
      case 'year':
        ({ labels, values } = await generateYearChart(yAxis, aggregation, timeFilter));
        break;
      case 'status':
        ({ labels, values } = await generateStatusChart(yAxis, aggregation, timeFilter));
        break;
      case 'category':
        ({ labels, values } = await generateCategoryChart(yAxis, aggregation, timeFilter));
        break;
      default:
        return res.status(400).json({ error: 'Invalid xAxis value' });
    }

    console.log('📊 [INTERACTIVE CHART] Generated data:', { labels: labels.length, values: values.length });

    res.json({
      success: true,
      labels,
      values,
      config: { xAxis, yAxis, aggregation, timeRange }
    });

  } catch (error) {
    console.error('❌ [INTERACTIVE CHART] Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate chart data',
      details: error.message 
    });
  }
};

const generateTimeFilter = (timeRange) => {
  const now = new Date();
  const filter = {};

  switch (timeRange) {
    case 'week':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      filter.createdAt = { $gte: weekStart };
      break;
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.createdAt = { $gte: monthStart };
      break;
    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      filter.createdAt = { $gte: quarterStart };
      break;
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filter.createdAt = { $gte: yearStart };
      break;
    case 'all':
    default:
      // No time filter for 'all'
      break;
  }

  return filter;
};

const generateClientChart = async (yAxis, aggregation, timeFilter) => {
  const clients = await Client.find({}).select('name company');
  const labels = clients.map(client => client.company || client.name);
  let values = [];

  switch (yAxis) {
    case 'revenue':
      const revenueData = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
        { $unwind: '$clientData' },
        { $group: {
          _id: '$client',
          clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
          total: { $sum: '$totalAmount' }
        }},
        { $sort: { total: -1 } }
      ]);
      values = revenueData.map(item => item.total);
      break;

    case 'project_count':
      const projectCounts = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
        { $unwind: '$clientData' },
        { $group: {
          _id: '$client',
          clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } }
      ]);
      values = projectCounts.map(item => item.count);
      break;

    case 'paid_amount':
      const paidData = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
        { $unwind: '$clientData' },
        { $group: {
          _id: '$client',
          clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
          total: { $sum: '$paidAmount' }
        }},
        { $sort: { total: -1 } }
      ]);
      values = paidData.map(item => item.total);
      break;

    case 'pending_amount':
      const pendingData = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
        { $unwind: '$clientData' },
        { $group: {
          _id: '$client',
          clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
          total: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } }
        }},
        { $sort: { total: -1 } }
      ]);
      values = pendingData.map(item => item.total);
      break;

    default:
      values = new Array(labels.length).fill(0);
  }

  return { labels: labels.slice(0, 10), values: values.slice(0, 10) }; // Limit to top 10
};

const generateAssociateChart = async (yAxis, aggregation, timeFilter) => {
  const associates = await Associate.find({}).select('name email');
  const labels = associates.map(associate => associate.name);
  let values = [];

  switch (yAxis) {
    case 'project_count':
      const projectCounts = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $unwind: '$associates' },
        { $lookup: { from: 'associates', localField: 'associates.associate', foreignField: '_id', as: 'associateData' } },
        { $unwind: '$associateData' },
        { $group: {
          _id: '$associates.associate',
          associateName: { $first: '$associateData.name' },
          count: { $sum: 1 }
        }},
        { $sort: { count: -1 } }
      ]);
      
      // Map to all associates
      values = associates.map(associate => {
        const found = projectCounts.find(item => item._id.toString() === associate._id.toString());
        return found ? found.count : 0;
      });
      break;

    case 'revenue':
      const revenueData = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $unwind: '$associates' },
        { $lookup: { from: 'associates', localField: 'associates.associate', foreignField: '_id', as: 'associateData' } },
        { $unwind: '$associateData' },
        { $group: {
          _id: '$associates.associate',
          associateName: { $first: '$associateData.name' },
          total: { $sum: { $multiply: ['$totalAmount', { $divide: ['$associates.percentage', 100] }] } }
        }},
        { $sort: { total: -1 } }
      ]);
      
      values = associates.map(associate => {
        const found = revenueData.find(item => item._id.toString() === associate._id.toString());
        return found ? found.total : 0;
      });
      break;

    default:
      values = new Array(labels.length).fill(0);
  }

  return { labels: labels.slice(0, 10), values: values.slice(0, 10) };
};

const generateProjectChart = async (yAxis, aggregation, timeFilter) => {
  const projects = await FinanceProject.find(timeFilter).select('projectName totalAmount paidAmount status').limit(15);
  const labels = projects.map(project => project.projectName || `Project ${project._id.toString().slice(-6)}`);
  let values = [];

  switch (yAxis) {
    case 'revenue':
      values = projects.map(project => project.totalAmount || 0);
      break;
    case 'paid_amount':
      values = projects.map(project => project.paidAmount || 0);
      break;
    case 'pending_amount':
      values = projects.map(project => (project.totalAmount || 0) - (project.paidAmount || 0));
      break;
    case 'completion_rate':
      values = projects.map(project => {
        if (project.totalAmount === 0) return 0;
        return ((project.paidAmount || 0) / project.totalAmount) * 100;
      });
      break;
    default:
      values = new Array(labels.length).fill(0);
  }

  return { labels, values };
};

const generateMonthChart = async (yAxis, aggregation, timeFilter) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const labels = months;
  let values = new Array(12).fill(0);

  switch (yAxis) {
    case 'revenue':
      const monthlyRevenue = await FinanceProject.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }},
        { $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$totalAmount' }
        }}
      ]);
      
      monthlyRevenue.forEach(item => {
        values[item._id - 1] = item.total;
      });
      break;

    case 'project_count':
      const monthlyProjects = await FinanceProject.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }},
        { $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }}
      ]);
      
      monthlyProjects.forEach(item => {
        values[item._id - 1] = item.count;
      });
      break;

    default:
      values = new Array(12).fill(0);
  }

  return { labels, values };
};

const generateQuarterChart = async (yAxis, aggregation, timeFilter) => {
  const labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentYear = new Date().getFullYear();
  let values = new Array(4).fill(0);

  switch (yAxis) {
    case 'revenue':
      const quarterlyRevenue = await FinanceProject.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }},
        { $group: {
          _id: { 
            quarter: { 
              $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
            }
          },
          total: { $sum: '$totalAmount' }
        }}
      ]);
      
      quarterlyRevenue.forEach(item => {
        values[item._id.quarter - 1] = item.total;
      });
      break;

    case 'project_count':
      const quarterlyProjects = await FinanceProject.aggregate([
        { $match: { 
          createdAt: { 
            $gte: new Date(currentYear, 0, 1),
            $lte: new Date(currentYear, 11, 31)
          }
        }},
        { $group: {
          _id: { 
            quarter: { 
              $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
            }
          },
          count: { $sum: 1 }
        }}
      ]);
      
      quarterlyProjects.forEach(item => {
        values[item._id.quarter - 1] = item.count;
      });
      break;

    default:
      values = new Array(4).fill(0);
  }

  return { labels, values };
};

const generateYearChart = async (yAxis, aggregation, timeFilter) => {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];
  const labels = years.map(year => year.toString());
  let values = new Array(3).fill(0);

  switch (yAxis) {
    case 'revenue':
      const yearlyRevenue = await FinanceProject.aggregate([
        { $group: {
          _id: { $year: '$createdAt' },
          total: { $sum: '$totalAmount' }
        }}
      ]);
      
      yearlyRevenue.forEach(item => {
        const index = years.indexOf(item._id);
        if (index !== -1) {
          values[index] = item.total;
        }
      });
      break;

    case 'project_count':
      const yearlyProjects = await FinanceProject.aggregate([
        { $group: {
          _id: { $year: '$createdAt' },
          count: { $sum: 1 }
        }}
      ]);
      
      yearlyProjects.forEach(item => {
        const index = years.indexOf(item._id);
        if (index !== -1) {
          values[index] = item.count;
        }
      });
      break;

    default:
      values = new Array(3).fill(0);
  }

  return { labels, values };
};

const generateStatusChart = async (yAxis, aggregation, timeFilter) => {
  const labels = ['Active', 'Completed', 'Pending', 'Cancelled'];
  let values = new Array(4).fill(0);

  switch (yAxis) {
    case 'project_count':
      const statusCounts = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]);
      
      statusCounts.forEach(item => {
        const index = labels.indexOf(item._id);
        if (index !== -1) {
          values[index] = item.count;
        }
      });
      break;

    case 'revenue':
      const statusRevenue = await FinanceProject.aggregate([
        { $match: timeFilter },
        { $group: {
          _id: '$status',
          total: { $sum: '$totalAmount' }
        }}
      ]);
      
      statusRevenue.forEach(item => {
        const index = labels.indexOf(item._id);
        if (index !== -1) {
          values[index] = item.total;
        }
      });
      break;

    default:
      values = new Array(4).fill(0);
  }

  return { labels, values };
};

const generateCategoryChart = async (yAxis, aggregation, timeFilter) => {
  const labels = ['Web Development', 'Mobile App', 'Design', 'Consulting', 'Other'];
  let values = new Array(5).fill(0);

  // This is a placeholder - you can enhance this based on actual project categories
  switch (yAxis) {
    case 'project_count':
      // For now, distribute projects randomly across categories
      const totalProjects = await FinanceProject.countDocuments(timeFilter);
      values = [
        Math.floor(totalProjects * 0.4), // Web Development
        Math.floor(totalProjects * 0.25), // Mobile App
        Math.floor(totalProjects * 0.15), // Design
        Math.floor(totalProjects * 0.1), // Consulting
        Math.floor(totalProjects * 0.1)  // Other
      ];
      break;

    default:
      values = new Array(5).fill(0);
  }

  return { labels, values };
};

module.exports = {
  generateInteractiveChart
};