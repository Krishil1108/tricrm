const mongoose = require('mongoose');
const FinanceProject = require('./models/FinanceProject');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

const testProject = {
  srNo: 99,
  projectNumber: 'TEST-001',
  projectName: 'Test Project with Payments',
  finalizedFees: 100000,
  payments: [
    {
      date: new Date('2024-04-15'),
      chequeNeftNumber: 'CHQ123456',
      mode: 'Cheque',
      amount: 30000
    },
    {
      date: new Date('2024-07-20'),
      chequeNeftNumber: 'NEFT789012',
      mode: 'NEFT',
      amount: 45000
    },
    {
      date: new Date('2024-11-10'),
      chequeNeftNumber: 'UPI345678',
      mode: 'UPI',
      amount: 25000
    }
  ],
  profitMarginPercent: 50,
  drawingPercent: 25,
  documentsPercent: 0,
  siteVisitPercent: 10,
  marketingAndMiscPercent: 5,
  officeManagementPercent: 10,
  status: 'Active'
};

async function testPaymentSystem() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete any existing test project
    await FinanceProject.deleteMany({ projectNumber: 'TEST-001' });

    console.log('Creating test project with payments...');
    
    const project = new FinanceProject(testProject);
    await project.save();

    console.log('✓ Test project created successfully!');
    console.log('Project Details:');
    console.log('- Project Name:', project.projectName);
    console.log('- Total Received Fees:', project.totalReceivedFees);
    console.log('- Number of Payments:', project.payments.length);
    console.log('- Profit Margin Amount:', project.profitMargin);
    console.log('- Drawing Amount:', project.drawing);
    console.log('- Site Visit Amount:', project.siteVisit);
    
    console.log('\nPayment Details:');
    project.payments.forEach((payment, index) => {
      console.log(`  Payment ${index + 1}:`);
      console.log(`  - Date: ${payment.date.toISOString().split('T')[0]}`);
      console.log(`  - Mode: ${payment.mode}`);
      console.log(`  - Amount: ₹${payment.amount.toLocaleString()}`);
      console.log(`  - Reference: ${payment.chequeNeftNumber}`);
    });

  } catch (error) {
    console.error('Error testing payment system:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the test
testPaymentSystem();