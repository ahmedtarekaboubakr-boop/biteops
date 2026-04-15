# Vercel Setup - Fix API 404 Errors

## The Problem

Your Vercel deployment is showing 404 errors for API calls because `VITE_API_URL` environment variable is not set in Vercel's dashboard.

The error `api/auth/login:1 Failed to load resource: 404` means the API URL is undefined, causing relative paths instead of absolute URLs to your Render backend.

## Solution: Set Environment Variable in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit https://vercel.com/dashboard
2. Click on your project (BiteOps)
3. Click "Settings" tab
4. Click "Environment Variables" in the left sidebar

### Step 2: Add VITE_API_URL

Click "Add New" and enter:

**Key**: `VITE_API_URL`  
**Value**: `https://biteops.onrender.com` (or your actual Render URL)  
**Environments**: Check all three:
- ✅ Production
- ✅ Preview  
- ✅ Development

Click "Save"

### Step 3: Redeploy

After adding the environment variable:

1. Go to "Deployments" tab
2. Find the latest deployment
3. Click the "..." menu → "Redeploy"
4. **IMPORTANT**: Check "Use existing Build Cache" = OFF
5. Click "Redeploy"

Wait 2-3 minutes for deployment to complete.

### Step 4: Verify

1. Visit your Vercel URL
2. Open browser DevTools (F12)
3. Look in Console for: `🌐 API URL: https://biteops.onrender.com`
4. Try logging in
5. Check Network tab - API calls should go to your Render URL

## Alternative: Use vercel.json (Not Recommended)

While `vercel.json` can set environment variables, it's better to use the dashboard because:
- Dashboard values can be changed without redeploying
- More secure (not in git history)
- Easier to manage different environments

## Troubleshooting

### Issue: Still seeing relative API URLs
**Solution**: 
- Make sure you saved the environment variable
- Clear build cache when redeploying
- Check browser console for the `🌐 API URL:` message

### Issue: CORS errors instead of 404
**Solution**: That's actually progress! It means API calls are reaching your backend. Update CORS in `server/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://your-app-git-*.vercel.app'  // For preview deployments
  ],
  credentials: true
}))
```

### Issue: Environment variable not showing in build logs
**Solution**: 
- Vite only exposes variables starting with `VITE_`
- Make sure the variable name is exactly `VITE_API_URL`
- Redeploy without cache

## Quick Checklist

Before you redeploy, verify:

- [ ] Environment variable is named `VITE_API_URL` (case-sensitive)
- [ ] Value includes `https://` prefix
- [ ] Value has NO trailing slash
- [ ] All three environments (Production, Preview, Development) are checked
- [ ] Latest code is pushed to GitHub
- [ ] Redeploy without cache

## Testing Locally with Production Config

To test with your production backend URL locally:

```bash
cd client
VITE_API_URL=https://biteops.onrender.com npm run dev
```

Or update `client/.env.local` (create if it doesn't exist):
```
VITE_API_URL=https://biteops.onrender.com
```

## Expected Result

After setting the environment variable and redeploying:

✅ Login page loads  
✅ No 404 errors for API calls  
✅ API calls go to `https://biteops.onrender.com/api/*`  
✅ Console shows: `🌐 API URL: https://biteops.onrender.com`  
✅ Can log in successfully  
