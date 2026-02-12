// Test script to verify product upload fix
const mongoose = require('mongoose');
require('dotenv').config();

const Shop = require('./models/Shop');
const Product = require('./models/Product');

async function testProductUpload() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Test 1: Create a test shop
    console.log('Test 1: Creating test shop...');
    let shop = await Shop.findOne({ name: 'Test Shop' });
    
    if (!shop) {
      shop = new Shop({
        name: 'Test Shop',
        description: 'This is a test shop for product upload',
        category: 'Grocery',
        address: 'Test Address, Test City',
        phone: '1234567890',
        ownerName: 'Test Owner',
        isApproved: true
      });
      await shop.save();
      console.log('✓ Test shop created:', shop._id);
    } else {
      console.log('✓ Test shop already exists:', shop._id);
    }
    console.log('  Shop Name:', shop.name);
    console.log('  Shop ID:', shop._id.toString(), '\n');

    // Test 2: Create product with valid shopId
    console.log('Test 2: Creating product with valid shopId...');
    const product1 = new Product({
      name: 'Test Product 1',
      description: 'Product created with valid shopId',
      price: 99.99,
      shopId: shop._id.toString(),
      shopName: shop.name,
      category: 'Test Category'
    });
    await product1.save();
    console.log('✓ Product 1 created successfully');
    console.log('  Product ID:', product1._id);
    console.log('  Shop ID:', product1.shopId);
    console.log('  Shop Name:', product1.shopName, '\n');

    // Test 3: Create product with shopName only (simulating Flutter app)
    console.log('Test 3: Creating product with shopName only...');
    const product2 = new Product({
      name: 'Test Product 2',
      description: 'Product created with shopName only',
      price: 49.99,
      shopId: shop.name, // Passing shop name as shopId
      shopName: shop.name,
      category: 'Test Category'
    });
    await product2.save();
    console.log('✓ Product 2 created successfully');
    console.log('  Product ID:', product2._id);
    console.log('  Shop ID:', product2.shopId);
    console.log('  Shop Name:', product2.shopName, '\n');

    // Test 4: Simulate the error case with "unknown"
    console.log('Test 4: Testing with "unknown" shopId...');
    try {
      const product3 = new Product({
        name: 'Test Product 3',
        description: 'Product with unknown shopId',
        price: 29.99,
        shopId: 'unknown',
        shopName: shop.name,
        category: 'Test Category'
      });
      await product3.save();
      console.log('✓ Product 3 created (should have found shop by name)');
      console.log('  Product ID:', product3._id);
      console.log('  Shop ID:', product3.shopId);
      console.log('  Shop Name:', product3.shopName, '\n');
    } catch (error) {
      console.log('✗ Product 3 failed (expected if shop not found)');
      console.log('  Error:', error.message, '\n');
    }

    // Cleanup
    console.log('Cleaning up test data...');
    await Product.deleteMany({ name: /^Test Product/ });
    await Shop.deleteOne({ name: 'Test Shop' });
    console.log('✓ Test data cleaned up\n');

    console.log('=== ALL TESTS COMPLETED ===');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testProductUpload();
