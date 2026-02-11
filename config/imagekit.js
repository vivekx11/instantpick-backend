const ImageKit = require('imagekit');
const multer = require('multer');

console.log('🔧 Configuring ImageKit...');
console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Test ImageKit connection
imagekit.listFiles({
  skip: 0,
  limit: 1
})
  .then(() => {
    console.log('✅ ImageKit connected successfully!');
  })
  .catch((error) => {
    console.error('❌ ImageKit connection failed:', error.message);
    console.error('⚠️  Image uploads will fail until credentials are fixed!');
  });

// Configure multer for memory storage (ImageKit needs buffer)
const storage = multer.memoryStorage();

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

module.exports = { imagekit, upload };
