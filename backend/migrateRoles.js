const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the old Role schema (for reading existing data)
const oldRoleSchema = new mongoose.Schema({
  name: String,
  description: String,
  permissions: mongoose.Schema.Types.Mixed, // Mixed type to handle the old structure
  isSystemRole: { type: Boolean, default: false }
}, { timestamps: true });

const OldRole = mongoose.model('OldRole', oldRoleSchema, 'roles'); // Use existing 'roles' collection

// Define the new Role schema structure
const newPermissionStructure = {
  // Client Management Module - Client Page
  view_client_page: false,
  add_new_client: false,
  edit_client: false,
  delete_client: false,
  view_client_details: false,
  view_client_projects: false,
  export_clients_excel: false,
  import_clients_excel: false,
  view_client_summary_cards: false,
  
  // Client Management Module - Client Projects Page
  view_client_projects_list_page: false,
  add_new_project_from_client: false,
  back_to_clients: false,
  edit_project_from_client: false,
  view_project_summary_cards_client: false,
  view_distribution_section_client: false,
  
  // Associate Management Module - Associate Page
  view_associates_page: false,
  add_new_associate: false,
  edit_associate: false,
  delete_associate: false,
  export_associates_excel: false,
  import_associates_excel: false,
  view_associate_summary_cards: false,
  view_associated_projects: false,
  
  // Associate Management Module - Associate Projects Page
  view_associate_projects_page: false,
  add_new_project_from_associate: false,
  back_to_associates: false,
  edit_project_from_associate: false,
  view_summary_cards_associate: false,
  view_owner_view: false,
  view_associate_details: false,
  
  // Project Management Module - Project Management Page
  view_project_management_page: false,
  add_new_project: false,
  configure_percentages: false,
  import_excel_projects: false,
  export_excel_projects: false,
  edit_project: false,
  delete_project: false,
  expense_distribution: false,
  associate_distribution: false,
  view_project_summary_cards: false,
  
  // Project Management Module - Add New Project Form
  view_add_project_form: false,
  add_new_client_from_project: false,
  add_payment: false,
  add_associates: false
};

const migrateRoles = async () => {
  try {
    console.log('Starting role migration...');
    
    // Get all existing roles
    const existingRoles = await OldRole.find();
    console.log(`Found ${existingRoles.length} roles to migrate`);
    
    for (const role of existingRoles) {
      console.log(`Migrating role: ${role.name}`);
      
      let newPermissions = { ...newPermissionStructure };
      
      // Handle Admin role - give all permissions
      if (role.name === 'Admin') {
        console.log('Setting Admin role with all permissions');
        Object.keys(newPermissions).forEach(key => {
          newPermissions[key] = true;
        });
      } 
      // Handle Staff role - give basic view and add permissions
      else if (role.name === 'Staff') {
        console.log('Setting Staff role with basic permissions');
        // Give Staff basic client permissions
        newPermissions.view_client_page = true;
        newPermissions.add_new_client = true;
        newPermissions.view_client_summary_cards = true;
        
        // Give Staff basic associate permissions  
        newPermissions.view_associates_page = true;
        newPermissions.add_new_associate = true;
        newPermissions.view_associate_summary_cards = true;
      }
      // Handle other custom roles
      else {
        console.log(`Migrating custom role: ${role.name}`);
        
        // Try to map old permissions to new structure
        if (role.permissions) {
          // If old clients permissions exist, map them
          if (role.permissions.clients) {
            if (role.permissions.clients.view) {
              newPermissions.view_client_page = true;
              newPermissions.view_client_details = true;
              newPermissions.view_client_summary_cards = true;
            }
            if (role.permissions.clients.create) {
              newPermissions.add_new_client = true;
            }
            if (role.permissions.clients.edit) {
              newPermissions.edit_client = true;
            }
            if (role.permissions.clients.delete) {
              newPermissions.delete_client = true;
            }
            if (role.permissions.clients.export) {
              newPermissions.export_clients_excel = true;
            }
            if (role.permissions.clients.import) {
              newPermissions.import_clients_excel = true;
            }
          }
          
          // If old finance permissions exist, map to project management
          if (role.permissions.finance) {
            if (role.permissions.finance.view) {
              newPermissions.view_project_management_page = true;
              newPermissions.view_project_summary_cards = true;
            }
            if (role.permissions.finance.create) {
              newPermissions.add_new_project = true;
              newPermissions.view_add_project_form = true;
            }
            if (role.permissions.finance.edit) {
              newPermissions.edit_project = true;
            }
            if (role.permissions.finance.delete) {
              newPermissions.delete_project = true;
            }
            if (role.permissions.finance.export) {
              newPermissions.export_excel_projects = true;
            }
            if (role.permissions.finance.import) {
              newPermissions.import_excel_projects = true;
            }
          }
        }
      }
      
      // Update the role with new permission structure
      await OldRole.updateOne(
        { _id: role._id },
        { 
          $set: { 
            permissions: newPermissions 
          } 
        }
      );
      
      console.log(`✓ Migrated role: ${role.name}`);
    }
    
    console.log('Role migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run migration
migrateRoles();