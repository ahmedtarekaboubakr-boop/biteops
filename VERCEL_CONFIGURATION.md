# Vercel Configuration Guide - Fix Build Error

## The Build Error

You're seeing:
```
Error: Command "cd client && npm install && BUILD_TARGET=vercel npm run build" exited with 1
```

This happens because Vercel doesn't support custom build commands in `vercel.json` the way we initially configured it.

## The Proper Solution

Configure Vercel through its dashboard, not just `vercel.json`. Here's how:

### Step 1: Configure Root Directory

1. Go to https://vercel.com/dashboard
2. Click your project (BiteOps)
3. Go to **Settings** → **General**
4. Find **"Root Directory"** section
5. Click **"Edit"**
6. Set to: `client`
7. Check **"Include source files outside of the Root Directory in the Build Step"**
8. Click **"Save"**

### Step 2: Configure Build Settings

While still in **Settings** → **General**:

1. Find **"Build & Development Settings"**
2. Click **"Override"** if needed
3. Configure:
   - **Framework Preset**: `Vite`
   - **Build Command**: Leave as default (`npm run build`) or set to `BUILD_TARGET=vercel npm run build`
   - **Output Directory**: Leave as default (`dist`)
   - **Install Command**: Leave as default (`npm install`)

### Step 3: Set Environment Variables

Go to **Settings** → **Environment Variables**:

1. Click **"Add New"**
2. **Key**: `VITE_API_URL`
3. **Value**: `https://biteops.onrender.com`
4. **Environments**: Check ALL
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. Click **"Save"**

### Step 4: Update vite.config.js (Already Done)

The `client/vite.config.js` is already configured to output to the correct directory based on `BUILD_TARGET`.

### Step 5: Commit and Deploy

```bash
git add .
git commit -m "Fix Vercel configuration - simplify vercel.json"
git push origin main
```

Then in Vercel:
1. Go to **Deployments**
2. Click **"Redeploy"** on latest
3. **Uncheck** "Use existing Build Cache"
4. Click **"Redeploy"**

## Alternative: Deploy with Vercel CLI

If the dashboard configuration doesn't work, you can deploy directly:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login
vercel login

# Deploy from client folder
cd client
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? Yes (select your project)
# - Override settings? No
```

## Troubleshooting

### Build still failing?

Check the build logs in Vercel:
1. Go to Deployments
2. Click on the failed deployment
3. Click "View Build Logs"
4. Look for specific error messages

Common issues:

**Issue: "Cannot find module"**
- Solution: Make sure `client/package.json` has all dependencies
- Try: Add `BUILD_TARGET=vercel` to build command in Vercel dashboard

**Issue: "VITE_API_URL is not defined"**
- Solution: Environment variable not set in Vercel dashboard
- Go to Settings → Environment Variables and add it

**Issue: "Build exceeded maximum duration"**
- Solution: Your free tier might have limits
- Try: Remove node_modules before build (Vercel does this automatically)

### Verify Configuration

After setting everything up:

1. Check **Settings → General → Root Directory** = `client`
2. Check **Settings → Environment Variables** has `VITE_API_URL`
3. Check **Settings → General → Build & Development Settings** is set to Vite framework

## Expected Build Output

When Vercel builds successfully, you should see:

```
Installing dependencies...
Running build command...
✓ 107 modules transformed
✓ built in X seconds
Build completed successfully
```

## Simplified vercel.json

The new `vercel.json` only handles routing (SPA configuration):

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

All other configuration (build commands, environment variables, root directory) is set in the Vercel dashboard.

## Why This Approach?

Configuring through the Vercel dashboard is:
- ✅ More reliable than vercel.json build commands
- ✅ Easier to change without redeploying
- ✅ Better for monorepo setups
- ✅ The recommended Vercel best practice

## Quick Checklist

Before redeploying:

- [ ] Root Directory set to `client` in Vercel dashboard
- [ ] Framework Preset set to `Vite`
- [ ] `VITE_API_URL` environment variable added
- [ ] Latest code pushed to GitHub
- [ ] Ready to redeploy without cache

## Summary

1. **Don't use** complex build commands in vercel.json
2. **Do use** Vercel dashboard for configuration
3. **Set Root Directory** to `client`
4. **Set Environment Variable** `VITE_API_URL`
5. **Redeploy** and it should work!
