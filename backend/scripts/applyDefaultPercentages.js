const mongoose = require('mongoose');
const FinanceProject = require('../models/FinanceProject');

// Default percentage configuration
const DEFAULT_PERCENTAGES = {
  profitMarginPercent: 40,
  drawingPercent: 30,
  documentsPercent: 2,
  siteVisitPercent: 10,
  marketingAndMiscPercent: 3,
  officeManagementPercent: 15
};

/**
 * Apply default expense distribution percentages to projects that don't have them configured
 * This script identifies projects where all percentage fields are 0 (not configured)
 * and applies the default percentages. Also creates payment entries if missing.
 */
async function applyDefaultPercentages() {
  try {
    console.log('🔍 Finding projects without expense distribution configured...');
    
    // Find projects where all percentage fields are 0 (not configured)
    // OR where they don't have totalReceivedFees despite having data
    const projectsWithoutConfig = await FinanceProject.find({
      $or: [
        {
          profitMarginPercent: 0,
          drawingPercent: 0,
          documentsPercent: 0,
          siteVisitPercent: 0,
          marketingAndMiscPercent: 0,
          officeManagementPercent: 0
        },
        {
          profitMarginPercent: { $exists: false },
          drawingPercent: { $exists: false }
        }
      ]
    });
    
    console.log(`\n📊 Found ${projectsWithoutConfig.length} projects without expense distribution`);
    
    if (projectsWithoutConfig.length === 0) {
      console.log('✅ All projects already have expense distribution configured!');
      return { updated: 0, projects: [] };
    }
    
    const updatedProjects = [];
    
    console.log('\n📝 Applying default percentages:');
    console.log(`   - Profit Margin: ${DEFAULT_PERCENTAGES.profitMarginPercent}%`);
    console.log(`   - Drawing: ${DEFAULT_PERCENTAGES.drawingPercent}%`);
    console.log(`   - Documents: ${DEFAULT_PERCENTAGES.documentsPercent}%`);
    console.log(`   - Site Visit: ${DEFAULT_PERCENTAGES.siteVisitPercent}%`);
    console.log(`   - Marketing & Misc: ${DEFAULT_PERCENTAGES.marketingAndMiscPercent}%`);
    console.log(`   - Office Management: ${DEFAULT_PERCENTAGES.officeManagementPercent}%`);
    console.log(`   - Total: ${Object.values(DEFAULT_PERCENTAGES).reduce((a, b) => a + b, 0)}%\n`);
    
    // Update each project
    for (const project of projectsWithoutConfig) {
      try {
        // Load the full project document
        const projectDoc = await FinanceProject.findById(project._id);
        
        if (!projectDoc) {
          console.log(`⚠️  Project ${project.projectNumber} not found, skipping...`);
          continue;
        }
        
        // Apply default percentages
        projectDoc.profitMarginPercent = DEFAULT_PERCENTAGES.profitMarginPercent;
        projectDoc.drawingPercent = DEFAULT_PERCENTAGES.drawingPercent;
        projectDoc.documentsPercent = DEFAULT_PERCENTAGES.documentsPercent;
        projectDoc.siteVisitPercent = DEFAULT_PERCENTAGES.siteVisitPercent;
        projectDoc.marketingAndMiscPercent = DEFAULT_PERCENTAGES.marketingAndMiscPercent;
        projectDoc.officeManagementPercent = DEFAULT_PERCENTAGES.officeManagementPercent;
        
        // If project has totalReceivedFees but no payments array, create one
        if (projectDoc.totalReceivedFees > 0 && (!projectDoc.payments || projectDoc.payments.length === 0)) {
          console.log(`   📄 Creating payment entry for ${projectDoc.projectName} (₹${projectDoc.totalReceivedFees.toLocaleString('en-IN')})`);
          projectDoc.payments = [{
            date: new Date(),
            mode: 'Cash',
            chequeNeftNumber: '',
            amount: projectDoc.totalReceivedFees
          }];
        }
        
        // Save the project - this will trigger pre-save hooks to calculate amounts
        const updatedProject = await projectDoc.save();
        
        // Calculate the amounts based on received fees
        const receivedFees = updatedProject.totalReceivedFees || 0;
        const associateAmount = updatedProject.totalAssociateAmount || 0;
        const amountForExpenses = receivedFees - associateAmount;
        
        console.log(`✅ Updated: ${updatedProject.projectName} (${updatedProject.projectNumber})`);
        console.log(`   Finalized Fees: ₹${(updatedProject.finalizedFees || 0).toLocaleString('en-IN')}`);
        console.log(`   Total Received: ₹${receivedFees.toLocaleString('en-IN')}`);
        console.log(`   Remaining: ₹${((updatedProject.finalizedFees || 0) - receivedFees).toLocaleString('en-IN')}`);
        console.log(`   Associate Share: ₹${associateAmount.toLocaleString('en-IN')}`);
        console.log(`   Amount for Expenses: ₹${amountForExpenses.toLocaleString('en-IN')}`);
        console.log(`   Calculated Amounts:`);
        console.log(`     - Profit Margin (${DEFAULT_PERCENTAGES.profitMarginPercent}%): ₹${(updatedProject.profitMargin || 0).toLocaleString('en-IN')}`);
        console.log(`     - Drawing (${DEFAULT_PERCENTAGES.drawingPercent}%): ₹${(updatedProject.drawing || 0).toLocaleString('en-IN')}`);
        console.log(`     - Documents (${DEFAULT_PERCENTAGES.documentsPercent}%): ₹${(updatedProject.documents || 0).toLocaleString('en-IN')}`);
        console.log(`     - Site Visit (${DEFAULT_PERCENTAGES.siteVisitPercent}%): ₹${(updatedProject.siteVisit || 0).toLocaleString('en-IN')}`);
        console.log(`     - Marketing & Misc (${DEFAULT_PERCENTAGES.marketingAndMiscPercent}%): ₹${(updatedProject.marketingAndMisc || 0).toLocaleString('en-IN')}`);
        console.log(`     - Office Management (${DEFAULT_PERCENTAGES.officeManagementPercent}%): ₹${(updatedProject.officeManagement || 0).toLocaleString('en-IN')}\n`);
        
        updatedProjects.push({
          projectNumber: updatedProject.projectNumber,
          projectName: updatedProject.projectName,
          finalizedFees: updatedProject.finalizedFees || 0,
          totalReceivedFees: receivedFees,
          remaining: (updatedProject.finalizedFees || 0) - receivedFees,
          amountForExpenses: amountForExpenses
        });
        
      } catch (error) {
        console.error(`❌ Error updating project ${project.projectNumber}:`, error.message);
        console.error(error.stack);
      }
    }
    
    console.log(`\n✨ Successfully updated ${updatedProjects.length} out of ${projectsWithoutConfig.length} projects`);
    
    return {
      updated: updatedProjects.length,
      projects: updatedProjects
    };
    
  } catch (error) {
    console.error('❌ Error in applyDefaultPercentages:', error);
    throw error;
  }
}

// Run as standalone script if executed directly
if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';
  
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      return applyDefaultPercentages();
    })
    .then((result) => {
      console.log('\n🎉 Done!');
      console.log(`Total projects updated: ${result.updated}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { applyDefaultPercentages, DEFAULT_PERCENTAGES };
