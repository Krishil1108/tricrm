const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

// Client schema to access the collection
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

async function migrateClientData() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');
    
    // Find all clients
    const clients = await Client.find({});
    console.log(`Found ${clients.length} clients to check`);

    let updated = 0;

    for (let client of clients) {
      let needsUpdate = false;
      let updates = {};

      // Add country field if missing
      if (!client.country) {
        updates.country = 'India';
        needsUpdate = true;
      }

      // Clean up any incorrectly parsed address data
      // If city contains full address-like content, clear the parsed fields
      if (client.city && client.city.includes(',') && client.city.length > 50) {
        console.log(`Fixing client ${client.name} - city contains full address`);
        updates.city = '';
        updates.state = '';
        updates.zipCode = '';
        needsUpdate = true;
      }

      // If state contains zip code, extract it
      if (client.state && /\d{5,6}/.test(client.state)) {
        console.log(`Fixing client ${client.name} - state contains zip code`);
        const zipMatch = client.state.match(/(\d{5,6})/);
        if (zipMatch) {
          updates.zipCode = zipMatch[1];
          updates.state = client.state.replace(/\d{5,6}/, '').trim();
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await Client.updateOne({ _id: client._id }, updates);
        updated++;
        console.log(`Updated client: ${client.name}`);
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Total clients: ${clients.length}`);
    console.log(`🔄 Updated clients: ${updated}`);

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('❌ Error during migration:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateClientData();