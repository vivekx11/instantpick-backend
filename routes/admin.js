const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Admin Authentication Middleware
const adminAuth = async (req, res, next) => {
  try {
    const adminKey = req.headers.adminkey || req.headers.adminKey;
    
    // Debug log (remove in production)
    console.log('Received admin key:', adminKey);
    console.log('Expected admin key:', process.env.ADMIN_KEY);
    
    if (!process.env.ADMIN_KEY) {
      return res.status(500).json({ success: false, message: 'Admin key not configured on server' });
    }
    
    if (!adminKey) {
      return res.status(403).json({ success: false, message: 'Admin key required' });
    }
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid admin key' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Dashboard Stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalShops, totalProducts, totalOrders, activeShops, pendingOrders] = await Promise.all([
      User.countDocuments(),
      Shop.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Shop.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'pending' })
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('shopId', 'name');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalShops,
        totalProducts,
        totalOrders,
        activeShops,
        pendingOrders
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Block/Unblock User
router.patch('/users/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete User
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Shops
router.get('/shops', adminAuth, async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, shops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Activate/Deactivate Shop
router.patch('/shops/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Shop not found' });
    }
    shop.isActive = !shop.isActive;
    await shop.save();
    res.json({ success: true, shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Shop
router.delete('/shops/:id', adminAuth, async (req, res) => {
  try {
    await Product.deleteMany({ shopId: req.params.id });
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Shop and products deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Products
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await Product.find()
      .populate('shopId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Product
router.patch('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete Product
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get All Orders
router.get('/orders', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('shopId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Order Status
router.patch('/orders/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// System Logs (Recent Activity)
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentShops = await Shop.find().sort({ createdAt: -1 }).limit(5);
    const recentProducts = await Product.find().sort({ createdAt: -1 }).limit(5);
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      logs: {
        recentUsers,
        recentShops,
        recentProducts,
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
