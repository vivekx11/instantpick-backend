const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  productImage: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  shopAddress: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  pickupCode: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'placed'
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  customerName: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  },
  acceptedAt: {
    type: Date
  },
  readyAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    maxlength: 200
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ pickupCode: 1 });
orderSchema.index({ shopId: 1, status: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ expiresAt: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual for order display name
orderSchema.virtual('statusDisplayName').get(function() {
  switch (this.status) {
    case 'placed':
      return 'Order Placed';
    case 'accepted':
      return 'Accepted by Shop';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready for Pickup';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
});

// Virtual for checking if order is expired
orderSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for time remaining
orderSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const remaining = this.expiresAt - now;
  
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });

// Static method to generate unique pickup code
orderSchema.statics.generatePickupCode = async function() {
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    // Generate 6-digit code
    code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if code already exists
    const existingOrder = await this.findOne({ pickupCode: code });
    if (!existingOrder) {
      isUnique = true;
    }
  }
  
  return code;
};

// Pre-save middleware to set timestamps for status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
      case 'ready':
        if (!this.readyAt) this.readyAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);