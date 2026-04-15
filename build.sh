#!/bin/bash
set -e  # Exit on error

echo "======================================"
echo "Starting BiteOps Build Process"
echo "======================================"
echo ""

echo "Step 1: Install client dependencies"
cd client
npm install
echo "✓ Client dependencies installed"
echo ""

echo "Step 2: Build client"
echo "BUILD_TARGET is set to: ${BUILD_TARGET:-'not set'}"
echo "Current directory: $(pwd)"
npm run build
echo "✓ Client build completed"
echo ""

echo "Step 3: Verify build output"
echo "Checking for ../server/dist/index.html..."
if [ -f "../server/dist/index.html" ]; then
  echo "✓ index.html found!"
  ls -lh ../server/dist/
else
  echo "✗ ERROR: index.html NOT found!"
  echo "Looking for dist folders..."
  find .. -name "dist" -type d
  find .. -name "index.html"
  exit 1
fi
echo ""

echo "Step 4: Install server dependencies"
cd ../server
npm install
echo "✓ Server dependencies installed"
echo ""

echo "======================================"
echo "Build Process Complete!"
echo "======================================"
echo ""
echo "Files in server/dist:"
ls -lh dist/
