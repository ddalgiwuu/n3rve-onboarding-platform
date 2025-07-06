#!/bin/bash

# N3RVE Platform - Docker Hub Build and Push Script

set -e

echo "🐳 N3RVE Platform Docker Hub Build and Push"
echo "=========================================="

# Docker Hub username (change this to your Docker Hub username)
DOCKER_HUB_USER="${DOCKER_HUB_USER:-ddalgiwuu}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
    echo "📝 Please log in to Docker Hub:"
    docker login
fi

echo ""
echo "🏗️  Building Frontend Image..."
echo "------------------------------"

# Build frontend with build args
docker build \
  --build-arg VITE_API_URL=https://n3rve-onboarding.com/api \
  --build-arg VITE_DROPBOX_CLIENT_ID=${VITE_DROPBOX_CLIENT_ID} \
  --build-arg VITE_DROPBOX_APP_KEY=slffi4mfztfohqd \
  --build-arg VITE_DROPBOX_REDIRECT_URI=https://n3rve-onboarding.com/dropbox-callback \
  --build-arg VITE_DROPBOX_ACCESS_TOKEN=${VITE_DROPBOX_ACCESS_TOKEN} \
  -t n3rve/frontend:latest \
  -f frontend/Dockerfile \
  ./frontend

echo ""
echo "🏗️  Building Backend Image..."
echo "-----------------------------"

# Build backend
docker build \
  -t n3rve/backend:latest \
  -f backend/Dockerfile \
  ./backend

echo ""
echo "🏷️  Tagging Images..."
echo "--------------------"

# Tag images for Docker Hub
docker tag n3rve/frontend:latest ${DOCKER_HUB_USER}/n3rve-frontend:latest
docker tag n3rve/backend:latest ${DOCKER_HUB_USER}/n3rve-backend:latest

echo ""
echo "📤 Pushing to Docker Hub..."
echo "--------------------------"

# Push to Docker Hub
docker push ${DOCKER_HUB_USER}/n3rve-frontend:latest
docker push ${DOCKER_HUB_USER}/n3rve-backend:latest

echo ""
echo "✅ Build and push completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy docker-compose.hub.yml to your EC2 instance"
echo "2. Update the image names to: ${DOCKER_HUB_USER}/n3rve-frontend:latest and ${DOCKER_HUB_USER}/n3rve-backend:latest"
echo "3. Run: docker-compose -f docker-compose.hub.yml pull"
echo "4. Run: docker-compose -f docker-compose.hub.yml up -d"