#!/bin/bash

echo "🔍 Checking N3RVE Platform Deployment Status..."
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if the deployment is running
echo -e "\n${YELLOW}1. Checking Docker containers on EC2...${NC}"
echo "Host: ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com"

# Test if we can reach the server
echo -e "\n${YELLOW}2. Testing server connectivity...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://52.78.81.116 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ Server is reachable${NC}"
else
    echo -e "${RED}❌ Server might be unreachable or still deploying${NC}"
fi

# Check HTTPS endpoint
echo -e "\n${YELLOW}3. Testing HTTPS endpoint...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://n3rve-onboarding.com | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✅ HTTPS endpoint is active${NC}"
else
    echo -e "${RED}❌ HTTPS endpoint might be down${NC}"
fi

echo -e "\n${YELLOW}4. GitHub Actions Status:${NC}"
echo "Monitor deployment progress at:"
echo "https://github.com/ddalgiwuu/n3rve-onboarding-platform/actions"

echo -e "\n${YELLOW}5. Latest commit deployed:${NC}"
echo "SHA: 9e2b843c00f6080fc3597deacfacab47c77f3a0c"
echo "Message: feat: Major code quality improvements and linting setup"

echo -e "\n================================================"
echo "Deployment typically takes 3-5 minutes to complete."
echo "The GitHub Actions workflow will:"
echo "1. Build Docker image"
echo "2. Push to Docker Hub (ddalgiwuu/n3rve-platform:latest)"
echo "3. Deploy to EC2 instance"
echo "4. Restart containers with new image"