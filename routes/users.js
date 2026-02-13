const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users/init - Initialize or get user
router.post('/init', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Get or create user
    const user = await User.getOrCreate(userId);
    
    res.json({
      success: true,
      message: userId ? 'User found' : 'New user created',
      data: {
        userId: user.userId,
        name: user.name,
        totalOrders: user.totalOrders,
        totalSpent: user.totalSpent
      }
    });
  } catch (error) {
    console.error('Error initializing user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize user',
      error: error.message
    });
  }
});

// GET /api/users/:userId - Get user details
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// PUT /api/users/:userId - Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (email) user.email = email.trim();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

module.exports = router;
