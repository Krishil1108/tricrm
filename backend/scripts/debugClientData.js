const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

// Client schema
const clientSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  company: String,
  address: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
  notes: String,
  status: String,
  dateAdded: Date
}, {
  timestamps: true
});

const Client = mongoose.model('Client', clientSchema);

async function debugClientData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Find all clients and show their address data
    const clients = await Client.find({});
    console.log(`Found ${clients.length} clients:\n`);

    for (let client of clients) {
      console.log(`📋 Client: ${client.name}`);
      console.log(`   Address: "${client.address || 'empty'}"`);
      console.log(`   City: "${client.city || 'empty'}"`);
      console.log(`   State: "${client.state || 'empty'}"`);
      console.log(`   ZIP: "${client.zipCode || 'empty'}"`);
      console.log(`   Country: "${client.country || 'empty'}"`);
      console.log(`   ---`);
    }

    await mongoose.connection.close();

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugClientData();