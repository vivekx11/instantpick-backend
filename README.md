# Marketplace Backend API

A Node.js/Express backend for the marketplace system with pickup codes.

## Features

- **Shop Management**: Register, list, and manage shops
- **Product Catalog**: Add, update, and manage products by shop
- **Order System**: Place orders with unique 6-digit pickup codes
- **Pickup Code Verification**: Verify codes for order completion
- **No Authentication**: Simple username-based system (no login required)

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)

### Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB** (if running locally)
```bash
mongod
```

5. **Start the server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Health Check
- `GET /api/health` - Check if API is running

### Shops
- `GET /api/shops` - Get all approved shops
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Register new shop
- `PUT /api/shops/:id` - Update shop
- `PUT /api/shops/:id/toggle-status` - Toggle shop open/closed
- `GET /api/shops/meta/categories` - Get shop categories

### Products
- `GET /api/products` - Get products (with filters)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/:id/toggle-availability` - Toggle availability

### Orders
- `POST /api/orders` - Place new order
- `GET /api/orders/verify/:pickupCode` - Verify pickup code
- `PUT /api/orders/:id/status` - Update order status
- `GET /api/orders/shop/:shopId` - Get orders for shop
- `GET /api/orders/user/:userId` - Get orders for user
- `GET /api/orders/:id` - Get order by ID

### Users
- `GET /api/users/profile/:username` - Get user profile
- `POST /api/users/profile` - Update user profile

## Data Models

### Shop
```javascript
{
  name: String,
  description: String,
  category: String,
  address: String,
  phone: String,
  ownerName: String,
  imageUrl: String,
  isActive: Boolean,
  isApproved: Boolean,
  isOpen: Boolean,
  rating: Number,
  totalOrders: Number,
  totalRevenue: Number
}
```

### Product
```javascript
{
  name: String,
  description: String,
  price: Number,
  shopId: ObjectId,
  shopName: String,
  category: String,
  imageUrls: [String],
  isAvailable: Boolean,
  stock: Number,
  unit: String,
  tags: [String]
}
```

### Order
```javascript
{
  userId: String,
  shopId: ObjectId,
  shopName: String,
  shopAddress: String,
  items: [OrderItem],
  totalAmount: Number,
  pickupCode: String, // 6-digit unique code
  status: String, // placed, accepted, preparing, ready, completed, cancelled
  notes: String,
  customerName: String,
  expiresAt: Date // 24 hours from creation
}
```

## Usage Examples

### Register a Shop
```bash
curl -X POST http://localhost:3000/api/shops \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Mart",
    "description": "Fresh groceries and vegetables",
    "category": "Grocery",
    "address": "123 Main Street",
    "phone": "+1234567890",
    "ownerName": "John Doe"
  }'
```

### Place an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "customer123",
    "shopId": "shop_id_here",
    "items": [
      {
        "productId": "product_id_here",
        "productName": "Fresh Apples",
        "price": 150,
        "quantity": 2
      }
    ],
    "totalAmount": 300,
    "customerName": "Jane Smith",
    "notes": "Please pack carefully"
  }'
```

### Verify Pickup Code
```bash
curl http://localhost:3000/api/orders/verify/123456
```

## Development

### Project Structure
```
backend/
├── models/          # Database models
├── routes/          # API route handlers
├── middleware/      # Custom middleware (future)
├── utils/           # Utility functions (future)
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # This file
```

### Adding New Features

1. **Create Model** (if needed) in `models/`
2. **Create Routes** in `routes/`
3. **Register Routes** in `server.js`
4. **Test Endpoints** using curl or Postman

### Database Indexes

The models include optimized indexes for:
- Shop search and filtering
- Product queries by shop
- Order lookup by pickup code
- Performance optimization

## Deployment

### Environment Variables
Set these in production:
- `NODE_ENV=production`
- `MONGODB_URI=your_production_mongodb_url`
- `PORT=3000` (or your preferred port)

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Integration with Flutter Apps

### User App Integration
- Use `/api/shops` to list shops
- Use `/api/products?shopId=X` to get shop products
- Use `/api/orders` to place orders
- Display pickup codes from order response

### Shop Owner App Integration
- Use `/api/shops` to register shop
- Use `/api/products` to manage products
- Use `/api/orders/shop/:shopId` to get orders
- Use `/api/orders/verify/:code` to verify pickup codes
- Use `/api/orders/:id/status` to update order status

## Support

For issues or questions:
1. Check the API health endpoint: `/api/health`
2. Review server logs for errors
3. Ensure MongoDB is running and accessible
4. Verify environment variables are set correctly