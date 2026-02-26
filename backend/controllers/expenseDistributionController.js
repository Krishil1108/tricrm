const FinanceProject = require('../models/FinanceProject');
const Client = require('../models/Client');

/**
 * Get comprehensive expense distribution data
 * Returns summary, project-level, and client-level expense breakdowns
 */
const getExpenseDistribution = async (req, res) => {
  try {
    // Get all projects with populated client data
    // Include payments and percentage fields so we can compute expenses per-payment (matching YearlyDistributionTable)
    const projects = await FinanceProject.find()
      .populate('clientId', 'name')
      .select('projectNumber projectName clientId projectAssociates payments drawingPercent documentsPercent siteVisitPercent marketingAndMiscPercent officeManagementPercent')
      .lean();

    // Initialize summary totals
    const summary = {
      drawing: 0,
      documents: 0,
      siteVisit: 0,
      marketingAndMisc: 0,
      officeManagement: 0,
      customFields: {}
    };

    // Initialize client aggregation map
    const clientMap = new Map();

    // Process each project
    const processedProjects = projects.map(project => {
      // Compute expenses by summing per-payment distributions (matches YearlyDistributionTable exactly)
      const totalAssociatePercent = project.projectAssociates && project.projectAssociates.length > 0
        ? project.projectAssociates.reduce((sum, assoc) => sum + (assoc.percentage || 0), 0)
        : 0;

      let drawing = 0, documents = 0, siteVisit = 0, marketingAndMisc = 0, officeManagement = 0;
      if (project.payments && project.payments.length > 0) {
        project.payments.forEach(payment => {
          const amount = payment.amount || 0;
          const assocShare = Math.floor((amount * totalAssociatePercent) / 100);
          const amountAfterAssociate = amount - assocShare;
          drawing       += Math.floor((amountAfterAssociate * (project.drawingPercent || 0)) / 100);
          documents     += Math.floor((amountAfterAssociate * (project.documentsPercent || 0)) / 100);
          siteVisit     += Math.floor((amountAfterAssociate * (project.siteVisitPercent || 0)) / 100);
          marketingAndMisc += Math.floor((amountAfterAssociate * (project.marketingAndMiscPercent || 0)) / 100);
          officeManagement += Math.floor((amountAfterAssociate * (project.officeManagementPercent || 0)) / 100);
        });
      }

      // Add to summary
      summary.drawing += drawing;
      summary.documents += documents;
      summary.siteVisit += siteVisit;
      summary.marketingAndMisc += marketingAndMisc;
      summary.officeManagement += officeManagement;

      // Custom fields are not currently computed per-payment via this endpoint
      // (custom field support requires percentage fields stored per custom field)
      const customExpenses = {};

      // Aggregate by client
      if (project.clientId && project.clientId._id) {
        const clientId = project.clientId._id.toString();
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            _id: clientId,
            clientName: project.clientId.name || 'Unknown Client',
            projectCount: 0,
            drawing: 0,
            documents: 0,
            siteVisit: 0,
            marketingAndMisc: 0,
            officeManagement: 0,
            customExpenses: {}
          });
        }

        const clientData = clientMap.get(clientId);
        clientData.projectCount++;
        clientData.drawing += drawing;
        clientData.documents += documents;
        clientData.siteVisit += siteVisit;
        clientData.marketingAndMisc += marketingAndMisc;
        clientData.officeManagement += officeManagement;

        // Add custom expenses to client
        Object.keys(customExpenses).forEach(key => {
          if (!clientData.customExpenses[key]) {
            clientData.customExpenses[key] = 0;
          }
          clientData.customExpenses[key] += customExpenses[key];
        });
      }

      return {
        _id: project._id,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        drawing,
        documents,
        siteVisit,
        marketingAndMisc,
        officeManagement,
        customExpenses
      };
    });

    // Convert client map to array and sort by total expenses
    const clientsArray = Array.from(clientMap.values()).sort((a, b) => {
      const totalA = a.drawing + a.documents + a.siteVisit + a.marketingAndMisc + a.officeManagement;
      const totalB = b.drawing + b.documents + b.siteVisit + b.marketingAndMisc + b.officeManagement;
      return totalB - totalA;
    });

    res.json({
      success: true,
      summary,
      projects: processedProjects,
      clients: clientsArray
    });

  } catch (error) {
    console.error('Error fetching expense distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense distribution data',
      error: error.message
    });
  }
};

module.exports = {
  getExpenseDistribution
};
