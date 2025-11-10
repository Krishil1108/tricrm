const mongoose = require('mongoose');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

// Seed admin role and admin user
async function seedAdminData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if Admin role already exists
    let adminRole = await Role.findOne({ name: 'Admin' });

    if (!adminRole) {
      console.log('Creating Admin role...');
      
      // Create Admin role with all permissions
      adminRole = new Role({
        name: 'Admin',
        description: 'System Administrator with full access to all modules and features',
        permissions: {
          modules: {
            home: true,
            clients: true,
            dashboard: true,
            finance: true,
            settings: true
          },
          clients: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            duplicate: true,
            export: true,
            import: true
          },
          meetings: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          notes: {
            view: true,
            create: true,
            edit: true,
            delete: true
          },
          dashboard: {
            view: true,
            viewAnalytics: true,
            viewReports: true,
            exportReports: true
          },
          settings: {
            view: true,
            viewCompanySettings: true,
            editCompanySettings: true,
            manageUsers: true,
            manageRoles: true
          },
          finance: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            import: true,
            export: true,
            viewStats: true
          }
        },
        isSystemRole: true
      });

      await adminRole.save();
      console.log('✓ Admin role created successfully');
    } else {
      console.log('Admin role already exists');
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ username: 'admin' });

    if (!existingAdmin) {
      console.log('Creating Admin user...');
      
      // Create admin user
      const adminUser = new User({
        username: 'admin',
        email: 'admin@crm.com',
        password: 'admin123', // This will be hashed by the User model pre-save hook
        fullName: 'System Administrator',
        role: adminRole._id,
        isActive: true
      });

      await adminUser.save();
      console.log('✓ Admin user created successfully');
      console.log('\n===========================================');
      console.log('DEFAULT ADMIN CREDENTIALS:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('===========================================');
      console.log('\n⚠️  IMPORTANT: Please change the default password after first login!');
    } else {
      console.log('Admin user already exists');
    }

    // Create a basic Staff role as example
    let staffRole = await Role.findOne({ name: 'Staff' });
    
    if (!staffRole) {
      console.log('Creating basic Staff role...');
      
      staffRole = new Role({
        name: 'Staff',
        description: 'Basic staff member with limited access - can view and add clients but cannot delete',
        permissions: {
          modules: {
            home: true,
            clients: true,
            dashboard: false,
            finance: false,
            settings: false
          },
          clients: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            duplicate: true,
            export: false,
            import: false
          },
          meetings: {
            view: true,
            create: true,
            edit: true,
            delete: false
          },
          notes: {
            view: true,
            create: true,
            edit: true,
            delete: false
          },
          dashboard: {
            view: false,
            viewAnalytics: false,
            viewReports: false,
            exportReports: false
          },
          settings: {
            view: false,
            viewCompanySettings: false,
            editCompanySettings: false,
            manageUsers: false,
            manageRoles: false
          },
          finance: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            import: false,
            export: false,
            viewStats: false
          }
        },
        isSystemRole: false
      });

      await staffRole.save();
      console.log('✓ Basic Staff role created successfully');
    } else {
      console.log('Staff role already exists');
    }

    console.log('\n✓ Database seeding completed successfully!');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdminData();
