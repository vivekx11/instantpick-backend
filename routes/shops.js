const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// GET /api/shops - Get all approved shops or by ownerId
router.get('/', async (req, res) => {
  try {
    const { category, search, isOpen, ownerId } = req.query;
    
    // Build query
    let query = {};
    
    // If ownerId is provided, search by ownerId (for shop owner app)
    if (ownerId) {
      query.ownerId = ownerId;
    } else {
      // Otherwise, show only approved shops (for user app)
      query.isActive = true;
      query.isApproved = true;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isOpen !== undefined) {
      query.isOpen = isOpen === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const shops = await Shop.find(query)
      .sort({ rating: -1, totalOrders: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
      error: error.message
    });
  }
});

// GET /api/shops/:id - Get shop by ID
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).select('-__v');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error fetching shop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop',
      error: error.message
    });
  }
});

// POST /api/shops - Register new shop
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      address,
      phone,
      ownerName,
      ownerId,
      imageUrl
    } = req.body;
    
    // Validation
    if (!name || !description || !category || !address || !phone || !ownerName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Check if shop name already exists
    const existingShop = await Shop.findOne({ name: name.trim() });
    if (existingShop) {
      return res.status(409).json({
        success: false,
        message: 'Shop name already exists'
      });
    }
    
    // Check if owner already has a shop
    if (ownerId) {
      const ownerShop = await Shop.findOne({ ownerId: ownerId });
      if (ownerShop) {
        return res.status(409).json({
          success: false,
          message: 'Owner already has a registered shop',
          data: ownerShop
        });
      }
    }
    
    // Create new shop
    const shop = new Shop({
      name: name.trim(),
      description: description.trim(),
      category,
      address: address.trim(),
      phone: phone.trim(),
      ownerName: ownerName.trim(),
      ownerId: ownerId || '',
      imageUrl: imageUrl || '',
      isApproved: true // Auto-approve for now
    });
    
    await shop.save();
    
    res.status(201).json({
      success: true,
      message: 'Shop registered successfully',
      data: shop
    });
  } catch (error) {
    console.error('Error registering shop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register shop',
      error: error.message
    });
  }
});

// PUT /api/shops/:id - Update shop
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.__v;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.totalOrders;
    delete updates.totalRevenue;
    
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Shop updated successfully',
      data: shop
    });
  } catch (error) {
    console.error('Error updating shop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop',
      error: error.message
    });
  }
});

// PUT /api/shops/:id/toggle-status - Toggle shop open/closed status
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    shop.isOpen = !shop.isOpen;
    await shop.save();
    
    res.json({
      success: true,
      message: `Shop ${shop.isOpen ? 'opened' : 'closed'} successfully`,
      data: { isOpen: shop.isOpen }
    });
  } catch (error) {
    console.error('Error toggling shop status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle shop status',
      error: error.message
    });
  }
});

// GET /api/shops/meta/categories - Get all categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      'Grocery',
      'Electronics', 
      'Fashion',
      'Food & Beverages',
      'Health & Beauty',
      'Home & Garden',
      'Sports & Fitness',
      'Books & Stationery',
      'Toys & Games',
      'Other'
    ];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// GET /api/shops/by-name/:name - Get shop by name
router.get('/by-name/:name', async (req, res) => {
  try {
    const shop = await Shop.findOne({ name: req.params.name }).select('-__v');
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    res.json({
      success: true,
      data: shop
    });
  } catch (error) {
    console.error('Error fetching shop by name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop',
      error: error.message
    });
  }
});

module.exports = router;