const mongoose = require('mongoose');
const Role = require('./models/Role');
require('dotenv').config();

// Migration script to add missing add_payment permission to existing roles
async function migrateRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all roles
    const roles = await Role.find({});
    console.log(`Found ${roles.length} roles to check`);

    for (const role of roles) {
      let updated = false;

      // Check if add_payment permission exists in finance permissions
      if (!role.permissions.finance.hasOwnProperty('add_payment')) {
        role.permissions.finance.add_payment = false;
        updated = true;
        console.log(`Added add_payment permission to role: ${role.name}`);
      }

      // Save if updated
      if (updated) {
        await role.save();
        console.log(`Updated role: ${role.name}`);
      }
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateRoles();