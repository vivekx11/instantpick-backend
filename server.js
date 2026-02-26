const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  process.env.ADMIN_APP_URL,
  process.env.SHOP_APP_URL,
  process.env.USER_APP_URL,
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin', require('./routes/admin')); // Admin routes
app.use('/api/dashboard', require('./routes/dashboard')); // Optimized dashboard
app.use('/api/shops', require('./routes/shops'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/location', require('./routes/location'));
app.use('/api/upload-base64', require('./routes/upload_base64')); // Base64 upload (backup)

// Use ImageKit if credentials are available, otherwise use base64
try {
  if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY) {
    console.log('✅ Using ImageKit for uploads');
    app.use('/api/upload', require('./routes/upload_imagekit'));
  } else {
    console.log('⚠️  Using Base64 for uploads (ImageKit credentials not found)');
    app.use('/api/upload', require('./routes/upload_base64'));
  }
} catch (error) {
  console.error('❌ Error loading upload route:', error.message);
  app.use('/api/upload', require('./routes/upload_base64')); // Fallback to base64
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Marketplace API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marketplace';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
    
    // Drop old pickupCode index (migration)
    try {
      const db = mongoose.connection.db;
      const ordersCollection = db.collection('orders');
      await ordersCollection.dropIndex('pickupCode_1');
      console.log('✅ Dropped old pickupCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  pickupCode_1 index already dropped');
      } else {
        console.log('⚠️  Could not drop pickupCode_1 index:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 API Base URL: ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/api`);
    console.log(`🏥 Health Check: ${process.env.NODE_ENV === 'production' ? 'https://your-app.onrender.com' : `http://localhost:${PORT}`}/api/health`);
  });
};

startServer();

module.exports = app;