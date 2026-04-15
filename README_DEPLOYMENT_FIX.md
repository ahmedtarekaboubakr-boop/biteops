# 🚨 URGENT: Fix Your 404 Errors

## The Problem (Simple Explanation)

Your Vercel app is trying to call your API but doesn't know WHERE your backend is located!

Think of it like this:
- Your frontend (Vercel) is like a restaurant customer
- Your backend (Render) is like the kitchen
- The customer doesn't know where the kitchen is, so they're yelling orders into the air
- Result: Nothing works, 404 errors everywhere

## The Solution (3 Steps)

### STEP 1: Set Up Vercel Environment Variable

This tells your frontend WHERE your backend is:

1. Go to https://vercel.com/dashboard
2. Click your project → Settings → Environment Variables
3. Click "Add New"
   - Name: `VITE_API_URL`
   - Value: `https://biteops.onrender.com`
   - Check ALL boxes (Production, Preview, Development)
4. Click Save

**Screenshot guide:** Look for a button labeled "Add New" under Environment Variables section.

### STEP 2: Push Code Changes

I've fixed your code to properly use the environment variable:

```bash
git add .
git commit -m "Fix API configuration for Vercel deployment"
git push origin main
```

### STEP 3: Redeploy

**On Vercel:**
1. Go to Deployments tab
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. **UNCHECK** "Use existing Build Cache" ← IMPORTANT!
5. Click "Redeploy"
6. Wait 2-3 minutes

## How to Know It Worked

After redeployment, visit your Vercel URL and:

1. **Open browser DevTools** (Press F12)
2. **Look at the Console tab**
3. You should see: `🌐 API URL: https://biteops.onrender.com`

If you see a ⚠️ warning instead, the environment variable isn't set correctly.

## What I Changed in Your Code

### Created `client/src/config.js`
This is a central place for API configuration with built-in debugging.

### Updated 19 Files
All these files now use the centralized config:
- AuthContext.jsx
- All component files that make API calls
- Now they all get the backend URL from one place

### Added Helpful Warnings
If the environment variable is missing, you'll see a clear error message in the console.

## Common Issues & Solutions

### Issue 1: Still seeing `/api/auth/login` in Network tab
**Solution:** Environment variable not set correctly in Vercel
- Double-check the variable name is exactly `VITE_API_URL`
- Make sure you checked all three environment boxes
- Redeploy without cache

### Issue 2: Getting CORS errors instead of 404
**Good news!** This means your API calls are reaching the backend. Just need to allow Vercel domain:

Edit `server/server.js`:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app',  // Replace with your actual domain
    'https://*.vercel.app'  // For all preview deployments
  ],
  credentials: true
}))
```

### Issue 3: Environment variable "not found" in build logs
**Solution:** Vite requires variables to start with `VITE_`
- Must be: `VITE_API_URL`
- Not: `API_URL` or `REACT_APP_API_URL`

## Complete File Structure

```
BiteOps/
├── client/
│   ├── src/
│   │   ├── config.js          ← NEW: Central API configuration
│   │   ├── context/
│   │   │   └── AuthContext.jsx    ← UPDATED
│   │   └── components/        ← UPDATED: 18 files
│   └── .env                   ← Local development only, not deployed
├── server/                    ← Your backend (deploys to Render)
├── vercel.json               ← NEW: Vercel configuration
├── render.yaml               ← UPDATED: Render configuration
└── FIX_VERCEL_404.md        ← Detailed troubleshooting guide
```

## Quick Test Checklist

Before you say "it's working":

- [ ] Visit your Vercel URL
- [ ] Open DevTools (F12)
- [ ] Console shows correct API URL
- [ ] No 404 errors in Network tab
- [ ] Can see the login page
- [ ] Can log in successfully
- [ ] Dashboard loads without errors
- [ ] No React errors in console

## Emergency Contacts

If it's still not working after following these steps:

1. **Check Vercel Build Logs**
   - Go to Deployments → Click on deployment → View Build Logs
   - Look for "VITE_API_URL" in the logs
   - Should show your backend URL

2. **Check Render Logs**
   - Go to Render Dashboard → Your service → Logs
   - Make sure backend is running without errors

3. **Test Backend Directly**
   - Visit: `https://biteops.onrender.com/api/auth/me`
   - Should get a JSON response (even if it's an error about auth)
   - If you get HTML or nothing, backend isn't running

## Files to Read (In Order)

1. **This file** - Start here for quick fix
2. `FIX_VERCEL_404.md` - Detailed explanation of the fix
3. `VERCEL_SETUP.md` - Step-by-step Vercel configuration
4. `DEPLOYMENT_GUIDE.md` - Complete deployment documentation

## TL;DR (Too Long, Didn't Read)

1. Set `VITE_API_URL=https://biteops.onrender.com` in Vercel dashboard
2. Run: `git add . && git commit -m "fix" && git push`
3. Redeploy Vercel without cache
4. Check console for `🌐 API URL:` message
5. Done!

---

**Questions?** Check the browser console first - it has helpful debugging messages now!
