# Render Deployment Guide

## Prerequisites

1. GitHub account
2. Render account (https://render.com)
3. MongoDB Atlas account
4. ImageKit account (optional)

## Step 1: Prepare Backend for Render

Backend is already configured for Render deployment:
- ✅ Listens on `0.0.0.0` (all interfaces)
- ✅ Uses `process.env.PORT` from Render
- ✅ Environment-based configuration
- ✅ Production-ready error handling

## Step 2: Push to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial commit - InstantPick backend"
git branch -M main
git remote add origin https://github.com/vivekx11/instantpick-backend.git
git push -u origin main
```

## Step 3: Create MongoDB Atlas Database

1. Go to https://cloud.mongodb.com
2. Create new cluster (Free tier available)
3. Create database user
4. Whitelist all IPs: `0.0.0.0/0`
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/instantpick?retryWrites=true&w=majority
   ```

## Step 4: Setup ImageKit (Optional)

1. Go to https://imagekit.io
2. Sign up for free account
3. Get credentials from Dashboard:
   - Public Key
   - Private Key
   - URL Endpoint

## Step 5: Deploy on Render

### Create Web Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `vivekx11/instantpick-backend`
4. Configure:
   - **Name**: `instantpick-backend`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `backend` if in monorepo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Set Environment Variables

Add these in Render dashboard (Environment tab):

```
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/instantpick?retryWrites=true&w=majority
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
JWT_SECRET=your_random_secret_key_here
```

### Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Get your URL: `https://instantpick-backend.onrender.com`

## Step 6: Test Deployment

### Health Check
```bash
curl https://instantpick-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Marketplace API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test API Endpoints
```bash
# Get shops
curl https://instantpick-backend.onrender.com/api/shops

# Get products
curl https://instantpick-backend.onrender.com/api/products
```

## Step 7: Update Flutter Apps

Update API base URL in both apps:

### Shop Owner App
`shop_owner_app/lib/services/api_service.dart`:
```dart
static const String baseUrl = 'https://instantpick-backend.onrender.com/api';
```

### User App
`user_app/lib/services/api_service.dart`:
```dart
static const String baseUrl = 'https://instantpick-backend.onrender.com/api';
```

## Step 8: Create Geo Index

After first deployment, run this once:

```bash
# SSH into Render or use Render Shell
node create_geo_index.js
```

Or create a one-time job on Render:
1. Go to Jobs
2. Create new job
3. Command: `node create_geo_index.js`
4. Run once

## Monitoring

### View Logs
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab

### Check Status
- Service status: Green = Running
- Last deploy: Shows deployment time
- Health checks: Automatic

## Troubleshooting

### Service Won't Start
- Check logs for errors
- Verify MONGODB_URI is correct
- Ensure all required env vars are set

### Database Connection Failed
- Check MongoDB Atlas IP whitelist (0.0.0.0/0)
- Verify connection string format
- Check database user credentials

### 502 Bad Gateway
- Service is starting (wait 1-2 minutes)
- Check if PORT is set correctly
- Review logs for startup errors

### ImageKit Upload Fails
- Verify ImageKit credentials
- Check ImageKit dashboard for errors
- Falls back to base64 if ImageKit unavailable

## Free Tier Limitations

Render Free Tier:
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month free

MongoDB Atlas Free Tier:
- 512 MB storage
- Shared CPU
- No backup

ImageKit Free Tier:
- 20 GB bandwidth/month
- 20 GB storage

## Upgrade Options

For production:
- Render: $7/month for always-on service
- MongoDB Atlas: $9/month for dedicated cluster
- ImageKit: $49/month for more bandwidth

## Auto-Deploy

Render automatically deploys when you push to GitHub:

```bash
cd backend
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect push
2. Run build command
3. Deploy new version
4. Zero-downtime deployment

## Custom Domain (Optional)

1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records
4. SSL certificate auto-generated

## Backup Strategy

### Database Backup
- MongoDB Atlas: Enable automated backups
- Export data periodically

### Code Backup
- GitHub repository (already done)
- Keep local copy

## Security Checklist

- ✅ Environment variables not in code
- ✅ .env file in .gitignore
- ✅ MongoDB IP whitelist configured
- ✅ CORS enabled for specific origins
- ✅ Error messages don't expose internals
- ✅ JWT secret is strong and random

## Support

- Render Docs: https://render.com/docs
- MongoDB Docs: https://docs.mongodb.com
- ImageKit Docs: https://docs.imagekit.io

## Your Deployment URLs

After deployment, update these:

- Backend API: `https://instantpick-backend.onrender.com`
- Health Check: `https://instantpick-backend.onrender.com/api/health`
- MongoDB: Your Atlas connection string
- ImageKit: Your ImageKit URL endpoint
