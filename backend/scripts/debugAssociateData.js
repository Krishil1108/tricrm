const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://krishtrimity11:Pops%23100@cluster0.rsr3wj5.mongodb.net/tricrm')
  .then(() => {
    console.log('Connected to MongoDB');
    checkAssociateData();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Associate model
const Associate = require('../models/Associate');

async function checkAssociateData() {
  try {
    const associates = await Associate.find({});
    console.log(`Found ${associates.length} associates:`);
    
    associates.forEach(associate => {
      console.log(`\n📋 Associate: ${associate.name}`);
      console.log(`   Address: "${associate.address || 'empty'}"`);
      console.log(`   City: "${associate.city || 'empty'}"`);
      console.log(`   State: "${associate.state || 'empty'}"`);
      console.log(`   ZIP: "${associate.zipCode || 'empty'}"`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('Error checking associate data:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}