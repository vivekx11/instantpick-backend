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
    
    console.log('📦 New order request:', { userId, shopId, itemsCount: items?.length, totalAmount });
    
    // Validation
    if (!userId || !shopId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'userId, shopId, items, and totalAmount are required'
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
    
    // Generate 4-digit pickup PIN
    const pickupPin = Order.generatePickupPin();
    
    console.log('🔢 Generated PIN:', pickupPin);
    
    // Create order
    const order = new Order({
      userId,
      shopId,
      shopName: shop.name,
      shopAddress: shop.address,
      items,
      totalAmount,
      pickupPin,
      notes: notes?.trim() || '',
      customerName: customerName?.trim() || 'Guest',
      status: 'Pending'
    });
    
    await order.save();
    
    console.log('✅ Order created:', order._id);
    
    // Update shop stats
    await Shop.findByIdAndUpdate(shopId, {
      $inc: { totalOrders: 1 }
    });
    
    // Update user stats
    const User = require('../models/User');
    await User.findOneAndUpdate(
      { userId },
      { $inc: { totalOrders: 1, totalSpent: totalAmount } },
      { upsert: true }
    );
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        pickupPin: order.pickupPin,
        status: order.status,
        totalAmount: order.totalAmount,
        shopName: order.shopName,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error placing order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to place order',
      error: error.message
    });
  }
});

// POST /api/orders/verify-pin - Verify order PIN for pickup
router.post('/verify-pin', async (req, res) => {
  try {
    const { orderId, pickupPin } = req.body;
    
    console.log('🔍 Verifying PIN:', { orderId, pickupPin });
    
    if (!orderId || !pickupPin) {
      return res.status(400).json({
        success: false,
        message: 'orderId and pickupPin are required'
      });
    }
    
    // Find order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Check if order is already completed or cancelled
    if (order.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Order is already completed'
      });
    }
    
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is cancelled'
      });
    }
    
    // Check if order is accepted
    if (order.status !== 'Accepted') {
      return res.status(400).json({
        success: false,
        message: 'Order must be accepted before pickup'
      });
    }
    
    // Verify PIN
    if (order.pickupPin !== pickupPin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN'
      });
    }
    
    // Mark order as completed
    order.status = 'Completed';
    await order.save();
    
    console.log('✅ Order completed:', orderId);
    
    // Update shop revenue
    await Shop.findByIdAndUpdate(order.shopId, {
      $inc: { totalRevenue: order.totalAmount }
    });
    
    res.json({
      success: true,
      message: 'Order completed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    console.error('❌ Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify PIN',
      error: error.message
    });
  }
});

// GET /api/orders/verify/:pickupCode - Verify pickup code (legacy support)
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
    
    console.log('📝 Updating order status:', { orderId: req.params.id, status });
    
    const validStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Pending, Accepted, Completed, or Cancelled'
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
      'Pending': ['Accepted', 'Cancelled'],
      'Accepted': ['Completed', 'Cancelled'],
      'Completed': [],
      'Cancelled': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }
    
    // Update order
    order.status = status;
    if (status === 'Cancelled' && cancellationReason) {
      order.cancellationReason = cancellationReason.trim();
    }
    
    await order.save();
    
    console.log('✅ Order status updated:', { orderId: order._id, newStatus: status });
    
    // Update shop revenue if order is completed
    if (status === 'Completed') {
      await Shop.findByIdAndUpdate(order.shopId, {
        $inc: { totalRevenue: order.totalAmount }
      });
    }
    
    res.json({
      success: true,
      message: `Order ${status.toLowerCase()} successfully`,
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        pickupPin: order.pickupPin
      }
    });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
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