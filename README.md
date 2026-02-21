# InstantPick Backend API

Node.js + Express + MongoDB backend for InstantPick marketplace application.

## Features

- Shop management with geolocation
- Product management with image upload (ImageKit)
- Order management with pickup codes
- User authentication
- Geospatial queries for nearby shops
- RESTful API design

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- ImageKit for image storage
- JWT for authentication

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_uri
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
JWT_SECRET=your_jwt_secret
```

## Installation

```bash
npm install
```

## Running Locally

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Shops
- `GET /api/shops` - Get all shops
- `GET /api/shops/:id` - Get shop by ID
- `POST /api/shops` - Create new shop
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order status

### Location
- `POST /api/location/shop/location` - Save shop location
- `POST /api/location/shops/nearby` - Get nearby shops
- `POST /api/location/shops/deliverable` - Get deliverable shops
- `GET /api/location/shops/radius` - Get shops within radius

### Upload
- `POST /api/upload` - Upload image to ImageKit

## Deployment on Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables
5. Deploy

## MongoDB Setup

1. Create MongoDB Atlas account
2. Create cluster
3. Get connection string
4. Add to MONGODB_URI in .env

## ImageKit Setup

1. Create ImageKit account
2. Get API keys from dashboard
3. Add to .env file

## License

MIT
