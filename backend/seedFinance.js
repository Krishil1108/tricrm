const mongoose = require('mongoose');
const FinanceProject = require('./models/FinanceProject');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

const sampleProjects = [
  {
    srNo: 1,
    projectNumber: 'PRJ-2024-001',
    projectName: 'Residential Complex - Phase 1',
    finalizedFees: 950000,
    totalReceivedFees: 950000,
    profitMarginPercent: 50,
    drawingPercent: 25,
    documentsPercent: 0,
    siteVisitPercent: 10,
    marketingAndMiscPercent: 5,
    officeManagementPercent: 10,
    status: 'Completed',
    link: 'https://example.com/project1'
  },
  {
    srNo: 2,
    projectNumber: 'PRJ-2024-002',
    projectName: 'Commercial Tower - Downtown',
    finalizedFees: 1200000,
    totalReceivedFees: 800000,
    profitMarginPercent: 45,
    drawingPercent: 30,
    documentsPercent: 5,
    siteVisitPercent: 8,
    marketingAndMiscPercent: 7,
    officeManagementPercent: 5,
    status: 'Active',
    link: 'https://example.com/project2'
  },
  {
    srNo: 3,
    projectNumber: 'PRJ-2024-003',
    projectName: 'Shopping Mall Extension',
    finalizedFees: 750000,
    totalReceivedFees: 600000,
    profitMarginPercent: 40,
    drawingPercent: 35,
    documentsPercent: 3,
    siteVisitPercent: 12,
    marketingAndMiscPercent: 6,
    officeManagementPercent: 4,
    status: 'Active'
  }
];

async function seedFinanceProjects() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if projects already exist
    const existingProjects = await FinanceProject.countDocuments();
    
    if (existingProjects > 0) {
      console.log(`Found ${existingProjects} existing projects. Skipping seed.`);
      return;
    }

    console.log('Creating sample finance projects...');
    
    for (const projectData of sampleProjects) {
      const project = new FinanceProject(projectData);
      await project.save();
      console.log(`✓ Created project: ${project.projectName}`);
    }

    console.log('\n✓ Sample finance projects created successfully!');
    console.log(`Total projects: ${sampleProjects.length}`);

  } catch (error) {
    console.error('Error seeding finance projects:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeding
seedFinanceProjects();