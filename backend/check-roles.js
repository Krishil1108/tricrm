const mongoose = require('mongoose');
const Role = require('./models/Role');
require('dotenv').config();

async function checkRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all roles and check their permissions
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles`);

    roles.forEach(role => {
      console.log('\n=== ROLE:', role.name, '===');
      console.log('Finance permissions:', JSON.stringify(role.permissions.finance, null, 2));
      console.log('Has add_payment:', role.permissions.finance.add_payment);
    });

    process.exit(0);
  } catch (error) {
    console.error('Check failed:', error);
    process.exit(1);
  }
}

checkRoles();