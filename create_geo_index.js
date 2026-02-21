const mongoose = require('mongoose');
require('dotenv').config();

const createGeoIndex = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected');

    const db = mongoose.connection.db;
    const shopsCollection = db.collection('shops');

    // Check if 2dsphere index exists
    const indexes = await shopsCollection.indexes();
    const hasGeoIndex = indexes.some(idx => 
      idx.key && idx.key.location === '2dsphere'
    );

    if (hasGeoIndex) {
      console.log('✅ 2dsphere index already exists on location field');
    } else {
      // Create 2dsphere index
      await shopsCollection.createIndex({ location: '2dsphere' });
      console.log('✅ Created 2dsphere index on location field');
    }

    // Update existing shops without location
    const result = await shopsCollection.updateMany(
      { 
        $or: [
          { location: { $exists: false } },
          { 'location.coordinates': [0, 0] }
        ]
      },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [0, 0]
          },
          deliveryRadius: 5
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} shops with default location`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createGeoIndex();
