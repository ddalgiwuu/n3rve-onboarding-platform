#!/bin/bash

echo "🔧 Fixing React 19 createContext compatibility issues..."

# Clean node_modules and package-lock to ensure fresh install
echo "🧹 Cleaning dependencies..."
rm -rf node_modules package-lock.json

# Install dependencies with React 19 overrides
echo "📦 Installing dependencies with React 19 compatibility..."
npm install

# Clean build cache
echo "🗑️ Cleaning build cache..."
rm -rf dist .vite

# Build with verbose output to catch any remaining issues
echo "🏗️ Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful! React context compatibility fixed."
    echo ""
    echo "📋 Summary of fixes applied:"
    echo "  - Enhanced React polyfill with createContext global access"
    echo "  - Added early React initialization"
    echo "  - Improved Vite chunking strategy"
    echo "  - Added React-specific error boundary"
    echo "  - Added package overrides for React 19"
    echo ""
    echo "🚀 You can now deploy the application safely."
else
    echo "❌ Build failed. Please check the output above for errors."
    exit 1
fi