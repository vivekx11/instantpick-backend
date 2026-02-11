const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for base64
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

/**
 * @route   POST /api/upload-base64/product
 * @desc    Upload product with base64 image (NO CLOUDINARY NEEDED)
 * @access  Public
 */
router.post('/product', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Received upload request (base64 mode)');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Extract product data
    const { name, description, price, shopId, shopName, category, stock, unit } = req.body;

    // Validate required fields
    if (!name || !description || !price || !shopId || !shopName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, shopId, shopName'
      });
    }

    console.log('📝 Product details:', { name, shopName, price });

    // Convert image to base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    console.log('🖼️  Image converted to base64 (size:', Math.round(base64Image.length / 1024), 'KB)');

    // Create new product with base64 image
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      shopId,
      shopName,
      category: category || 'General',
      imageUrls: [base64Image], // Store base64 directly
      stock: stock ? parseInt(stock) : 0,
      unit: unit || 'piece',
      isAvailable: true
    });

    // Save to database
    await product.save();
    
    console.log('✅ Product saved successfully:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully (base64 mode)',
      data: {
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: base64Image.substring(0, 100) + '...', // Truncate for response
          imageUrls: product.imageUrls.map(url => url.substring(0, 100) + '...'),
          shopId: product.shopId,
          shopName: product.shopName,
          category: product.category,
          stock: product.stock,
          unit: product.unit,
          isAvailable: product.isAvailable,
          createdAt: product.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Error uploading product:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to upload product',
      error: error.message
    });
  }
});

module.exports = router;
