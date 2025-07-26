#!/bin/bash

echo "🔧 N3RVE Platform - Cache Clear Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building application with enhanced cache busting...${NC}"

# Clean previous builds
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies to ensure latest versions
echo -e "${BLUE}Ensuring dependencies are up to date...${NC}"
npm ci --prefer-offline

# Build with timestamp for cache busting
echo -e "${BLUE}Building with timestamp: $(date)${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    
    # Copy cache clear helper to dist
    cp clear-cache.html dist/
    
    echo -e "${BLUE}📋 Deployment checklist:${NC}"
    echo "1. Deploy the new build to your server"
    echo "2. Clear CDN cache if using one (CloudFlare, AWS CloudFront, etc.)"
    echo "3. Verify new file hashes in browser network tab"
    echo "4. Test with incognito/private browsing"
    
    echo -e "${YELLOW}📁 New build files:${NC}"
    find dist/assets/ -name "*.js" -exec basename {} \; | head -5
    
    echo -e "${GREEN}🎯 Cache clear helper available at: /clear-cache.html${NC}"
    
else
    echo -e "${RED}❌ Build failed! Check errors above.${NC}"
    exit 1
fi

echo -e "${BLUE}🔄 If users still see errors after deployment:${NC}"
echo "1. Direct them to: https://your-domain.com/clear-cache.html"
echo "2. Ask them to clear browser cache manually"
echo "3. Check CDN cache settings (should be cleared)"
echo "4. Verify new build is actually deployed"

echo -e "${GREEN}✅ Deployment preparation complete!${NC}"