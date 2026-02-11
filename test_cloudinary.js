require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary Configuration...\n');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
console.log('\n');

// Test Cloudinary connection
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful!');
    console.log('Response:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed!');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error details:', error.error);
    console.error('\nPossible issues:');
    console.error('1. Invalid API credentials');
    console.error('2. Network connectivity issue');
    console.error('3. Cloudinary account suspended');
    console.error('\nPlease verify your credentials at: https://console.cloudinary.com/');
  });
