#!/bin/bash

# N3RVE Onboarding Platform - Update Deployment Script
# Run this on your EC2 instance to update the deployment

set -e

echo "🚀 N3RVE Onboarding Platform - Deployment Update"
echo "================================================"

# Navigate to project directory
cd ~/n3rve-onboarding-platform

# Check current branch and status
echo "📊 Current Git Status:"
git status

# Pull latest changes
echo ""
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Show recent commits
echo ""
echo "📝 Recent commits:"
git log --oneline -5

# Build and restart services
echo ""
echo "🐳 Rebuilding and restarting Docker services..."

# Stop current containers
docker-compose -f docker-compose.prod.yml down

# Build with fresh images
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs from the last few minutes
echo ""
echo "📋 Recent logs:"
docker-compose -f docker-compose.prod.yml logs --tail=50

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -af

echo ""
echo "✅ Deployment update completed!"
echo ""
echo "🔍 To monitor logs in real-time:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🌐 Your application should be available at:"
echo "   https://n3rve-onboarding.com"