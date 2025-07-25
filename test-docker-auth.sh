#!/bin/bash

echo "=== Docker Hub Authentication Test ==="
echo ""
echo "This script will help you test Docker Hub credentials locally"
echo "before adding them to GitHub Secrets."
echo ""

# Test if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Get credentials
echo "Enter your Docker Hub username (should be 'ddalgiwuu'):"
read -r DOCKER_USERNAME

echo ""
echo "Enter your Docker Hub Access Token (not your password!):"
echo "To create one: https://hub.docker.com/settings/security"
read -sr DOCKER_PASSWORD

echo ""
echo "Testing login..."

# Test login
if echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin 2>&1; then
    echo ""
    echo "✅ Login successful!"
    echo ""
    echo "Now add these to GitHub Secrets:"
    echo "1. Go to: https://github.com/ddalgiwuu/n3rve-onboarding-platform/settings/secrets/actions"
    echo "2. Add/Update these secrets:"
    echo "   - DOCKER_USERNAME: $DOCKER_USERNAME"
    echo "   - DOCKER_PASSWORD: [the token you just entered]"
    
    # Test push permission
    echo ""
    echo "Testing push permission..."
    docker pull hello-world >/dev/null 2>&1
    docker tag hello-world "${DOCKER_USERNAME}/test-push:latest"
    
    if docker push "${DOCKER_USERNAME}/test-push:latest" >/dev/null 2>&1; then
        echo "✅ Push permission verified!"
        docker rmi "${DOCKER_USERNAME}/test-push:latest" >/dev/null 2>&1
    else
        echo "❌ Cannot push to Docker Hub. Check token permissions."
    fi
else
    echo ""
    echo "❌ Login failed!"
    echo ""
    echo "Common issues:"
    echo "1. Using password instead of Personal Access Token"
    echo "2. Token doesn't have proper permissions (needs Read, Write, Delete)"
    echo "3. Username is incorrect"
    echo "4. Token has expired"
fi

# Logout
docker logout >/dev/null 2>&1