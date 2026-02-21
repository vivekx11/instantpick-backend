const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'Guest User'
  },
  phone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: '',
    sparse: true,
    index: true
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  address: {
    type: String,
    default: ''
  },
  locationSet: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ createdAt: -1 });
userSchema.index({ location: '2dsphere' });

// Static method to generate unique userId
userSchema.statics.generateUserId = async function() {
  let userId;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate userId: USER + timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    userId = `USER${timestamp}${random}`;
    
    // Check if userId already exists
    const existingUser = await this.findOne({ userId });
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  return userId;
};

// Static method to get or create user
userSchema.statics.getOrCreate = async function(userId) {
  if (userId) {
    // Try to find existing user
    let user = await this.findOne({ userId });
    if (user) {
      return user;
    }
  }
  
  // Create new user
  const newUserId = await this.generateUserId();
  const user = new this({
    userId: newUserId,
    name: 'Guest User'
  });
  
  await user.save();
  return user;
};

module.exports = mongoose.model('User', userSchema);
