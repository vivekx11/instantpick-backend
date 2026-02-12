const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Grocery',
      'Electronics', 
      'Fashion',
      'Food & Beverages',
      'Health & Beauty',
      'Home & Garden',
      'Sports & Fitness',
      'Books & Stationery',
      'Toys & Games',
      'Other'
    ]
  },
  address: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 200
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 15
  },
  ownerName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  ownerId: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
shopSchema.index({ category: 1 });
shopSchema.index({ isActive: 1, isApproved: 1 });
shopSchema.index({ name: 'text', description: 'text' });

// Virtual for shop status
shopSchema.virtual('status').get(function() {
  if (!this.isApproved) return 'pending_approval';
  if (!this.isActive) return 'inactive';
  return this.isOpen ? 'open' : 'closed';
});

// Ensure virtual fields are serialized
shopSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Shop', shopSchema);