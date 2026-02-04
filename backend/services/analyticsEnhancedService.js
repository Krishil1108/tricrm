const mongoose = require('mongoose');
const Client = require('../models/Client');
const Associate = require('../models/Associate');
const FinanceProject = require('../models/FinanceProject');

class AnalyticsEnhancedService {
  
  // Projects analytics with flexible grouping
  async getProjectsAnalytics({ from, to, groupBy = 'status' }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getProjectsAnalytics called with:', { from, to, groupBy });
      
      const totalProjects = await FinanceProject.countDocuments();
      console.log('📊 [ENHANCED ANALYTICS] Total projects:', totalProjects);
      
      if (totalProjects === 0) {
        return { labels: [], values: [], total: 0, groupBy, from: from || null, to: to || null };
      }

      const match = {};
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }

      let pipeline;
      
      if (groupBy === 'status') {
        // Group by project status
        pipeline = [
          { $match: match },
          { $group: { _id: '$status', value: { $sum: 1 } } },
          { $sort: { value: -1 } }
        ];
      } else if (groupBy === 'client') {
        // Group by client
        pipeline = [
          { $match: match },
          { $lookup: { from: 'clients', localField: 'clientId', foreignField: '_id', as: 'client' } },
          { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
          { $group: { _id: '$client.name', value: { $sum: 1 } } },
          { $sort: { value: -1 } },
          { $limit: 10 }
        ];
      } else {
        // Group by time (day/week/month/quarter/year)
        pipeline = [
          { $match: match },
          { $addFields: { bucket: { $dateTrunc: { date: '$createdAt', unit: groupBy } } } },
          { $group: { _id: '$bucket', value: { $sum: 1 } } },
          { $sort: { _id: 1 } }
        ];
      }

      const rows = await FinanceProject.aggregate(pipeline);
      console.log('📊 [ENHANCED ANALYTICS] Projects aggregation returned', rows.length, 'buckets');

      const labels = rows.map(r => {
        if (r._id instanceof Date) return r._id.toISOString();
        return r._id || 'Unknown';
      });
      const values = rows.map(r => r.value);
      const total = values.reduce((a, b) => a + b, 0);

      return { labels, values, total, groupBy, from: from || null, to: to || null };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getProjectsAnalytics:', error);
      throw error;
    }
  }

  // Revenue analytics over time (based on actual payment dates and totalReceivedFees)
  async getRevenueAnalytics({ from, to, groupBy = 'month' }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getRevenueAnalytics called with:', { from, to, groupBy });
      
      // Strategy: For projects with payments array, use payment dates
      // For projects without payments array but with totalReceivedFees, use createdAt or updatedAt
      
      // First pipeline: Get revenue from individual payments
      const paymentsRevenue = await FinanceProject.aggregate([
        // Only projects with payments array
        { $match: { payments: { $exists: true, $ne: [] } } },
        // Unwind payments
        { $unwind: { path: '$payments' } },
        // Match date range if provided
        {
          $match: {
            ...(from || to ? {
              'payments.date': {
                ...(from && { $gte: new Date(from) }),
                ...(to && { $lte: new Date(to) })
              }
            } : {})
          }
        },
        // Add bucket
        {
          $addFields: {
            bucket: { $dateTrunc: { date: '$payments.date', unit: groupBy } }
          }
        },
        // Group and sum
        {
          $group: {
            _id: '$bucket',
            revenue: { $sum: { $toDouble: '$payments.amount' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Second pipeline: Get revenue from projects without payment details but with totalReceivedFees
      const legacyRevenue = await FinanceProject.aggregate([
        // Only projects without payments array OR empty payments, but with totalReceivedFees > 0
        {
          $match: {
            $or: [
              { payments: { $exists: false } },
              { payments: { $size: 0 } }
            ],
            totalReceivedFees: { $gt: 0 }
          }
        },
        // Use updatedAt as the date for grouping
        {
          $match: {
            ...(from || to ? {
              updatedAt: {
                ...(from && { $gte: new Date(from) }),
                ...(to && { $lte: new Date(to) })
              }
            } : {})
          }
        },
        {
          $addFields: {
            bucket: { $dateTrunc: { date: '$updatedAt', unit: groupBy } }
          }
        },
        {
          $group: {
            _id: '$bucket',
            revenue: { $sum: { $toDouble: '$totalReceivedFees' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      
      // Merge both results
      const mergedMap = new Map();
      
      [...paymentsRevenue, ...legacyRevenue].forEach(item => {
        const key = item._id instanceof Date ? item._id.toISOString() : item._id;
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key);
          existing.revenue += item.revenue;
          existing.count += item.count;
        } else {
          mergedMap.set(key, { ...item });
        }
      });
      
      // Convert map back to array and sort
      const rows = Array.from(mergedMap.values()).sort((a, b) => {
        const dateA = a._id instanceof Date ? a._id : new Date(a._id);
        const dateB = b._id instanceof Date ? b._id : new Date(b._id);
        return dateA - dateB;
      });
      
      console.log('📊 [ENHANCED ANALYTICS] Revenue aggregation returned', rows.length, 'buckets');
      console.log('📊 [ENHANCED ANALYTICS] Payments revenue buckets:', paymentsRevenue.length);
      console.log('📊 [ENHANCED ANALYTICS] Legacy revenue buckets:', legacyRevenue.length);

      const labels = rows.map(r => r._id instanceof Date ? r._id.toISOString() : r._id);
      const values = rows.map(r => Math.round(r.revenue || 0));
      const counts = rows.map(r => r.count);
      const total = values.reduce((a, b) => a + b, 0);

      return { 
        labels, 
        values, 
        counts,
        total, 
        groupBy, 
        from: from || null, 
        to: to || null 
      };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getRevenueAnalytics:', error);
      throw error;
    }
  }

  // Associate performance metrics
  async getAssociatePerformance({ from, to }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getAssociatePerformance called');
      
      const match = {};
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }

      // Get all projects with associate allocations
      const projects = await FinanceProject.find(match)
        .populate('projectAssociates.associateId', 'name')
        .lean();

      const associateMetrics = {};

      projects.forEach(project => {
        const projectValue = parseFloat(project.projectValue) || 0;
        
        if (project.projectAssociates && Array.isArray(project.projectAssociates)) {
          project.projectAssociates.forEach(assoc => {
            const associateId = assoc.associateId?._id?.toString() || 'Unknown';
            const associateName = assoc.associateId?.name || 'Unknown Associate';
            const percentage = parseFloat(assoc.percentage) || 0;
            const allocation = (percentage / 100) * projectValue;

            if (!associateMetrics[associateId]) {
              associateMetrics[associateId] = {
                name: associateName,
                projectCount: 0,
                totalAllocation: 0,
                averagePercentage: 0,
                percentages: []
              };
            }

            associateMetrics[associateId].projectCount++;
            associateMetrics[associateId].totalAllocation += allocation;
            associateMetrics[associateId].percentages.push(percentage);
          });
        }
      });

      // Calculate averages and prepare response
      const associates = Object.values(associateMetrics).map(metric => ({
        name: metric.name,
        projectCount: metric.projectCount,
        totalAllocation: Math.round(metric.totalAllocation),
        averagePercentage: metric.percentages.length > 0 
          ? Math.round((metric.percentages.reduce((a, b) => a + b, 0) / metric.percentages.length) * 10) / 10
          : 0
      }));

      // Sort by total allocation descending
      associates.sort((a, b) => b.totalAllocation - a.totalAllocation);

      const labels = associates.map(a => a.name);
      const values = associates.map(a => a.totalAllocation);
      const projectCounts = associates.map(a => a.projectCount);

      return {
        labels,
        values,
        projectCounts,
        total: values.reduce((a, b) => a + b, 0),
        associates
      };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getAssociatePerformance:', error);
      throw error;
    }
  }

  // Payment status analytics
  async getPaymentAnalytics({ from, to }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getPaymentAnalytics called');
      
      const match = {};
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }

      const projects = await FinanceProject.find(match).lean();

      let totalValue = 0;
      let paidValue = 0;
      let pendingValue = 0;
      let partialValue = 0;

      projects.forEach(project => {
        const value = parseFloat(project.projectValue) || 0;
        totalValue += value;

        const status = (project.paymentStatus || '').toLowerCase();
        if (status === 'paid' || status === 'completed') {
          paidValue += value;
        } else if (status === 'pending' || status === 'unpaid') {
          pendingValue += value;
        } else {
          partialValue += value;
        }
      });

      return {
        labels: ['Paid', 'Pending', 'Partial'],
        values: [
          Math.round(paidValue),
          Math.round(pendingValue),
          Math.round(partialValue)
        ],
        total: Math.round(totalValue),
        percentages: [
          totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0,
          totalValue > 0 ? Math.round((pendingValue / totalValue) * 100) : 0,
          totalValue > 0 ? Math.round((partialValue / totalValue) * 100) : 0
        ]
      };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getPaymentAnalytics:', error);
      throw error;
    }
  }

  // Net Profit analytics over time
  async getNetProfitAnalytics({ from, to, groupBy = 'month' }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getNetProfitAnalytics called with:', { from, to, groupBy });
      
      const match = {};
      if (from || to) {
        match.updatedAt = {};
        if (from) match.updatedAt.$gte = new Date(from);
        if (to) match.updatedAt.$lte = new Date(to);
      }

      const pipeline = [
        { $match: match },
        {
          $addFields: {
            bucket: { $dateTrunc: { date: '$updatedAt', unit: groupBy } },
            totalExpenses: {
              $add: [
                { $ifNull: ['$drawing', 0] },
                { $ifNull: ['$documents', 0] },
                { $ifNull: ['$siteVisit', 0] },
                { $ifNull: ['$marketingAndMisc', 0] },
                { $ifNull: ['$officeManagement', 0] }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$bucket',
            revenue: { $sum: { $toDouble: { $ifNull: ['$totalReceivedFees', 0] } } },
            expenses: { $sum: '$totalExpenses' },
            count: { $sum: 1 }
          }
        },
        {
          $addFields: {
            netProfit: { $subtract: ['$revenue', '$expenses'] }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const rows = await FinanceProject.aggregate(pipeline);
      console.log('📊 [ENHANCED ANALYTICS] Net profit aggregation returned', rows.length, 'buckets');

      const labels = rows.map(r => r._id instanceof Date ? r._id.toISOString() : r._id);
      const values = rows.map(r => Math.round(r.netProfit || 0));
      const revenues = rows.map(r => Math.round(r.revenue || 0));
      const expenses = rows.map(r => Math.round(r.expenses || 0));
      const total = values.reduce((a, b) => a + b, 0);

      return {
        labels,
        values,
        revenues,
        expenses,
        total,
        groupBy,
        from: from || null,
        to: to || null
      };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getNetProfitAnalytics:', error);
      throw error;
    }
  }

  // Expense Distribution analytics over time
  async getExpensesAnalytics({ from, to, groupBy = 'month' }) {
    try {
      console.log('📊 [ENHANCED ANALYTICS] getExpensesAnalytics called with:', { from, to, groupBy });
      
      const match = {};
      if (from || to) {
        match.updatedAt = {};
        if (from) match.updatedAt.$gte = new Date(from);
        if (to) match.updatedAt.$lte = new Date(to);
      }

      const pipeline = [
        { $match: match },
        {
          $addFields: {
            bucket: { $dateTrunc: { date: '$updatedAt', unit: groupBy } }
          }
        },
        {
          $group: {
            _id: '$bucket',
            drawing: { $sum: { $toDouble: { $ifNull: ['$drawing', 0] } } },
            documents: { $sum: { $toDouble: { $ifNull: ['$documents', 0] } } },
            siteVisit: { $sum: { $toDouble: { $ifNull: ['$siteVisit', 0] } } },
            marketingAndMisc: { $sum: { $toDouble: { $ifNull: ['$marketingAndMisc', 0] } } },
            officeManagement: { $sum: { $toDouble: { $ifNull: ['$officeManagement', 0] } } },
            count: { $sum: 1 }
          }
        },
        {
          $addFields: {
            totalExpenses: {
              $add: ['$drawing', '$documents', '$siteVisit', '$marketingAndMisc', '$officeManagement']
            }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const rows = await FinanceProject.aggregate(pipeline);
      console.log('📊 [ENHANCED ANALYTICS] Expenses aggregation returned', rows.length, 'buckets');

      const labels = rows.map(r => r._id instanceof Date ? r._id.toISOString() : r._id);
      const values = rows.map(r => Math.round(r.totalExpenses || 0));
      
      // Breakdown by category
      const breakdown = {
        drawing: rows.map(r => Math.round(r.drawing || 0)),
        documents: rows.map(r => Math.round(r.documents || 0)),
        siteVisit: rows.map(r => Math.round(r.siteVisit || 0)),
        marketingAndMisc: rows.map(r => Math.round(r.marketingAndMisc || 0)),
        officeManagement: rows.map(r => Math.round(r.officeManagement || 0))
      };

      const total = values.reduce((a, b) => a + b, 0);

      return {
        labels,
        values,
        breakdown,
        total,
        groupBy,
        from: from || null,
        to: to || null
      };
    } catch (error) {
      console.error('❌ [ENHANCED ANALYTICS] Error in getExpensesAnalytics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsEnhancedService();
