#!/bin/bash

# EC2 Deploy Script for N3RVE Onboarding Platform
echo "🚀 Starting deployment to EC2..."

# Variables
EC2_HOST="ec2-52-79-97-228.ap-northeast-2.compute.amazonaws.com"
EC2_USER="ubuntu"
KEY_PATH="$HOME/.ssh/n3rve_onboarding_amazon_key.pem"
PROJECT_DIR="/home/ubuntu/n3rve-onboarding-platform"

# Check if key exists
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ SSH key not found at $KEY_PATH"
    echo "Please ensure the key is in the correct location"
    exit 1
fi

# Set correct permissions
chmod 400 "$KEY_PATH"

echo "📦 Connecting to EC2 and updating platform..."

# SSH into EC2 and run deployment commands
ssh -i "$KEY_PATH" "$EC2_USER@$EC2_HOST" << 'ENDSSH'
echo "Connected to EC2"
cd /home/ubuntu/n3rve-onboarding-platform

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "🛑 Stopping current containers..."
docker-compose down

echo "🏗️ Building new Docker images..."
docker-compose build --no-cache

echo "🚀 Starting updated containers..."
docker-compose up -d

echo "🧹 Cleaning up old images..."
docker system prune -f

echo "✅ Deployment complete!"
docker-compose ps
ENDSSH

echo "✅ EC2 deployment script completed!"