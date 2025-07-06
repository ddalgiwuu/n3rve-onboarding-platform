#!/bin/bash

# Configuration
DOCKER_USERNAME="ddalgiwuu"
EC2_HOST="52.78.81.116"
EC2_USER="ubuntu"
SSH_KEY="/Users/ryansong/AWS_KEY/N3RVE_AWS.pem"

echo "🚀 Starting deployment to EC2..."

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    echo "Please ensure you have the EC2 private key"
    exit 1
fi

# SSH command to execute on EC2
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e

echo "📦 Stopping and removing existing containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

echo "🧹 Cleaning up Docker resources..."
docker system prune -af --volumes

echo "📥 Pulling latest images..."
docker pull ddalgiwuu/n3rve-frontend:latest
docker pull ddalgiwuu/n3rve-backend:latest

echo "🔗 Creating Docker network..."
docker network create n3rve-network 2>/dev/null || true

echo "📝 Creating nginx configuration..."
mkdir -p ~/n3rve-platform
cat > ~/n3rve-platform/default.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location /api {
        proxy_pass http://n3rve-backend:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

echo "🚀 Starting backend container..."
docker run -d --name n3rve-backend \
  --network n3rve-network \
  --restart unless-stopped \
  -e NODE_ENV=production \
  -e PORT=5001 \
  -e JWT_SECRET=your-super-secret-jwt-key-change-this-in-production \
  -e JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production \
  -e JWT_EXPIRES_IN=7d \
  -e MONGODB_URI="mongodb+srv://n3rve-admin:Onboarding2025!@n3rve-cluster.uw7fc.mongodb.net/n3rve-onboarding?retryWrites=true&w=majority&appName=n3rve-cluster" \
  -e GOOGLE_CLIENT_ID=795218226774-iqgvi8l0u9j1i39ej7ofqei6t56vhj0m.apps.googleusercontent.com \
  -e GOOGLE_CLIENT_SECRET=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 \
  -e FRONTEND_URL=http://n3rve-onboarding.com \
  -e CORS_ORIGIN="http://n3rve-onboarding.com,http://52.78.81.116,http://localhost:5173" \
  ddalgiwuu/n3rve-backend:latest

echo "⏳ Waiting for backend to start..."
sleep 10

echo "🌐 Starting frontend container..."
docker run -d --name n3rve-frontend \
  --network n3rve-network \
  --restart unless-stopped \
  -p 80:80 \
  -v ~/n3rve-platform/default.conf:/etc/nginx/conf.d/default.conf:ro \
  ddalgiwuu/n3rve-frontend:latest

echo "✅ Deployment complete! Checking status..."
docker ps

echo ""
echo "📊 Backend logs:"
docker logs n3rve-backend --tail=10

echo ""
echo "📊 Frontend logs:"
docker logs n3rve-frontend --tail=10

echo ""
echo "🎉 Deployment finished! Visit http://n3rve-onboarding.com"
ENDSSH

echo "✅ Deployment script completed!"