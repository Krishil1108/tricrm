const Client = require('../models/Client');
const Associate = require('../models/Associate');
const FinanceProject = require('../models/FinanceProject');
const { spawn } = require('child_process');
const path = require('path');

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
      case 'status':
        ({ labels, values } = await generateStatusChart(yAxis, aggregation, timeFilter));
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
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filter.createdAt = { $gte: monthStart };
      break;
    case 'quarter':
      const threeMonthsAgo = new Date(now.setMonth(now.getMonth() - 3));
      filter.createdAt = { $gte: threeMonthsAgo };
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
  try {
    let labels = [];
    let values = [];

    switch (yAxis) {
      case 'revenue':
        const revenueData = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            total: { $sum: '$totalAmount' }
          }},
          { $match: { total: { $gt: 0 } } },
          { $sort: { total: -1 } },
          { $limit: 10 }
        ]);
        labels = revenueData.map(item => item.clientName || 'Unknown Client');
        values = revenueData.map(item => item.total || 0);
        break;

      case 'project_count':
        const projectCounts = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            count: { $sum: 1 }
          }},
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        labels = projectCounts.map(item => item.clientName || 'Unknown Client');
        values = projectCounts.map(item => item.count || 0);
        break;

      case 'paid_amount':
        const paidData = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            total: { $sum: '$paidAmount' }
          }},
          { $match: { total: { $gt: 0 } } },
          { $sort: { total: -1 } },
          { $limit: 10 }
        ]);
        labels = paidData.map(item => item.clientName || 'Unknown Client');
        values = paidData.map(item => item.total || 0);
        break;

      case 'pending_amount':
        const pendingData = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $addFields: {
            pendingAmount: { $subtract: [{ $ifNull: ['$totalAmount', 0] }, { $ifNull: ['$paidAmount', 0] }] }
          }},
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            total: { $sum: '$pendingAmount' }
          }},
          { $match: { total: { $gt: 0 } } },
          { $sort: { total: -1 } },
          { $limit: 10 }
        ]);
        labels = pendingData.map(item => item.clientName || 'Unknown Client');
        values = pendingData.map(item => item.total || 0);
        break;

      case 'completion_rate':
        const completionData = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $addFields: {
            completionRate: {
              $cond: [
                { $eq: [{ $ifNull: ['$totalAmount', 0] }, 0] },
                0,
                { $multiply: [{ $divide: [{ $ifNull: ['$paidAmount', 0] }, { $ifNull: ['$totalAmount', 1] }] }, 100] }
              ]
            }
          }},
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            avgCompletion: { $avg: '$completionRate' }
          }},
          { $sort: { avgCompletion: -1 } },
          { $limit: 10 }
        ]);
        labels = completionData.map(item => item.clientName || 'Unknown Client');
        values = completionData.map(item => Math.round(item.avgCompletion || 0));
        break;

      default:
        // Fallback to project count
        const fallbackData = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'clientData' } },
          { $unwind: { path: '$clientData', preserveNullAndEmptyArrays: true } },
          { $group: {
            _id: '$client',
            clientName: { $first: { $ifNull: ['$clientData.company', '$clientData.name'] } },
            count: { $sum: 1 }
          }},
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]);
        labels = fallbackData.map(item => item.clientName || 'Unknown Client');
        values = fallbackData.map(item => item.count || 0);
    }

    // Ensure we have data
    if (labels.length === 0) {
      labels = ['No Data'];
      values = [0];
    }

    return { labels, values };
  } catch (error) {
    console.error('Error generating client chart:', error);
    return { labels: ['No Data'], values: [0] };
  }
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

