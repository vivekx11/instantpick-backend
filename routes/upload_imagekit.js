const express = require('express');
const router = express.Router();
const { imagekit, upload } = require('../config/imagekit');
const Product = require('../models/Product');

/**
 * @route   POST /api/upload/product
 * @desc    Upload product with image to ImageKit and save to MongoDB
 * @access  Public
 */
router.post('/product', upload.single('image'), async (req, res) => {
  try {
    console.log('📤 Received upload request (ImageKit)');
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Extract product data from request body
    const { name, description, price, shopId, shopName, category, stock, unit } = req.body;

    // Validate required fields
    if (!name || !description || !price || !shopId || !shopName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price, shopId, shopName'
      });
    }

    console.log('📝 Product details:', { name, shopName, price });
    console.log('🖼️  Image details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: Math.round(req.file.size / 1024) + ' KB'
    });

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: req.file.buffer, // Buffer from multer
      fileName: `${Date.now()}_${req.file.originalname}`,
      folder: '/marketplace/products',
      useUniqueFileName: true,
      tags: [shopId, 'product'],
    });

    console.log('✅ Image uploaded to ImageKit:', uploadResponse.url);

    // Create new product
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      shopId,
      shopName,
      category: category || 'General',
      imageUrls: [uploadResponse.url],
      stock: stock ? parseInt(stock) : 0,
      unit: unit || 'piece',
      isAvailable: true
    });

    // Save to database
    await product.save();
    
    console.log('✅ Product saved to database:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: uploadResponse.url,
          imageUrls: product.imageUrls,
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

/**
 * @route   POST /api/upload/product/:id/images
 * @desc    Add additional images to existing product
 * @access  Public
 */
router.post('/product/:id/images', upload.array('images', 5), async (req, res) => {
  try {
    const productId = req.params.id;

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Upload all images to ImageKit
    const uploadPromises = req.files.map(file => 
      imagekit.upload({
        file: file.buffer,
        fileName: `${Date.now()}_${file.originalname}`,
        folder: '/marketplace/products',
        useUniqueFileName: true,
        tags: [product.shopId, 'product', productId],
      })
    );

    const uploadResults = await Promise.all(uploadPromises);
    const newImageUrls = uploadResults.map(result => result.url);

    // Add new image URLs to product
    product.imageUrls.push(...newImageUrls);
    await product.save();

    res.json({
      success: true,
      message: 'Images added successfully',
      data: {
        imageUrls: product.imageUrls
      }
    });

  } catch (error) {
    console.error('❌ Error adding images:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add images',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete image from ImageKit
 * @access  Public
 */
router.delete('/image', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Extract fileId from ImageKit URL
    // ImageKit URL format: https://ik.imagekit.io/zu0iv5zpd/path/fileId
    const urlParts = imageUrl.split('/');
    const fileId = urlParts[urlParts.length - 1].split('?')[0];

    // Delete from ImageKit
    await imagekit.deleteFile(fileId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

module.exports = router;
