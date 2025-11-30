const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Client = require('./models/Client');

// Parse address string into components
function parseAddress(addressString) {
  if (!addressString || addressString.trim() === '') {
    return { address: '', city: '', state: '', zipCode: '' };
  }

  // Split by comma
  const parts = addressString.split(',').map(part => part.trim());
  
  if (parts.length === 0) {
    return { address: addressString, city: '', state: '', zipCode: '' };
  }

  // Last part usually contains State and ZIP
  const lastPart = parts[parts.length - 1];
  
  // Try to extract ZIP code (5 or 6 digits)
  const zipMatch = lastPart.match(/\b(\d{5,6})\b/);
  const zipCode = zipMatch ? zipMatch[1] : '';
  
  // Extract state (what remains after removing ZIP)
  let state = '';
  if (zipCode) {
    state = lastPart.replace(zipCode, '').trim();
  } else {
    state = lastPart;
  }

  // City is usually the second-to-last part
  let city = '';
  if (parts.length >= 2) {
    city = parts[parts.length - 2];
  }

  // Everything else is the street address
  let address = '';
  if (parts.length > 2) {
    address = parts.slice(0, parts.length - 2).join(', ');
  } else if (parts.length === 2) {
    address = parts[0];
  } else {
    address = addressString;
  }

  return {
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    zipCode: zipCode.trim()
  };
}

async function migrateClients() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Read the JSON file
    const jsonPath = 'C:\\Users\\krishils\\Downloads\\clients_export_2025-11-30.json';
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const clientsData = jsonData.Clients;

    console.log(`Found ${clientsData.length} clients in JSON file`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const clientData of clientsData) {
      try {
        // Find client by email or name
        let client = null;
        
        if (clientData.Email) {
          client = await Client.findOne({ email: clientData.Email });
        }
        
        if (!client && clientData.Name) {
          client = await Client.findOne({ name: clientData.Name });
        }

        if (!client) {
          console.log(`⚠️  Client not found: ${clientData.Name} (${clientData.Email || 'no email'})`);
          skippedCount++;
          continue;
        }

        // Check if address needs to be parsed
        const needsParsing = clientData.Address && 
                            (!client.city || !client.state) && 
                            clientData.Address.includes(',');

        if (!needsParsing) {
          console.log(`⏭️  Skipping ${client.name} - address already properly formatted or no address`);
          skippedCount++;
          continue;
        }

        // Parse the address
        const addressParts = parseAddress(clientData.Address);

        // Update the client
        client.address = addressParts.address || client.address;
        client.city = addressParts.city || client.city;
        client.state = addressParts.state || client.state;
        client.zipCode = addressParts.zipCode || client.zipCode;

        await client.save();

        console.log(`✅ Updated ${client.name}:`);
        console.log(`   Street: ${addressParts.address}`);
        console.log(`   City: ${addressParts.city}`);
        console.log(`   State: ${addressParts.state}`);
        console.log(`   ZIP: ${addressParts.zipCode}`);
        console.log('');

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating client ${clientData.Name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total clients in JSON: ${clientsData.length}`);
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateClients();
