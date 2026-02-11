const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { shopId, category, search, isAvailable, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = {};
    
    if (shopId) {
      query.shopId = shopId;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const skip = (page - 1) * limit;
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('shopId', 'name isOpen')
      .select('-__v');
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('shopId', 'name address phone isOpen')
      .select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      shopId,
      shopName,
      category,
      imageUrls,
      stock,
      unit,
      tags
    } = req.body;
    
    // Validation
    if (!name || !description || !price || !shopId || !shopName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }
    
    // Create product
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      shopId,
      shopName: shopName.trim(),
      category: category || 'General',
      imageUrls: imageUrls || [],
      stock: stock || 0,
      unit: unit || 'piece',
      tags: tags || []
    });
    
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.shopId; // Shop ID should not be changed
    
    // Validate price if provided
    if (updates.price !== undefined && updates.price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
});

// PUT /api/products/:id/toggle-availability - Toggle product availability
router.put('/:id/toggle-availability', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.isAvailable = !product.isAvailable;
    await product.save();
    
    res.json({
      success: true,
      message: `Product ${product.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { isAvailable: product.isAvailable }
    });
  } catch (error) {
    console.error('Error toggling product availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product availability',
      error: error.message
    });
  }
});

// GET /api/products/shop/:shopId/categories - Get categories for a shop
router.get('/shop/:shopId/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { shopId: req.params.shopId });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

module.exports = router;