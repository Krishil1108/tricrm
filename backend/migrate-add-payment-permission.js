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

      // Force refresh the permissions structure to match the schema
      if (!role.permissions.finance.hasOwnProperty('add_payment')) {
        console.log(`Role ${role.name} missing add_payment field`);
        
        // Rebuild the entire finance permissions object to match schema order
        const currentFinance = role.permissions.finance;
        role.permissions.finance = {
          view: currentFinance.view || false,
          create: currentFinance.create || false,
          edit: currentFinance.edit || false,
          delete: currentFinance.delete || false,
          import: currentFinance.import || false,
          export: currentFinance.export || false,
          add_payment: currentFinance.add_payment || false,
          viewStats: currentFinance.viewStats || false,
          expense_distribution: currentFinance.expense_distribution || false,
          associate_distribution: currentFinance.associate_distribution || false,
          configure_percentages: currentFinance.configure_percentages || false
        };
        
        updated = true;
        console.log(`Rebuilt finance permissions for role: ${role.name}`);
      }

      // Save if updated
      if (updated) {
        await role.save();
        console.log(`Updated role: ${role.name}`);
        
        // Verify the update
        const refreshed = await Role.findById(role._id);
        console.log(`Verified ${role.name} add_payment:`, refreshed.permissions.finance.add_payment);
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