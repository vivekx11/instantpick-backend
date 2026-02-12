const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');
const Product = require('../models/Product');

/**
 * @route   POST /api/upload/product
 * @desc    Upload product with image to Cloudinary and save to MongoDB
 * @access  Public (add authentication later if needed)
 */
router.post('/product', upload.single('image'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Extract product data from request body
    const { name, description, price, shopId, shopName, ownerId, category, stock, unit } = req.body;

    // Validate required fields - only basic fields needed
    if (!name || !description || !price) {
      // If validation fails, delete the uploaded image from Cloudinary
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, price'
      });
    }

    let finalShopId = shopId;
    let finalShopName = shopName || 'My Shop';
    
    // Auto-create shop if ownerId is provided
    if (ownerId) {
      const Shop = require('../models/Shop');
      
      // Check if owner already has a shop
      let ownerShop = await Shop.findOne({ ownerId: ownerId });
      
      if (!ownerShop) {
        // Create new shop for this owner
        console.log('Creating new shop for owner:', ownerId);
        ownerShop = new Shop({
          name: shopName || `${ownerId}'s Shop`,
          description: 'My shop selling quality products',
          category: 'General',
          address: 'Local Area',
          phone: ownerId,
          ownerName: shopName || 'Shop Owner',
          ownerId: ownerId,
          isApproved: true,
          isActive: true
        });
        await ownerShop.save();
        console.log('New shop created:', ownerShop._id);
      }
      
      finalShopId = ownerShop._id.toString();
      finalShopName = ownerShop.name;
    } else if (!finalShopId) {
      // Use default shop if no ownerId provided
      finalShopId = '698dc943148fdab957c75f4c';
    }

    // Get the Cloudinary URL
    const imageUrl = req.file.path;

    // Create new product
    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      shopId: finalShopId,
      shopName: finalShopName,
      category: category || 'General',
      imageUrls: [imageUrl],
      stock: stock ? parseInt(stock) : 0,
      unit: unit || 'piece',
      isAvailable: true
    });

    // Save to database
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
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
    console.error('Error uploading product:', error);
    
    // If there was an error and file was uploaded, try to delete it
    if (req.file && req.file.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (deleteError) {
        console.error('Error deleting uploaded file:', deleteError);
      }
    }

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
      // Delete uploaded files if product not found
      for (const file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Add new image URLs to product
    const newImageUrls = req.files.map(file => file.path);
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
    console.error('Error adding images:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (deleteError) {
          console.error('Error deleting file:', deleteError);
        }
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add images',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/upload/image
 * @desc    Delete image from Cloudinary
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

    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `marketplace/products/${filename.split('.')[0]}`;

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found or already deleted'
      });
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
});

module.exports = router;
