const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://krishtrimity11:Pops%23100@cluster0.rsr3wj5.mongodb.net/tricrm')
  .then(() => {
    console.log('Connected to MongoDB');
    fixAddressFields();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Client model
const Client = require('../models/Client');

function parseAddress(fullAddress) {
  if (!fullAddress || fullAddress === 'empty') return {};
  
  // Try to extract city, state and zip from common patterns
  const patterns = [
    // Pattern: "address, city, state zipcode" 
    /^(.*?),\s*([^,]+),\s*([A-Za-z\s]+)\s*(\d{6})$/,
    // Pattern: "address, city, state-zipcode"
    /^(.*?),\s*([^,]+),\s*([A-Za-z\s]+)-(\d{6})$/,
    // Pattern: "address, city state zipcode"
    /^(.*?),\s*([^,\s]+)\s+([A-Za-z\s]+)\s*(\d{6})$/
  ];
  
  for (let pattern of patterns) {
    const match = fullAddress.match(pattern);
    if (match) {
      return {
        address: match[1].trim(),
        city: match[2].trim(),
        state: match[3].trim(),
        zipCode: match[4].trim()
      };
    }
  }
  
  // For the specific case: "1012-A, Tower C, Rajyash Arise, Near Vishala Hotel, South Vasna, Ahmedabad, Gujarat 380004"
  const gujaratPattern = /^(.*?),\s*(Ahmedabad|Mumbai|Delhi|Pune|Bangalore|Chennai|Kolkata|Hyderabad),\s*(Gujarat|Maharashtra|Delhi|Karnataka|Tamil Nadu|West Bengal|Telangana)\s*(\d{6})$/i;
  const gujaratMatch = fullAddress.match(gujaratPattern);
  if (gujaratMatch) {
    return {
      address: gujaratMatch[1].trim(),
      city: gujaratMatch[2].trim(),
      state: gujaratMatch[3].trim(),
      zipCode: gujaratMatch[4].trim()
    };
  }
  
  // If no pattern matches, try to at least extract zipcode
  const zipMatch = fullAddress.match(/(\d{6})$/);
  if (zipMatch) {
    const beforeZip = fullAddress.replace(/\s*\d{6}$/, '');
    const parts = beforeZip.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
      return {
        address: parts.slice(0, -2).join(', '),
        city: parts[parts.length - 2],
        state: parts[parts.length - 1],
        zipCode: zipMatch[1]
      };
    }
  }
  
  // Fallback: keep original address, leave others empty
  return {
    address: fullAddress,
    city: '',
    state: '',
    zipCode: ''
  };
}

async function fixAddressFields() {
  try {
    // Find all clients
    const clients = await Client.find({});
    console.log(`Found ${clients.length} clients to process`);
    
    let updatedCount = 0;
    
    for (let client of clients) {
      // Check if address needs to be parsed
      if (client.address && 
          (!client.city || client.city === 'empty' || client.city === '') &&
          (!client.state || client.state === 'empty' || client.state === '') &&
          (!client.zipCode || client.zipCode === 'empty' || client.zipCode === '')) {
        
        console.log(`\n🔧 Processing client: ${client.name}`);
        console.log(`   Original address: "${client.address}"`);
        
        const parsedAddress = parseAddress(client.address);
        console.log(`   Parsed result:`, parsedAddress);
        
        // Update the client
        await Client.findByIdAndUpdate(client._id, {
          address: parsedAddress.address || client.address,
          city: parsedAddress.city || '',
          state: parsedAddress.state || '',
          zipCode: parsedAddress.zipCode || ''
        });
        
        updatedCount++;
        console.log(`   ✅ Updated client ${client.name}`);
      } else {
        console.log(`\n⏭️  Skipping client: ${client.name} (already has parsed address fields)`);
      }
    }
    
    console.log(`\n🎉 Address parsing completed! Updated ${updatedCount} clients.`);
    
    // Show final result
    console.log('\n📋 Final client data:');
    const updatedClients = await Client.find({});
    updatedClients.forEach(client => {
      console.log(`\n📋 Client: ${client.name}`);
      console.log(`   Address: "${client.address || 'empty'}"`);
      console.log(`   City: "${client.city || 'empty'}"`);
      console.log(`   State: "${client.state || 'empty'}"`);
      console.log(`   ZIP: "${client.zipCode || 'empty'}"`);
      console.log(`   Country: "${client.country || 'empty'}"`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('Error fixing address fields:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}