const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Middleware to log response time
const responseTimeLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${duration}ms`);
  });
  next();
};

router.use(responseTimeLogger);

// GET /api/dashboard/summary/:ownerId - Get lightweight dashboard summary
router.get('/summary/:ownerId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { ownerId } = req.params;
    
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'ownerId is required'
      });
    }

    // Find shop by ownerId
    const shop = await Shop.findOne({ ownerId }).select('_id name isOpen isActive totalOrders totalRevenue').lean();
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found for this owner'
      });
    }

    const shopId = shop._id;

    // Run all queries in parallel for speed
    const [
      totalProducts,
      availableProducts,
      totalOrders,
      pendingOrders,
      acceptedOrders,
      completedOrders,
      todayRevenue,
      todayOrders
    ] = await Promise.all([
      // Product counts
      Product.countDocuments({ shopId }),
      Product.countDocuments({ shopId, isAvailable: true }),
      
      // Order counts
      Order.countDocuments({ shopId }),
      Order.countDocuments({ shopId, status: 'Pending' }),
      Order.countDocuments({ shopId, status: 'Accepted' }),
      Order.countDocuments({ shopId, status: 'Completed' }),
      
      // Today's stats
      Order.aggregate([
        {
          $match: {
            shopId,
            status: 'Completed',
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      Order.countDocuments({
        shopId,
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime: `${responseTime}ms`,
      data: {
        shop: {
          id: shop._id,
          name: shop.name,
          isOpen: shop.isOpen,
          isActive: shop.isActive
        },
        products: {
          total: totalProducts,
          available: availableProducts,
          unavailable: totalProducts - availableProducts
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          accepted: acceptedOrders,
          completed: completedOrders
        },
        revenue: {
          total: shop.totalRevenue || 0,
          today: todayRevenue[0]?.total || 0
        },
        today: {
          orders: todayOrders,
          revenue: todayRevenue[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard summary',
      error: error.message
    });
  }
});

// GET /api/dashboard/products/:shopId - Get paginated products
router.get('/products/:shopId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10, isAvailable } = req.query;
    
    const query = { shopId };
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .select('name price category imageUrls isAvailable stock')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime: `${responseTime}ms`,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + products.length < total
      }
    });
  } catch (error) {
    console.error('❌ Dashboard products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products',
      error: error.message
    });
  }
});

// GET /api/dashboard/orders/:shopId - Get paginated orders
router.get('/orders/:shopId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { shopId };
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .select('orderNumber status totalAmount customerName items createdAt pickupPin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime: `${responseTime}ms`,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + orders.length < total
      }
    });
  } catch (error) {
    console.error('❌ Dashboard orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load orders',
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-activity/:shopId - Get recent activity
router.get('/recent-activity/:shopId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { shopId } = req.params;
    const { limit = 5 } = req.query;
    
    const recentOrders = await Order.find({ shopId })
      .select('orderNumber status totalAmount customerName createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime: `${responseTime}ms`,
      data: recentOrders
    });
  } catch (error) {
    console.error('❌ Recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load recent activity',
      error: error.message
    });
  }
});

// GET /api/dashboard/stats/:shopId - Get detailed stats
router.get('/stats/:shopId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { shopId } = req.params;
    const { days = 7 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const [dailyStats, categoryStats] = await Promise.all([
      // Daily revenue and orders
      Order.aggregate([
        {
          $match: {
            shopId,
            status: 'Completed',
            createdAt: { $gte: daysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            orders: { $sum: 1 },
            revenue: { $sum: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Product category distribution
      Product.aggregate([
        { $match: { shopId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      responseTime: `${responseTime}ms`,
      data: {
        daily: dailyStats,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load stats',
      error: error.message
    });
  }
});

module.exports = router;
