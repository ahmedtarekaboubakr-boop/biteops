# Render Debug Checklist - ENOENT Error Persists

## The Situation

Your code is **correct** (verified locally), but Render keeps showing:
```
ENOENT: no such file or directory, stat '/opt/render/project/src/server/dist/index.html'
```

This means the **build process on Render** is different from local.

## Debug Checklist

### ✅ Step 1: Verify Latest Code is Deployed

In Render dashboard:

**Check Deploy History:**
1. Click "Events" or "Deploys"
2. Look at the most recent deploy

**Answer these:**
- [ ] Latest deploy shows commit: "Fix Render: run build from client directory..."?
- [ ] Deploy status is "Live" (green)?
- [ ] Deploy finished successfully (no "failed" status)?

**If NO to any:** Trigger a manual deploy!

### ✅ Step 2: Check Build Logs

**Where to find:**
1. Render dashboard → Your service
2. Click "Logs"
3. Filter by "Build" or look for deploy timestamp

**What to look for:**

```
==> Running build command...
npm install && cd server && npm install && cd ../client && npm install && BUILD_TARGET=render npm run build
```

**Then find this section:**
```
vite v5.X building for production...
✓ 107 modules transformed
```

**CRITICAL LINE - Which do you see?**

- [ ] `../server/dist/index.html       0.48 kB` ✅ GOOD!
- [ ] `dist/index.html                 0.48 kB` ❌ BAD! (wrong location)
- [ ] Don't see any dist output ❌ WORSE! (build didn't run)

### ✅ Step 3: Check Runtime Logs

**Where to find:**
1. Same Logs page
2. Filter by "Runtime" or look for most recent

**What to look for:**

**✅ Good:**
```
Server running on http://localhost:10000
```

**❌ Bad:**
```
Unhandled error: [Error: ENOENT...
```

If you see ENOENT in runtime logs, build didn't create the files!

### ✅ Step 4: Verify Build Command

In Render dashboard:

1. Go to Settings → Build & Deploy
2. Check "Build Command"

**Should be:**
```
npm install && cd server && npm install && cd ../client && npm install && BUILD_TARGET=render npm run build
```

**If different:** Update it to match!

### ✅ Step 5: Check Environment Variables

In Render dashboard → Environment:

**Required variables:**
- [ ] MONGODB_URI (exists and is valid)
- [ ] JWT_SECRET (exists)
- [ ] NODE_ENV = production
- [ ] PORT = 10000

**Missing JWT_SECRET or MONGODB_URI can cause startup to fail!**

### ✅ Step 6: Verify Branch

In Render dashboard → Settings:

**Check:**
- [ ] Branch is set to "main" (or your default branch)
- [ ] Auto-Deploy is enabled (if you want automatic deploys)

## Common Issues & Solutions

### Issue 1: Build Succeeds but Files in Wrong Location

**Symptoms:**
- Build logs show `dist/index.html` (no `../`)
- Runtime shows ENOENT error

**Cause:** BUILD_TARGET not set during build

**Solution:**
1. Check build command includes `BUILD_TARGET=render`
2. Verify it's set BEFORE `npm run build`
3. Should be: `... && BUILD_TARGET=render npm run build`

### Issue 2: Build Doesn't Run

**Symptoms:**
- No vite output in build logs
- No "✓ built in X seconds" message

**Cause:** Build command failed before reaching build step

**Solution:**
1. Check for npm install errors
2. Check for "cd" command errors
3. Look for any red error messages in build logs

### Issue 3: Old Deployment Still Running

**Symptoms:**
- Latest deploy shows old commit
- Changes not reflected

**Solution:**
1. Click "Manual Deploy"
2. Select "Clear build cache & deploy"
3. Wait 15 minutes for fresh deploy

### Issue 4: Build Succeeds, Runtime Fails Immediately

**Symptoms:**
- Build logs look perfect
- Runtime shows ENOENT immediately

**Possible causes:**
- Files built to wrong location
- Permissions issue
- server.js path is wrong

**Check server/server.js:**
```javascript
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})
```

Path should be `'dist'` not `'./dist'` or `'../dist'`

### Issue 5: Render Out of Resources

**Symptoms:**
- Build times out
- "Out of memory" errors
- Build randomly fails

**Solution:**
1. Free tier has limited resources
2. Wait and try again
3. Consider upgrading tier
4. Clear build cache and redeploy

## Diagnostic Commands

If you can access Render shell (paid tiers), run:

```bash
# Check if dist exists
ls -la /opt/render/project/src/server/dist/

# Check if index.html exists
ls -la /opt/render/project/src/server/dist/index.html

# Check what's in server directory
ls -la /opt/render/project/src/server/

# Check current working directory when server starts
pwd
```

## Next Steps

1. **Answer the checklist questions** - Check each item
2. **Share your findings** - Tell me what you see in the logs
3. **Copy critical log sections** - Share build output and errors
4. **Try manual deploy** - If current deploy is old

## What I Need to Help Further

To diagnose this properly, I need to see:

1. **Build logs** - Specifically the vite build output
2. **Runtime logs** - The first 20-30 lines after server starts
3. **Deploy status** - Screenshot or description of current deployment
4. **Commit on Render** - What commit is currently deployed

With this information, I can pinpoint the exact issue!

## Emergency Workaround

If nothing works, try this simpler approach:

**Update render.yaml to:**
```yaml
buildCommand: cd client && npm ci && npm run build && cd ../server && npm ci
startCommand: cd server && npm start
```

**Update client/vite.config.js to always output to ../server/dist:**
```javascript
build: {
  outDir: '../server/dist',
  emptyOutDir: true
}
```

This removes the BUILD_TARGET dependency completely.
