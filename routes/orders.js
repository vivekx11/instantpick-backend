const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Shop = require('../models/Shop');

// POST /api/orders - Place new order
router.post('/', async (req, res) => {
  try {
    const {
      userId,
      shopId,
      items,
      totalAmount,
      notes,
      customerName
    } = req.body;
    
    // Validation
    if (!userId || !shopId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Get shop details
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }
    
    if (!shop.isActive || !shop.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Shop is not available for orders'
      });
    }
    
    // Generate unique pickup code
    const pickupCode = await Order.generatePickupCode();
    
    // Create order
    const order = new Order({
      userId,
      shopId,
      shopName: shop.name,
      shopAddress: shop.address,
      items,
      totalAmount,
      pickupCode,
      notes: notes?.trim() || '',
      customerName: customerName.trim()
    });
    
    await order.save();
    
    // Update shop stats
    await Shop.findByIdAndUpdate(shopId, {
      $inc: { totalOrders: 1 }
    });
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
});

// GET /api/orders/verify/:pickupCode - Verify pickup code
router.get('/verify/:pickupCode', async (req, res) => {
  try {
    const { pickupCode } = req.params;
    
    if (!pickupCode || pickupCode.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pickup code format'
      });
    }
    
    const order = await Order.findOne({ pickupCode })
      .populate('shopId', 'name address phone')
      .select('-__v');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Invalid pickup code'
      });
    }
    
    // Check if order is expired
    if (order.isExpired) {
      return res.status(400).json({
        success: false,
        message: 'Pickup code has expired'
      });
    }
    
    // Check if order is already completed or cancelled
    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}`
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error verifying pickup code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify pickup code',
      error: error.message
    });
  }
});

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    
    const validStatuses = ['accepted', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if status transition is valid
    const currentStatus = order.status;
    const validTransitions = {
      'placed': ['accepted', 'cancelled'],
      'accepted': ['preparing', 'ready', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }
    
    // Update order
    order.status = status;
    if (status === 'cancelled' && cancellationReason) {
      order.cancellationReason = cancellationReason.trim();
    }
    
    await order.save();
    
    // Update shop revenue if order is completed
    if (status === 'completed') {
      await Shop.findByIdAndUpdate(order.shopId, {
        $inc: { totalRevenue: order.totalAmount }
      });
    }
    
    res.json({
      success: true,
      message: `Order ${status} successfully`,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});

// GET /api/orders/shop/:shopId - Get orders for a shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = { shopId };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Order.countDocuments(query);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shop orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/user/:userId - Get orders for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');
    
    const total = await Order.countDocuments({ userId });
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('shopId', 'name address phone')
      .select('-__v');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

module.exports = router;