const generateStatusChart = async (yAxis, aggregation, timeFilter) => {
  try {
    const labels = ['Active', 'Completed', 'Pending', 'On Hold'];
    let values = new Array(4).fill(0);

    switch (yAxis) {
      case 'project_count':
        const statusCounts = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $group: {
            _id: { $ifNull: ['$status', 'Unknown'] },
            count: { $sum: 1 }
          }}
        ]);
        
        statusCounts.forEach(item => {
          const index = labels.findIndex(label => 
            label.toLowerCase() === (item._id || '').toLowerCase()
          );
          if (index !== -1) {
            values[index] = item.count;
          }
        });
        break;

      case 'revenue':
        const statusRevenue = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $group: {
            _id: { $ifNull: ['$status', 'Unknown'] },
            total: { $sum: { $ifNull: ['$totalAmount', 0] } }
          }}
        ]);
        
        statusRevenue.forEach(item => {
          const index = labels.findIndex(label => 
            label.toLowerCase() === (item._id || '').toLowerCase()
          );
          if (index !== -1) {
            values[index] = item.total;
          }
        });
        break;

      default:
        // Fallback to project count
        const fallbackCounts = await FinanceProject.aggregate([
          { $match: timeFilter },
          { $group: {
            _id: { $ifNull: ['$status', 'Unknown'] },
            count: { $sum: 1 }
          }}
        ]);
        
        fallbackCounts.forEach(item => {
          const index = labels.findIndex(label => 
            label.toLowerCase() === (item._id || '').toLowerCase()
          );
          if (index !== -1) {
            values[index] = item.count;
          }
        });
    }

    return { labels, values };
  } catch (error) {
    console.error('Error generating status chart:', error);
    return { labels: ['No Data'], values: [0] };
  }
};

// Python Chart Generation Service
const generatePythonChart = async (chartConfig) => {
  return new Promise((resolve, reject) => {
    try {
      const pythonScriptPath = path.join(__dirname, '..', 'scripts', 'chart_generator.py');
      const python = spawn('python', [pythonScriptPath]);
      
      let stdoutData = '';
      let stderrData = '';
      
      python.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdoutData);
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderrData}`));
        }
      });
      
      // Send data to Python script
      python.stdin.write(JSON.stringify(chartConfig));
      python.stdin.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

// Enhanced Interactive Chart with Python fallback
const generateAdvancedChart = async (req, res) => {
  try {
    const { xAxis, yAxis, aggregation = 'sum', timeRange = 'month', chartType = 'bar', usePython = false } = req.query;

    if (!xAxis || !yAxis) {
      return res.status(400).json({ error: 'Both xAxis and yAxis are required' });
    }

    console.log('📊 [ADVANCED CHART] Generating chart:', { xAxis, yAxis, aggregation, timeRange, chartType, usePython });

    // Get data using existing logic
    let labels = [];
    let values = [];
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
      case 'status':
        ({ labels, values } = await generateStatusChart(yAxis, aggregation, timeFilter));
        break;
      default:
        return res.status(400).json({ error: 'Invalid xAxis value' });
    }

    // If Python generation is requested
    if (usePython === 'true' || usePython === true) {
      try {
        const chartConfig = {
          operation: 'chart',
          labels,
          values,
          chartType,
          title: `${yAxis.replace('_', ' ')} by ${xAxis}`,
          xLabel: xAxis.charAt(0).toUpperCase() + xAxis.slice(1),
          yLabel: yAxis.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        };

        const pythonResult = await generatePythonChart(chartConfig);
        
        if (pythonResult.success) {
          return res.json({
            success: true,
            labels,
            values,
            image: pythonResult.image,
            config: { xAxis, yAxis, aggregation, timeRange, chartType },
            generatedWith: 'python'
          });
        } else {
          console.warn('Python chart generation failed, falling back to JavaScript');
        }
      } catch (pythonError) {
        console.warn('Python chart generation error:', pythonError.message);
      }
    }

    // Default JavaScript response
    res.json({
      success: true,
      labels,
      values,
      config: { xAxis, yAxis, aggregation, timeRange, chartType },
      generatedWith: 'javascript'
    });

  } catch (error) {
    console.error('Error generating advanced chart:', error);
    res.status(500).json({ 
      error: 'Failed to generate chart', 
      message: error.message 
    });
  }
};

module.exports = {
  generateInteractiveChart,
  generateAdvancedChart
};