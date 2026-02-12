const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0
  },
  shopId: {
    type: String,
    required: true,
    default: '698dc943148fdab957c75f4c' // Default shop ID
  },
  shopName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    default: 'General'
  },
  imageUrls: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'piece',
    enum: ['piece', 'kg', 'gram', 'liter', 'ml', 'dozen', 'pack']
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ shopId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for primary image
productSchema.virtual('imageUrl').get(function() {
  return this.imageUrls && this.imageUrls.length > 0 ? this.imageUrls[0] : '';
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (!this.isAvailable) return 'unavailable';
  if (this.stock <= 0) return 'out_of_stock';
  if (this.stock <= 5) return 'low_stock';
  return 'in_stock';
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update shop name if needed
productSchema.pre('save', async function(next) {
  try {
    if (this.isModified('shopId') && this.shopId && this.shopId !== 'unknown' && this.shopId !== 'default-shop') {
      const Shop = mongoose.model('Shop');
      
      // Check if shopId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(this.shopId)) {
        const shop = await Shop.findById(this.shopId);
        if (shop) {
          this.shopName = shop.name;
        }
      } else {
        // If shopId is not valid ObjectId, try to find by shop name
        const shop = await Shop.findOne({ name: this.shopId });
        if (shop) {
          this.shopId = shop._id.toString();
          this.shopName = shop.name;
        }
      }
    }
    next();
  } catch (error) {
    console.error('Error in product pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('Product', productSchema);