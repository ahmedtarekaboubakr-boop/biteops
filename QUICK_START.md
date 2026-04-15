# Quick Start - Fix 404 Errors

## The Issue
Both Vercel and Render are deployed but showing 404 errors because they don't know how to handle your monorepo structure.

## Quick Fix (Follow These Steps)

### 1. Update Backend URL (If Different)

Check your Render backend URL and update these files:

**`client/.env`**
```
VITE_API_URL=https://biteops.onrender.com
```

**`vercel.json`** (line 9)
```json
"VITE_API_URL": "https://biteops.onrender.com"
```

Replace `biteops.onrender.com` with your actual Render URL if different.

### 2. Commit and Push

```bash
git add .
git commit -m "Fix deployment configuration for Vercel and Render"
git push origin main
```

### 3. Trigger Redeployments

**Render:**
1. Go to https://dashboard.render.com
2. Find your "biteops" service
3. Click "Manual Deploy" → "Deploy latest commit"

**Vercel:**
1. Go to https://vercel.com/dashboard
2. Find your project
3. Click "Deployments" tab
4. Click "Redeploy" on the latest deployment

### 4. Wait and Test

- Render: 5-10 minutes
- Vercel: 2-3 minutes

Then visit your Vercel URL and everything should work!

## What Changed?

✅ Fixed Vite config to build to correct directories  
✅ Removed hardcoded localhost URLs  
✅ Created proper Vercel and Render configurations  
✅ Added favicon to prevent 404 errors  

## Still Getting Errors?

See the full `DEPLOYMENT_GUIDE.md` for troubleshooting steps.

## Environment Variables Checklist

### Render Dashboard
- [ ] `MONGODB_URI` - Your MongoDB connection string
- [ ] `JWT_SECRET` - Random secure string
- [ ] `NODE_ENV` - Set to `production`

### Vercel Dashboard
- [ ] `VITE_API_URL` - Your Render backend URL

## Quick Commands

```bash
# Test build locally (Render target)
cd client && BUILD_TARGET=render npm run build && cd ..

# Test build locally (Vercel target)
cd client && BUILD_TARGET=vercel npm run build && cd ..

# Run locally
npm run dev
```
