require('dotenv').config();
const ImageKit = require('imagekit');

console.log('========================================');
console.log('Testing ImageKit Configuration');
console.log('========================================\n');

console.log('Public Key:', process.env.IMAGEKIT_PUBLIC_KEY);
console.log('Private Key:', process.env.IMAGEKIT_PRIVATE_KEY ? '***' + process.env.IMAGEKIT_PRIVATE_KEY.slice(-4) : 'NOT SET');
console.log('URL Endpoint:', process.env.IMAGEKIT_URL_ENDPOINT);
console.log('\n');

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Test connection by listing files
imagekit.listFiles({
  skip: 0,
  limit: 1
})
  .then((response) => {
    console.log('✅ ImageKit connection successful!');
    console.log('Response:', response);
    console.log('\n🎉 ImageKit is ready to use!');
  })
  .catch((error) => {
    console.error('❌ ImageKit connection failed!');
    console.error('Error:', error);
    console.error('\nPossible issues:');
    console.error('1. Invalid API credentials');
    console.error('2. Network connectivity issue');
    console.error('3. ImageKit account issue');
    console.error('\nPlease verify your credentials at: https://imagekit.io/dashboard');
  });
