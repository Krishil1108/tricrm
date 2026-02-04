const FinanceProject = require('../models/FinanceProject');
const Client = require('../models/Client');

/**
 * Get comprehensive expense distribution data
 * Returns summary, project-level, and client-level expense breakdowns
 */
const getExpenseDistribution = async (req, res) => {
  try {
    // Get all projects with populated client data
    const projects = await FinanceProject.find()
      .populate('clientId', 'name')
      .select('projectNumber projectName drawing documents siteVisit marketingAndMisc officeManagement clientId')
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
      // Standard expense fields
      const drawing = project.drawing || 0;
      const documents = project.documents || 0;
      const siteVisit = project.siteVisit || 0;
      const marketingAndMisc = project.marketingAndMisc || 0;
      const officeManagement = project.officeManagement || 0;

      // Add to summary
      summary.drawing += drawing;
      summary.documents += documents;
      summary.siteVisit += siteVisit;
      summary.marketingAndMisc += marketingAndMisc;
      summary.officeManagement += officeManagement;

      // Extract custom expense fields (any field not in the standard schema)
      const customExpenses = {};
      const standardFields = ['_id', 'projectNumber', 'projectName', 'drawing', 'documents', 
                              'siteVisit', 'marketingAndMisc', 'officeManagement', 'clientId'];
      
      Object.keys(project).forEach(key => {
        if (!standardFields.includes(key) && typeof project[key] === 'number' && project[key] > 0) {
          customExpenses[key] = project[key];
          if (!summary.customFields[key]) {
            summary.customFields[key] = 0;
          }
          summary.customFields[key] += project[key];
        }
      });

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
