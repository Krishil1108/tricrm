const mongoose = require('mongoose');
const Client = require('./models/Client');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tricrm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function migrateClientAddresses() {
  try {
    console.log('Starting client address migration...');
    
    // Find all clients
    const clients = await Client.find({});
    console.log(`Found ${clients.length} clients to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const client of clients) {
      // Skip if client already has city, state, and zipCode filled
      if (client.city && client.state && client.zipCode) {
        console.log(`✓ Skipping ${client.name} - already has separate address fields`);
        skippedCount++;
        continue;
      }
      
      // Skip if no address to parse
      if (!client.address || client.address.trim() === '') {
        console.log(`⊘ Skipping ${client.name} - no address data`);
        skippedCount++;
        continue;
      }
      
      // Try to parse the address
      const addressParts = client.address.split(',').map(part => part.trim());
      
      let updates = {};
      let streetAddress = client.address;
      
      // If we have at least 3 parts (street, city, state+zip)
      if (addressParts.length >= 3) {
        // First part is street address
        streetAddress = addressParts[0];
        updates.address = streetAddress;
        
        // Second part is city
        if (!client.city && addressParts[1]) {
          updates.city = addressParts[1];
        }
        
        // Last part should be "State ZipCode" format
        const lastPart = addressParts[addressParts.length - 1];
        
        // Try to match "State ZipCode" pattern
        // Matches patterns like: "NY 10001", "CA 94102", "Gujarat 382421"
        const stateZipMatch = lastPart.match(/^(.+?)\s+(\d{5,6}(?:-\d{4})?)$/);
        
        if (stateZipMatch) {
          if (!client.state) {
            updates.state = stateZipMatch[1].trim();
          }
          if (!client.zipCode) {
            updates.zipCode = stateZipMatch[2].trim();
          }
        } else {
          // If no zip code found, entire last part is state
          if (!client.state) {
            updates.state = lastPart;
          }
        }
        
        // If we have 4 parts, second might be city and third might be state
        if (addressParts.length === 4) {
          if (!client.city && addressParts[1]) {
            updates.city = addressParts[1];
          }
          if (!client.state && addressParts[2]) {
            updates.state = addressParts[2];
          }
        }
      } else if (addressParts.length === 2) {
        // Try "Street, City State Zip" format
        streetAddress = addressParts[0];
        updates.address = streetAddress;
        
        const secondPart = addressParts[1];
        const cityStateZipMatch = secondPart.match(/^(.+?)\s+([A-Z]{2}|\w+)\s+(\d{5,6}(?:-\d{4})?)$/);
        
        if (cityStateZipMatch) {
          if (!client.city) updates.city = cityStateZipMatch[1].trim();
          if (!client.state) updates.state = cityStateZipMatch[2].trim();
          if (!client.zipCode) updates.zipCode = cityStateZipMatch[3].trim();
        }
      }
      
      // Only update if we found some fields to update
      if (Object.keys(updates).length > 0) {
        await Client.findByIdAndUpdate(client._id, updates);
        console.log(`✓ Updated ${client.name}:`);
        console.log(`  Address: ${updates.address || client.address}`);
        console.log(`  City: ${updates.city || client.city || 'N/A'}`);
        console.log(`  State: ${updates.state || client.state || 'N/A'}`);
        console.log(`  ZIP: ${updates.zipCode || client.zipCode || 'N/A'}`);
        updatedCount++;
      } else {
        console.log(`⊘ No updates needed for ${client.name}`);
        skippedCount++;
      }
    }
    
    console.log('\n=== Migration Complete ===');
    console.log(`Total clients: ${clients.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateClientAddresses();
