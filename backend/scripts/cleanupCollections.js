const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tricrm';

// Collections to remove
const collectionsToRemove = [
  'inventories',
  'inventoryitems',
  'inventorycategories',
  'quotes',
  'stocktransactions' // Related to inventory
];

async function cleanupCollections() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    
    // Get all existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name);
    
    console.log('\nExisting collections:', existingCollectionNames);
    console.log('\nCollections to remove:', collectionsToRemove);
    
    // Remove each collection if it exists
    for (const collectionName of collectionsToRemove) {
      if (existingCollectionNames.includes(collectionName)) {
        console.log(`\nDropping collection: ${collectionName}`);
        await db.collection(collectionName).drop();
        console.log(`✓ Successfully dropped ${collectionName}`);
      } else {
        console.log(`✓ Collection ${collectionName} does not exist (already removed)`);
      }
    }
    
    console.log('\n✅ Cleanup completed successfully!');
    
    // Show remaining collections
    const remainingCollections = await db.listCollections().toArray();
    console.log('\nRemaining collections:', remainingCollections.map(c => c.name));
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  }
}

// Run the cleanup
cleanupCollections();
