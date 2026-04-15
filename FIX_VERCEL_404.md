# FIX: Vercel 404 Errors - Complete Solution

## The Root Cause

You're seeing these errors:
```
api/auth/login:1 Failed to load resource: 404
vite.svg:1 Failed to load resource: 404
React error #31
```

**Why?** The `VITE_API_URL` environment variable is NOT set in Vercel, causing:
1. API calls to use relative paths (`/api/...`) instead of absolute (`https://biteops.onrender.com/api/...`)
2. This causes 404 errors because Vercel only serves the frontend, not the API

## What I Fixed

### ✅ 1. Created Centralized API Config (`client/src/config.js`)
- All API calls now use a single source of truth
- Shows warning in console if `VITE_API_URL` is missing
- Provides localhost fallback for development

### ✅ 2. Updated All Components
- Updated 18 component files to use centralized `API_URL`
- Removed scattered `import.meta.env.VITE_API_URL` references
- More maintainable and easier to debug

### ✅ 3. Added Debugging
- Console will show: `🌐 API URL: <your-backend-url>`
- Makes it easy to verify correct configuration

## CRITICAL: Set Environment Variable in Vercel

### Step-by-Step Instructions

**1. Go to Vercel Dashboard**
- Visit: https://vercel.com/dashboard
- Click your BiteOps project

**2. Navigate to Environment Variables**
- Click "Settings" tab
- Click "Environment Variables" in sidebar

**3. Add the Variable**
- Click "Add New"
- **Key**: `VITE_API_URL`
- **Value**: `https://biteops.onrender.com`
  - ⚠️ Replace with YOUR actual Render URL if different
  - ⚠️ NO trailing slash
  - ⚠️ Must include `https://`
- **Environments**: Check ALL THREE
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- Click "Save"

**4. Redeploy**
```bash
# First, commit and push the code changes
git add .
git commit -m "Fix API configuration with centralized config"
git push origin main
```

Then in Vercel dashboard:
- Go to "Deployments" tab
- Click "..." menu on latest deployment
- Click "Redeploy"
- **IMPORTANT**: Uncheck "Use existing Build Cache"
- Click "Redeploy"

## Verification

After redeployment, open your Vercel URL and check:

### 1. Browser Console
You should see:
```
🌐 API URL: https://biteops.onrender.com
```

If you see:
```
⚠️ WARNING: VITE_API_URL is not set!
```
Then the environment variable isn't configured correctly in Vercel.

### 2. Network Tab
- Open DevTools → Network tab
- Try to log in
- API calls should show as:
  - ✅ `https://biteops.onrender.com/api/auth/login`
  - ❌ NOT `api/auth/login` (relative path)

### 3. No Errors
- No 404 errors in console
- No React error #31
- Login should work (unless CORS needs configuration)

## If You Still See Errors

### CORS Errors (Good Progress!)
If you see CORS errors instead of 404, that means:
- ✅ API calls are reaching your backend
- ❌ Backend doesn't allow requests from Vercel domain

**Fix:** Update `server/server.js`:

```javascript
import cors from 'cors';

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',
    'https://your-app-*.vercel.app',  // For preview deployments
    'https://*.vercel.app'  // Allow all Vercel subdomains
  ],
  credentials: true
}));
```

Commit, push, and Render will auto-redeploy.

### Still 404 Errors
1. **Check environment variable name**: Must be exactly `VITE_API_URL` (case-sensitive)
2. **Check value**: Must start with `https://` and have NO trailing slash
3. **Clear cache**: Redeploy without build cache
4. **Check Vercel build logs**: Look for environment variable in logs

### React Error #31
This error means an object was passed to React where it expected something else. It's usually caused by API calls returning error objects. Once the 404s are fixed, this should go away.

## Testing Locally First

Before deploying, test locally with production backend:

```bash
cd client
VITE_API_URL=https://biteops.onrender.com npm run dev
```

Open http://localhost:3000 and verify:
- Console shows correct API URL
- Login works
- No errors

## Complete Checklist

Before redeploying to Vercel:

- [ ] Code changes committed and pushed to GitHub
- [ ] `VITE_API_URL` environment variable set in Vercel dashboard
- [ ] Environment variable applied to all three environments
- [ ] Value is `https://biteops.onrender.com` (your actual URL)
- [ ] Value has NO trailing slash
- [ ] Tested locally with production backend URL
- [ ] Ready to redeploy without build cache

## Quick Reference

| Platform | What It Does | URL |
|----------|-------------|-----|
| **Vercel** | Serves React frontend | `https://your-app.vercel.app` |
| **Render** | Serves Express backend + API | `https://biteops.onrender.com` |
| **Communication** | Frontend calls backend via `VITE_API_URL` | Must be set in Vercel! |

## After Everything Works

Once deployed and working:
1. Test all features (login, dashboard, data loading)
2. Check different pages for API errors
3. Verify uploads/images load correctly
4. Monitor Vercel and Render logs for errors

## Need More Help?

See also:
- `VERCEL_SETUP.md` - Detailed Vercel configuration guide
- `DEPLOYMENT_GUIDE.md` - Full deployment documentation
- `QUICK_START.md` - Quick reference

## Summary

The fix is simple but critical:
1. Set `VITE_API_URL` in Vercel dashboard
2. Commit and push code changes
3. Redeploy without cache
4. Verify in console

Without the environment variable, your frontend doesn't know where your backend is!
