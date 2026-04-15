# Fix Render Build - Missing dist Files

## The Error on Render

```
Unhandled error: [Error: ENOENT: no such file or directory, stat '/opt/render/project/src/server/dist/index.html']
```

This means the build process on Render isn't creating the frontend files in `server/dist/`.

## Root Cause

The Render build process needs to:
1. Install dependencies for both server and client
2. Build the React client
3. Place the built files in `server/dist/` (where the Express server expects them)

## What I Fixed

### Updated `render.yaml`

Changed the build command to:
```yaml
buildCommand: npm install && cd server && npm install && cd .. && cd client && npm install && npm run build && cd ..
```

This ensures:
1. Root dependencies installed
2. Server dependencies installed
3. Client dependencies installed
4. Client is built (outputs to `../server/dist` by default)
5. Returns to root directory

### Added Environment Variable

Added to `render.yaml`:
```yaml
- key: BUILD_TARGET
  value: render
```

This ensures the Vite config outputs to `server/dist/` instead of `client/dist/`.

## How It Works

### Vite Configuration Logic

The `client/vite.config.js` checks:
```javascript
build: {
  outDir: process.env.BUILD_TARGET === 'vercel' ? 'dist' : '../server/dist',
  emptyOutDir: true
}
```

- If `BUILD_TARGET=vercel` → outputs to `client/dist/` (for Vercel deployment)
- Otherwise (including `BUILD_TARGET=render`) → outputs to `server/dist/` (for Render deployment)

### Server Configuration

The Express server serves files from `server/dist/`:
```javascript
app.use(express.static(join(__dirname, 'dist')))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})
```

## Deployment Steps

### 1. Commit and Push

```bash
git add .
git commit -m "Fix Render build to create dist files correctly"
git push origin main
```

### 2. Check Render Environment Variables

Go to Render dashboard → Your service → Environment:

Make sure these are set:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret
- `NODE_ENV` - `production`
- `BUILD_TARGET` - `render` (should be auto-added from render.yaml)

### 3. Trigger Manual Deploy

1. Go to Render dashboard
2. Find your "biteops" service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 5-10 minutes (free tier can be slow)

### 4. Watch Build Logs

In the Render logs, you should see:
```
Installing dependencies...
Running build command...
✓ 107 modules transformed
✓ built in X seconds
Starting server...
Server running on http://localhost:10000
```

## Verify It Worked

After deployment:

### Check Render Logs

Look for these messages:
- ✅ "vite v5.X building for production..."
- ✅ "✓ built in X seconds"
- ✅ "Server running on http://localhost:10000"
- ❌ No "ENOENT" errors

### Test Your App

Visit your Render URL (https://biteops.onrender.com):
- ✅ Login page loads
- ✅ No 404 errors for index.html
- ✅ Assets load (CSS, JS files)
- ✅ Can interact with the app

## Common Issues

### Issue: Build succeeds but app still shows 404

**Check:** Did the build actually create files?

In Render logs, look for:
```
../server/dist/index.html      0.48 kB
../server/dist/assets/...      ...
```

If you see `dist/index.html` instead of `../server/dist/index.html`, the build is outputting to the wrong location.

**Solution:** Make sure `BUILD_TARGET` is NOT set to `vercel`

### Issue: "Cannot find module" errors

**Check:** Are dependencies installed in the right directories?

The build command should show:
```
+ Installing root dependencies
+ cd server && npm install
+ cd client && npm install
```

**Solution:** The updated render.yaml now explicitly installs dependencies in each directory

### Issue: Build times out

Render free tier has limited resources.

**Solutions:**
- Make sure you're not installing unnecessary dependencies
- Consider upgrading to a paid plan for faster builds
- Check that node_modules aren't being copied (they shouldn't be in git)

### Issue: Server starts but crashes immediately

**Check Render logs for:**
- Database connection errors (MONGODB_URI not set or incorrect)
- Missing JWT_SECRET
- Port binding issues

## Testing Locally

To test the exact Render build process locally:

```bash
# Clean everything
rm -rf node_modules server/node_modules client/node_modules client/dist server/dist

# Run the Render build command
npm install && \
cd server && npm install && \
cd .. && \
cd client && npm install && npm run build && \
cd ..

# Check that files were created
ls -la server/dist/

# Should show:
# - index.html
# - assets/ folder
# - logo.png

# Start the server
cd server && npm start

# Visit http://localhost:3001
```

## File Structure After Build

```
BiteOps/
├── client/
│   ├── src/
│   └── package.json
├── server/
│   ├── dist/              ← Built frontend goes here
│   │   ├── index.html
│   │   ├── assets/
│   │   └── logo.png
│   ├── server.js
│   └── package.json
└── render.yaml
```

## Summary

1. **Problem**: Render wasn't building client into `server/dist/`
2. **Fix**: Updated render.yaml build command and added BUILD_TARGET env var
3. **Result**: Build creates files in correct location, server can serve them
4. **Action**: Commit, push, and trigger manual deploy on Render

## Next Steps

After this fix works:
1. Both Vercel (frontend) and Render (backend) will be working
2. Vercel will call Render for API requests
3. Render will serve both API and frontend (as backup/testing)
