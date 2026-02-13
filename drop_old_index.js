// Script to drop old pickupCode index from orders collection
const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndex() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    // Get all indexes
    const indexes = await ordersCollection.indexes();
    console.log('📋 Current indexes:', indexes.map(i => i.name));

    // Drop pickupCode index if it exists
    try {
      await ordersCollection.dropIndex('pickupCode_1');
      console.log('✅ Dropped pickupCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  pickupCode_1 index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // Optionally: Remove pickupCode field from all documents
    const result = await ordersCollection.updateMany(
      { pickupCode: { $exists: true } },
      { $unset: { pickupCode: '' } }
    );
    console.log(`✅ Removed pickupCode field from ${result.modifiedCount} documents`);

    console.log('✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

dropOldIndex();
