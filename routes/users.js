const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/users - Create or get user (Google Sign-In)
router.post('/', async (req, res) => {
  try {
    const { userId, name, email } = req.body;
    
    console.log('👤 User login request:', { userId, name, email });
    
    // Validation
    if (!userId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'userId, name, and email are required'
      });
    }
    
    // Check if user exists by email or userId
    let user = await User.findOne({ 
      $or: [{ userId }, { email }] 
    });
    
    if (user) {
      console.log('✅ Existing user found:', user.userId);
      
      // Update user info if changed
      let updated = false;
      if (user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (user.email !== email) {
        user.email = email;
        updated = true;
      }
      if (user.userId !== userId) {
        user.userId = userId;
        updated = true;
      }
      
      if (updated) {
        await user.save();
        console.log('📝 User info updated');
      }
      
      return res.json({
        success: true,
        message: 'User logged in successfully',
        data: user
      });
    }
    
    // Create new user
    user = new User({
      userId,
      name: name.trim(),
      email: email.trim(),
      isActive: true
    });
    
    await user.save();
    
    console.log('✅ New user created:', user.userId);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    console.error('❌ Error in user login:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process user login',
      error: error.message
    });
  }
});

// POST /api/users/init - Initialize or get user (Legacy support)
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
