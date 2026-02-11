const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Log configuration attempt
console.log('🔧 Configuring Cloudinary...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set (length: ' + process.env.CLOUDINARY_API_SECRET.length + ')' : 'NOT SET');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Test connection on startup
cloudinary.api.ping()
  .then(() => {
    console.log('✅ Cloudinary connected successfully!');
  })
  .catch((error) => {
    console.error('❌ Cloudinary connection failed:', error.message);
    console.error('⚠️  Image uploads will fail until credentials are fixed!');
  });

// Simplified storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'marketplace/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // Simplified - no transformation
  },
});

// Create multer upload middleware with better error handling
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

module.exports = { cloudinary, upload };
