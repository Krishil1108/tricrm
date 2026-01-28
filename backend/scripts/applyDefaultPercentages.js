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
 * and applies the default percentages
 */
async function applyDefaultPercentages() {
  try {
    console.log('🔍 Finding projects without expense distribution configured...');
    
    // Find projects where all percentage fields are 0 (not configured)
    const projectsWithoutConfig = await FinanceProject.find({
      profitMarginPercent: 0,
      drawingPercent: 0,
      documentsPercent: 0,
      siteVisitPercent: 0,
      marketingAndMiscPercent: 0,
      officeManagementPercent: 0
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
        // Update the project with default percentages
        const updatedProject = await FinanceProject.findByIdAndUpdate(
          project._id,
          {
            $set: {
              ...DEFAULT_PERCENTAGES
            }
          },
          { new: true, runValidators: true }
        );
        
        // Calculate the amounts based on received fees
        const receivedFees = updatedProject.totalReceivedFees || 0;
        const associateAmount = updatedProject.totalAssociateAmount || 0;
        const amountForExpenses = receivedFees - associateAmount;
        
        console.log(`✅ Updated: ${updatedProject.projectName} (${updatedProject.projectNumber})`);
        console.log(`   Total Received: ₹${receivedFees.toLocaleString('en-IN')}`);
        console.log(`   Associate Share: ₹${associateAmount.toLocaleString('en-IN')}`);
        console.log(`   Amount for Expenses: ₹${amountForExpenses.toLocaleString('en-IN')}`);
        console.log(`   Calculated Amounts:`);
        console.log(`     - Profit Margin: ₹${updatedProject.profitMargin?.toLocaleString('en-IN') || 0}`);
        console.log(`     - Drawing: ₹${updatedProject.drawing?.toLocaleString('en-IN') || 0}`);
        console.log(`     - Documents: ₹${updatedProject.documents?.toLocaleString('en-IN') || 0}`);
        console.log(`     - Site Visit: ₹${updatedProject.siteVisit?.toLocaleString('en-IN') || 0}`);
        console.log(`     - Marketing & Misc: ₹${updatedProject.marketingAndMisc?.toLocaleString('en-IN') || 0}`);
        console.log(`     - Office Management: ₹${updatedProject.officeManagement?.toLocaleString('en-IN') || 0}\n`);
        
        updatedProjects.push({
          projectNumber: updatedProject.projectNumber,
          projectName: updatedProject.projectName,
          totalReceivedFees: receivedFees,
          amountForExpenses: amountForExpenses
        });
        
      } catch (error) {
        console.error(`❌ Error updating project ${project.projectNumber}:`, error.message);
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
