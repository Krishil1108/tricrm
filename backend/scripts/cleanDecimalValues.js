const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/triCRM', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const FinanceProject = require('../models/FinanceProject');

async function cleanDecimalValues() {
  try {
    console.log('Starting decimal value cleanup...');
    
    // Get all projects with decimal values
    const projects = await FinanceProject.find({});
    
    console.log(`Found ${projects.length} projects to check...`);
    
    let updatedCount = 0;
    
    for (let project of projects) {
      let needsUpdate = false;
      const updates = {};
      
      // Check and fix financial fields
      const financialFields = [
        'finalizedFees', 'totalReceivedFees', 'year2024_25',
        'profitMargin', 'drawing', 'documents', 'siteVisit',
        'marketingAndMisc', 'officeManagement'
      ];
      
      financialFields.forEach(field => {
        if (project[field] && project[field] % 1 !== 0) {
          // Has decimal, convert to integer
          updates[field] = Math.floor(project[field]);
          needsUpdate = true;
          console.log(`Project ${project.projectName}: ${field} ${project[field]} -> ${updates[field]}`);
        }
      });
      
      // Check and fix payment amounts
      if (project.payments && project.payments.length > 0) {
        const cleanedPayments = project.payments.map(payment => {
          if (payment.amount && payment.amount % 1 !== 0) {
            console.log(`Project ${project.projectName}: Payment amount ${payment.amount} -> ${Math.floor(payment.amount)}`);
            needsUpdate = true;
            return {
              ...payment,
              amount: Math.floor(payment.amount)
            };
          }
          return payment;
        });
        
        if (needsUpdate && cleanedPayments.some(p => p.amount !== project.payments.find(op => op._id === p._id)?.amount)) {
          updates.payments = cleanedPayments;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        await FinanceProject.findByIdAndUpdate(project._id, updates);
        updatedCount++;
        console.log(`Updated project: ${project.projectName}`);
      }
    }
    
    console.log(`\nCleanup complete! Updated ${updatedCount} projects.`);
    console.log('All decimal values have been converted to integers.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the cleanup
cleanDecimalValues();