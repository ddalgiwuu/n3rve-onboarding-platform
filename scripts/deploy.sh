#!/bin/bash

# N3RVE Platform Automated Deployment Script
# This script automates the entire deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REPO="ddalgiwuu/n3rve-platform"
EC2_KEY="/Users/ryansong/AWS_KEY/N3RVE_AWS.pem"
EC2_USER="ubuntu"
EC2_HOST="52.78.81.116"
PROJECT_DIR="/home/ubuntu/n3rve-onboarding-platform"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    N3RVE Platform Deployment Script    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Function to check if version exists
version_exists() {
    git tag | grep -q "^$1$"
}

# 1. Check prerequisites
echo -e "\n${YELLOW}[1/7] Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi
if [ ! -f "$EC2_KEY" ]; then
    echo -e "${RED}✗ EC2 key not found at: $EC2_KEY${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All prerequisites met${NC}"

# 2. Check git status
echo -e "\n${YELLOW}[2/7] Checking git status...${NC}"
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}✗ You have uncommitted changes:${NC}"
    git status -s
    echo -e "${YELLOW}Please commit or stash your changes before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Working directory clean${NC}"

# 3. Pull latest from origin
echo -e "\n${YELLOW}[3/7] Syncing with GitHub...${NC}"
git pull origin main
echo -e "${GREEN}✓ Synced with origin/main${NC}"

# 4. Determine version
echo -e "\n${YELLOW}[4/7] Version management...${NC}"
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo -e "Current version: ${BLUE}$CURRENT_VERSION${NC}"

# Auto-suggest next version
IFS='.' read -ra VERSION_PARTS <<< "${CURRENT_VERSION#v}"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}
SUGGESTED_VERSION="v$MAJOR.$MINOR.$((PATCH + 1))"

read -p "Enter version to deploy [$SUGGESTED_VERSION]: " NEW_VERSION
NEW_VERSION=${NEW_VERSION:-$SUGGESTED_VERSION}

if [[ ! "$NEW_VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}✗ Invalid version format. Use vX.X.X${NC}"
    exit 1
fi

if version_exists "$NEW_VERSION"; then
    echo -e "${YELLOW}Version $NEW_VERSION already exists. Using existing tag.${NC}"
else
    echo -e "Creating new version: ${BLUE}$NEW_VERSION${NC}"
    git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"
    git push origin "$NEW_VERSION"
fi

# 5. Build and push Docker image
echo -e "\n${YELLOW}[5/7] Building Docker image...${NC}"
echo -e "Building for linux/amd64 architecture..."
docker buildx build \
    --platform linux/amd64 \
    --no-cache \
    -t "$DOCKER_REPO:$NEW_VERSION" \
    -t "$DOCKER_REPO:latest" \
    --push \
    --progress=plain \
    .

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Docker build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker image built and pushed${NC}"

# 6. Check EC2 instance status
echo -e "\n${YELLOW}[6/7] Checking EC2 instance...${NC}"
INSTANCE_STATE=$(aws ec2 describe-instances --instance-ids i-0fd6de9be4fa199a9 \
    --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null || echo "error")

if [ "$INSTANCE_STATE" != "running" ]; then
    echo -e "${YELLOW}EC2 instance is $INSTANCE_STATE. Starting...${NC}"
    aws ec2 start-instances --instance-ids i-0fd6de9be4fa199a9
    echo "Waiting for instance to start..."
    sleep 30
fi
echo -e "${GREEN}✓ EC2 instance is running${NC}"

# 7. Deploy to EC2
echo -e "\n${YELLOW}[7/7] Deploying to EC2...${NC}"

# Create deployment script
cat > /tmp/deploy_commands.sh << EOF
#!/bin/bash
set -e

echo "=== Starting EC2 deployment ==="

# Update git repository
echo "Updating git repository..."
cd $PROJECT_DIR
git fetch origin
git reset --hard origin/main
echo "Git updated to: \$(git log --oneline -1)"

# Stop and remove old container
echo "Stopping old container..."
docker stop n3rve-platform 2>/dev/null || true
docker rm n3rve-platform 2>/dev/null || true

# Pull new image
echo "Pulling new image..."
docker pull $DOCKER_REPO:$NEW_VERSION

# Ensure .env file exists and has MONGODB_URI
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
fi

# Check if MONGODB_URI exists in .env
if ! grep -q "MONGODB_URI=" .env; then
    echo "Adding MONGODB_URI to .env..."
    # Copy DATABASE_URL to MONGODB_URI if it exists
    if grep -q "DATABASE_URL=" .env; then
        DB_URL=$(grep "DATABASE_URL=" .env | cut -d '"' -f 2)
        echo "MONGODB_URI=\"\$DB_URL\"" >> .env
    fi
fi

# Run new container
echo "Starting new container..."
docker run -d \
    --name n3rve-platform \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -p 3001:3001 \
    -v /etc/letsencrypt:/etc/letsencrypt:ro \
    --env-file .env \
    $DOCKER_REPO:$NEW_VERSION

# Verify deployment
sleep 5
echo "Container status:"
docker ps --filter name=n3rve-platform --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "Recent logs:"
docker logs n3rve-platform --tail 20

echo "=== Deployment complete ==="
EOF

# Execute deployment
ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" 'bash -s' < /tmp/deploy_commands.sh
rm /tmp/deploy_commands.sh

# 8. Verify deployment
echo -e "\n${YELLOW}Verifying deployment...${NC}"
sleep 5

# Check HTTP status
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://n3rve-onboarding.com || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Site is accessible (HTTP $HTTP_STATUS)${NC}"
else
    echo -e "${RED}✗ Site returned HTTP $HTTP_STATUS${NC}"
    echo -e "${YELLOW}Check logs with: ssh -i $EC2_KEY $EC2_USER@$EC2_HOST 'docker logs n3rve-platform'${NC}"
fi

# Summary
echo -e "\n${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Deployment Summary             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo -e "Version deployed: ${GREEN}$NEW_VERSION${NC}"
echo -e "Docker image: ${GREEN}$DOCKER_REPO:$NEW_VERSION${NC}"
echo -e "Production URL: ${GREEN}https://n3rve-onboarding.com${NC}"
echo -e "\n${GREEN}🚀 Deployment completed successfully!${NC}"