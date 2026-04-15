# 🚨 QUICK FIX: Vercel Build Error

## The Problem
```
Error: Command "cd client && npm install && BUILD_TARGET=vercel npm run build" exited with 1
```

## The Solution (5 Minutes)

### Step 1: Configure Root Directory in Vercel

1. Go to https://vercel.com/dashboard
2. Click your project
3. **Settings** → **General** → **Root Directory**
4. Click **"Edit"**
5. Type: `client`
6. ✅ Check "Include source files outside Root Directory"
7. Click **"Save"**

### Step 2: Set Environment Variable

Still in Settings:

1. Click **"Environment Variables"** (left sidebar)
2. Click **"Add New"**
3. **Key**: `VITE_API_URL`
4. **Value**: `https://biteops.onrender.com`
5. ✅ Check ALL three boxes
6. Click **"Save"**

### Step 3: Commit Simplified Config

```bash
git add .
git commit -m "Simplify Vercel configuration"
git push origin main
```

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"**
3. Uncheck "Use existing Build Cache"
4. Click **"Redeploy"**

## Done!

Vercel will now:
1. Use `client` as the root directory
2. Auto-detect Vite framework
3. Build with proper environment variables
4. Deploy successfully ✅

## Why This Works

**Before**: Vercel tried to run complex commands from repo root  
**After**: Vercel treats `client` as the app root and uses standard Vite build

## Verify It Worked

After deployment:
1. Build logs should show: `✓ built in X seconds`
2. No errors about "cd client"
3. Deployment succeeds ✅

## If Still Failing

Check that:
- [ ] Root Directory is set to exactly `client` (no slashes)
- [ ] Framework Preset says `Vite` (should auto-detect)
- [ ] Environment variable `VITE_API_URL` exists with your backend URL
- [ ] You've pushed the latest vercel.json (simplified version)

---

**Need more details?** See `VERCEL_CONFIGURATION.md`
