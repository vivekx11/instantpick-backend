const express = require('express');
const router = express.Router();

// Simple user routes for the no-login system
// In a real app, you might want to store user preferences, order history, etc.

// GET /api/users/profile/:username - Get user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    // For now, just return the username
    // In a real app, you might fetch user data from database
    res.json({
      success: true,
      data: {
        username: username,
        joinedAt: new Date().toISOString(),
        // Add more user fields as needed
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
});

// POST /api/users/profile - Update user profile
router.post('/profile', async (req, res) => {
  try {
    const { username, ...otherData } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    // For now, just return success
    // In a real app, you might save user data to database
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        username,
        ...otherData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: error.message
    });
  }
});

module.exports = router;