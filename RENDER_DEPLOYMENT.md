# Render Deployment Guide

## The Issue That Was Fixed

The 404 errors occurred because:
1. The client was building to `client/dist/`
2. But the server was trying to serve from `server/dist/`
3. When deployed to Render, the built files weren't in the correct location

## What Was Changed

### 1. Vite Configuration (`client/vite.config.js`)
- Added `build.outDir: '../server/dist'` to output directly to the server's dist folder
- Added `build.emptyOutDir: true` to clean the folder before each build

### 2. Root Package.json
- Updated `build` script to ensure client dependencies are installed before building
- Added `start` script to run the server after deployment

### 3. Created `render.yaml`
- Automated deployment configuration for Render
- Proper build and start commands

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub (including the render.yaml file)
2. In Render dashboard:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` configuration
   - Click "Create Web Service"

### Option 2: Manual Configuration

1. In Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: biteops (or your preferred name)
   - **Runtime**: Node
   - **Build Command**: 
     ```
     npm install && cd server && npm install && cd ../client && npm install && npm run build
     ```
   - **Start Command**:
     ```
     cd server && npm start
     ```
   - **Environment Variables**:
     - `NODE_VERSION` = `18.17.0`
     - `MONGODB_URI` = (your MongoDB connection string)
     - `JWT_SECRET` = (your JWT secret)
     - Any other environment variables from your `.env` file

4. Click "Create Web Service"

## Environment Variables

Make sure to add these in your Render dashboard under "Environment":

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV` - Set to `production`
- Any other variables from your `.env` files

## After Deployment

Your app will be available at: `https://your-app-name.onrender.com`

All routes (including `/login`, `/dashboard`, etc.) should work correctly because:
1. The client build outputs to `server/dist/`
2. The server serves static files from `dist/`
3. The server has a catch-all route to serve `index.html` for client-side routing

## Testing Locally

To test the production build locally:

```bash
# Build the client
npm run build

# Start the server
npm start

# Visit http://localhost:3001
```

## Troubleshooting

If you still see 404 errors after deployment:

1. Check Render logs for build errors
2. Verify `server/dist/` has `index.html` and `assets/` folder
3. Ensure all environment variables are set correctly
4. Make sure the MongoDB connection string is valid and accessible from Render's servers
