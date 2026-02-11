const cloudinary = require('cloudinary').v2;

console.log('========================================');
console.log('Testing Both Cloudinary API Keys');
console.log('========================================\n');

// API Set 1
const api1 = {
  cloud_name: 'dlyehrepq',
  api_key: '313367428372376',
  api_secret: '313367428372376i5WiI2XkJ6qOZd4rNwIzsHqxF3E'
};

// API Set 2
const api2 = {
  cloud_name: 'dlyehrepq',
  api_key: '14488425659177',
  api_secret: 'CKhSc_3d2j1eOReyFNVGvvuu3zo'
};

async function testAPI(apiSet, name) {
  console.log(`\n--- Testing ${name} ---`);
  console.log('Cloud Name:', apiSet.cloud_name);
  console.log('API Key:', apiSet.api_key);
  console.log('API Secret:', '***' + apiSet.api_secret.slice(-4));
  
  cloudinary.config({
    cloud_name: apiSet.cloud_name,
    api_key: apiSet.api_key,
    api_secret: apiSet.api_secret,
    secure: true
  });

  try {
    const result = await cloudinary.api.ping();
    console.log('✅ SUCCESS! This API works!');
    console.log('Response:', result);
    return true;
  } catch (error) {
    console.log('❌ FAILED!');
    if (error.error) {
      console.log('Error:', error.error.message);
      console.log('HTTP Code:', error.error.http_code);
    } else {
      console.log('Error:', error.message || error);
    }
    return false;
  }
}

async function runTests() {
  const result1 = await testAPI(api1, 'API Set 1 (Old)');
  const result2 = await testAPI(api2, 'API Set 2 (New)');
  
  console.log('\n========================================');
  console.log('Test Results Summary');
  console.log('========================================');
  console.log('API Set 1 (Old):', result1 ? '✅ WORKS' : '❌ FAILED');
  console.log('API Set 2 (New):', result2 ? '✅ WORKS' : '❌ FAILED');
  
  if (result1) {
    console.log('\n🎉 Use API Set 1 (Old)');
  } else if (result2) {
    console.log('\n🎉 Use API Set 2 (New)');
  } else {
    console.log('\n⚠️  Both APIs failed! Need correct credentials.');
  }
  console.log('========================================\n');
}

runTests();
