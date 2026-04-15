# Fix: Vercel "No Output Directory" Error

## The Error
```
Error: No Output Directory named "dist" found after the Build completed.
```

## Root Cause
When Root Directory is set to `client`, Vercel looks for the output in `client/dist/`, but the build wasn't configured to output there.

## The Fix (Already Applied)

### Updated `vercel.json`

```json
{
  "buildCommand": "BUILD_TARGET=vercel npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "build": {
    "env": {
      "VITE_API_URL": "https://biteops.onrender.com"
    }
  }
}
```

**What this does:**
- `buildCommand`: Sets `BUILD_TARGET=vercel` which tells vite to output to `dist` (not `../server/dist`)
- `outputDirectory`: Tells Vercel to look for `dist` folder
- `build.env`: Sets the API URL at build time

### How It Works

The `client/vite.config.js` checks the `BUILD_TARGET`:

```javascript
build: {
  outDir: process.env.BUILD_TARGET === 'vercel' ? 'dist' : '../server/dist',
  emptyOutDir: true
}
```

- If `BUILD_TARGET=vercel` → outputs to `client/dist/` ✅ (Vercel finds it)
- Otherwise → outputs to `server/dist/` ✅ (Render finds it)

## Deployment Steps

### Step 1: Verify Root Directory is Set

In Vercel dashboard:
1. Settings → General → Root Directory
2. Should be set to: `client`
3. ✅ "Include source files outside Root Directory" should be checked

### Step 2: Set Environment Variable (Recommended)

While `vercel.json` has the API URL, it's better to also set it in dashboard:

1. Settings → Environment Variables
2. Add if not exists:
   - Key: `VITE_API_URL`
   - Value: `https://biteops.onrender.com`
   - ✅ Check all three boxes

### Step 3: Commit and Deploy

```bash
git add .
git commit -m "Fix Vercel output directory configuration"
git push origin main
```

### Step 4: Redeploy (If Needed)

If Vercel doesn't auto-deploy:
1. Go to Deployments tab
2. Click "Redeploy"
3. **Uncheck** "Use existing Build Cache"
4. Click "Redeploy"

## Verification

### Check Build Logs

After deployment, check Vercel build logs for:

```
Running "BUILD_TARGET=vercel npm run build"
✓ 107 modules transformed
dist/index.html                   0.48 kB
dist/assets/index-XXXXX.css       36.49 kB
dist/assets/index-XXXXX.js        456.92 kB
✓ built in X seconds
```

Key indicators:
- ✅ Shows `dist/index.html` (not `../server/dist/index.html`)
- ✅ Build completes successfully
- ✅ Deployment succeeds

### Check Deployment

Visit your Vercel URL:
- ✅ Login page loads
- ✅ No 404 errors
- ✅ Console shows: `🌐 API URL: https://biteops.onrender.com`
- ✅ Assets load correctly

## Alternative: Manual Configuration

If you prefer not to use `vercel.json` build command:

### Option A: Set in Vercel Dashboard

1. Settings → General → Build & Development Settings
2. Override: Yes
3. Build Command: `BUILD_TARGET=vercel npm run build`
4. Output Directory: `dist`

### Option B: Modify package.json

In `client/package.json`:
```json
{
  "scripts": {
    "build": "BUILD_TARGET=vercel vite build"
  }
}
```

Then `vercel.json` can just be:
```json
{
  "outputDirectory": "dist",
  "rewrites": [...]
}
```

## Testing Locally

To test the Vercel build locally:

```bash
cd client
BUILD_TARGET=vercel npm run build

# Check output location
ls -la dist/
# Should show: index.html, assets/, logo.png
```

## Common Issues

### Issue: Build succeeds but still says "No Output Directory"

**Check:**
- Is Root Directory set to `client` in Vercel dashboard?
- Does the build log show `dist/index.html` being created?

**Solution:**
- Make sure `outputDirectory` in vercel.json is `dist` (not `client/dist`)
- When Root Directory is `client`, paths are relative to that folder

### Issue: Build outputs to `../server/dist` instead of `dist`

**Check:**
- Is `BUILD_TARGET=vercel` in the build command?
- Check build logs for the BUILD_TARGET value

**Solution:**
- Ensure `buildCommand` in vercel.json includes `BUILD_TARGET=vercel`
- Or set it as an environment variable in Vercel dashboard

### Issue: App loads but API calls fail

**Check:**
- Console should show: `🌐 API URL: https://biteops.onrender.com`
- If it shows a warning, the environment variable isn't set

**Solution:**
- Set `VITE_API_URL` in Vercel dashboard Environment Variables
- Or ensure it's in `vercel.json` under `build.env`

## Summary

The fix ensures:
1. Build outputs to `client/dist/` when deploying to Vercel
2. Build outputs to `server/dist/` when deploying to Render
3. Vercel finds the output directory
4. Environment variables are properly set

**Action:** Commit and push the changes, then Vercel will deploy successfully!
