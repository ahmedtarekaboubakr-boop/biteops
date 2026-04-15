# Complete Deployment Guide - BiteOps

## Architecture Overview

- **Frontend (Vercel)**: React SPA deployed to Vercel
- **Backend (Render)**: Express + MongoDB deployed to Render
- **Communication**: Frontend calls backend API via CORS

## What Was Fixed

### Problem
You were getting 404 errors because:
1. Both Vercel and Render were trying to deploy the full monorepo
2. Neither platform knew what to deploy or how to configure it
3. There was a hardcoded `localhost:3001` URL in Tutorials.jsx
4. Build outputs weren't going to the right locations

### Solution
1. ✅ Created separate deployment configs for Vercel (frontend) and Render (backend)
2. ✅ Fixed Vite config to output to different directories based on target platform
3. ✅ Removed hardcoded localhost URLs
4. ✅ Configured proper environment variables

## Deployment Steps

### Step 1: Push Your Changes

```bash
git add .
git commit -m "Configure separate Vercel and Render deployments"
git push origin main
```

### Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`
5. Add these environment variables:
   - `MONGODB_URI` - Your MongoDB connection string (e.g., from MongoDB Atlas)
   - `JWT_SECRET` - A secure random string (e.g., `openssl rand -base64 32`)
   - `NODE_ENV` - Set to `production`
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Note your backend URL** (e.g., `https://biteops.onrender.com`)

### Step 3: Update Frontend Environment Variable

Before deploying to Vercel, make sure your backend URL is correct:

1. Update `client/.env`:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

2. Update `vercel.json` to use your actual backend URL:
   ```json
   "env": {
     "VITE_API_URL": "https://your-backend-url.onrender.com"
   }
   ```

3. Commit and push:
   ```bash
   git add client/.env vercel.json
   git commit -m "Update backend URL for production"
   git push
   ```

### Step 4: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **Important**: Select "Root Directory" (not a subdirectory)
5. Vercel will auto-detect `vercel.json` configuration
6. Add environment variable:
   - `VITE_API_URL` - Your Render backend URL
7. Click "Deploy"
8. Wait for deployment (2-3 minutes)

### Step 5: Configure CORS on Backend

If you get CORS errors, update your backend CORS configuration:

1. Edit `server/server.js` to allow your Vercel domain:
   ```javascript
   app.use(cors({
     origin: [
       'http://localhost:3000',
       'https://biteops.vercel.app',
       'https://your-vercel-domain.vercel.app'
     ],
     credentials: true
   }));
   ```

2. Commit and push to trigger Render redeployment

## URLs After Deployment

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://biteops.onrender.com`
- **API Endpoints**: `https://biteops.onrender.com/api/*`

## Testing Your Deployment

1. Visit your Vercel URL
2. Try logging in with test credentials
3. Open browser DevTools → Network tab
4. Verify API calls go to your Render backend URL
5. Check for:
   - ✅ No 404 errors
   - ✅ API calls return data
   - ✅ Routes work (login, dashboard, etc.)
   - ✅ Favicon loads correctly

## Environment Variables Reference

### Render (Backend)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=10000
```

### Vercel (Frontend)
```
VITE_API_URL=https://biteops.onrender.com
```

### Local Development
```
# client/.env
VITE_API_URL=http://localhost:3001

# server/.env
MONGODB_URI=mongodb://localhost:27017/biteops
JWT_SECRET=dev-secret-key
PORT=3001
```

## Troubleshooting

### Issue: Still Getting 404 on Vercel
- **Solution**: Make sure you pushed the `vercel.json` file to GitHub
- Check Vercel build logs for errors
- Verify `VITE_API_URL` environment variable is set in Vercel dashboard

### Issue: API Calls Failing
- **Solution**: Check CORS configuration in `server/server.js`
- Verify Render backend is running (check Render logs)
- Verify `VITE_API_URL` matches your Render backend URL

### Issue: 404 on Backend Routes
- **Solution**: Check Render logs for errors
- Verify MongoDB connection string is correct
- Make sure `JWT_SECRET` is set in Render environment

### Issue: Render Build Fails
- **Solution**: Check build logs in Render dashboard
- Verify `render.yaml` was pushed to GitHub
- Make sure all dependencies are in `package.json`

### Issue: Blank Page on Vercel
- **Solution**: Check browser console for errors
- Verify build completed successfully in Vercel
- Check that assets loaded correctly (no 404s)

## Local Development

To test everything locally:

```bash
# Terminal 1 - Start backend
cd server
npm install
npm run dev

# Terminal 2 - Start frontend
cd client
npm install
npm run dev

# Visit http://localhost:3000
```

## Important Notes

1. **Render Free Tier**: Service sleeps after 15 minutes of inactivity. First request after sleep may take 30-60 seconds.

2. **MongoDB Atlas**: Make sure to whitelist Render's IP addresses (or use `0.0.0.0/0` for all IPs).

3. **Environment Variables**: Never commit `.env` files to GitHub. They're already in `.gitignore`.

4. **Dist Folders**: The `dist/` folders are now in `.gitignore` and will be built automatically during deployment.

5. **Build Process**:
   - Vercel builds to `client/dist/` (frontend only)
   - Render builds to `server/dist/` (includes frontend for serving)

## Support

If you're still having issues:
1. Check the platform-specific logs (Vercel or Render dashboard)
2. Verify all environment variables are set correctly
3. Make sure MongoDB is accessible from Render
4. Check that your GitHub repo has all the latest changes
