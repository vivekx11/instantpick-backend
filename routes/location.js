const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// Save shop location
router.post('/shop/location', async (req, res) => {
  try {
    const { shopId, latitude, longitude, deliveryRadius } = req.body;

    if (!shopId || !latitude || !longitude || !deliveryRadius) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates'
      });
    }

    if (deliveryRadius < 0 || deliveryRadius > 50) {
      return res.status(400).json({
        success: false,
        message: 'Delivery radius must be between 0 and 50 km'
      });
    }

    const shop = await Shop.findByIdAndUpdate(
      shopId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        deliveryRadius: deliveryRadius,
        locationSet: true
      },
      { new: true, runValidators: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      message: 'Location saved successfully',
      data: {
        shopId: shop._id,
        location: shop.location,
        deliveryRadius: shop.deliveryRadius
      }
    });
  } catch (error) {
    console.error('Error saving shop location:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get nearby shops
router.post('/shops/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const maxDistanceKm = maxDistance || 10;

    const shops = await Shop.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceKm * 1000
        }
      },
      isActive: true,
      isApproved: true
    }).select('name description category address phone location deliveryRadius rating totalOrders imageUrl');

    const shopsWithDistance = shops.map(shop => {
      const distance = calculateDistance(
        latitude,
        longitude,
        shop.location.coordinates[1],
        shop.location.coordinates[0]
      );

      return {
        ...shop.toObject(),
        distance: parseFloat(distance.toFixed(2)),
        withinDeliveryRadius: distance <= shop.deliveryRadius
      };
    });

    res.json({
      success: true,
      count: shopsWithDistance.length,
      data: shopsWithDistance
    });
  } catch (error) {
    console.error('Error fetching nearby shops:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get shops within delivery radius
router.post('/shops/deliverable', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const shops = await Shop.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          distanceMultiplier: 0.001,
          spherical: true,
          query: {
            isActive: true,
            isApproved: true
          }
        }
      },
      {
        $addFields: {
          withinDeliveryRadius: {
            $lte: ['$distance', '$deliveryRadius']
          }
        }
      },
      {
        $match: {
          withinDeliveryRadius: true
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          address: 1,
          phone: 1,
          location: 1,
          deliveryRadius: 1,
          rating: 1,
          totalOrders: 1,
          imageUrl: 1,
          distance: { $round: ['$distance', 2] }
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    res.json({
      success: true,
      count: shops.length,
      data: shops
    });
  } catch (error) {
    console.error('Error fetching deliverable shops:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get shops within specific radius
router.get('/shops/radius', async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const searchRadius = parseFloat(radius) || 5;

    const shops = await Shop.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          distanceField: 'distance',
          distanceMultiplier: 0.001,
          maxDistance: searchRadius * 1000,
          spherical: true,
          query: {
            isActive: true,
            isApproved: true
          }
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          address: 1,
          phone: 1,
          location: 1,
          deliveryRadius: 1,
          rating: 1,
          totalOrders: 1,
          imageUrl: 1,
          distance: { $round: ['$distance', 2] }
        }
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    res.json({
      success: true,
      count: shops.length,
      searchRadius: searchRadius,
      data: shops
    });
  } catch (error) {
    console.error('Error fetching shops by radius:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

module.exports = router;

// Check if shop location is set
router.get('/shop/:shopId/status', async (req, res) => {
  try {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId).select('locationSet location deliveryRadius');

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    res.json({
      success: true,
      data: {
        locationSet: shop.locationSet || false,
        hasCoordinates: shop.location && shop.location.coordinates && 
                       (shop.location.coordinates[0] !== 0 || shop.location.coordinates[1] !== 0),
        deliveryRadius: shop.deliveryRadius
      }
    });
  } catch (error) {
    console.error('Error checking shop location status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
