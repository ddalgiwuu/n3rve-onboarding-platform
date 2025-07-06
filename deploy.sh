#!/bin/bash

# N3RVE Onboarding Platform Deployment Script
# This script sets up the EC2 instance for the first time

set -e

echo "🚀 Starting N3RVE Onboarding Platform deployment setup..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
else
    echo "Docker is already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose is already installed"
fi

# Install nginx for reverse proxy (optional, if not using Docker nginx)
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Install certbot for SSL certificates
echo "🔒 Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create project directory
echo "📁 Creating project directory..."
mkdir -p ~/n3rve-onboarding-platform
cd ~/n3rve-onboarding-platform

# Clone repository if not exists
if [ ! -d .git ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/ddalgiwuu/n3rve-onboarding-platform.git .
else
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p docker/nginx/ssl
mkdir -p logs

# Set up SSL certificate
echo "🔒 Setting up SSL certificate..."
read -p "Enter your domain (n3rve-onboarding.com): " DOMAIN
DOMAIN=${DOMAIN:-n3rve-onboarding.com}

if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    sudo certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@n3rve.com
else
    echo "SSL certificate already exists"
fi

# Create .env file template
echo "📝 Creating .env template..."
cat > .env.example << EOF
# Node Environment
NODE_ENV=production

# Backend Configuration
PORT=5001
MONGODB_URI=mongodb://admin:password@mongodb:27017/n3rve_platform?authSource=admin
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs
FRONTEND_URL=https://n3rve-onboarding.com
CORS_ORIGIN=https://n3rve-onboarding.com

# Frontend Configuration
VITE_API_URL=https://n3rve-onboarding.com/api
VITE_DROPBOX_CLIENT_ID=slffi4mfztfohqd
VITE_DROPBOX_APP_KEY=slffi4mfztfohqd
VITE_DROPBOX_REDIRECT_URI=https://n3rve-onboarding.com/dropbox-callback
VITE_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token

# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-mongo-password
EOF

echo "⚠️  Please edit .env file with your actual values!"
echo "   cp .env.example .env"
echo "   nano .env"

# Create deployment script
echo "📝 Creating deployment update script..."
cat > update-deployment.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Updating deployment..."

# Pull latest changes
git pull origin main

# Pull latest Docker images
docker-compose -f docker-compose.prod.yml pull

# Restart services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# Clean up
docker image prune -af

echo "✅ Deployment updated successfully!"
EOF

chmod +x update-deployment.sh

# Create nginx configuration
echo "🌐 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/n3rve-onboarding << EOF
server {
    listen 80;
    server_name n3rve-onboarding.com www.n3rve-onboarding.com;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n3rve-onboarding.com www.n3rve-onboarding.com;

    ssl_certificate /etc/letsencrypt/live/n3rve-onboarding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n3rve-onboarding.com/privkey.pem;

    # Docker will handle the proxying
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/n3rve-onboarding /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Create systemd service for auto-start
echo "🔧 Creating systemd service..."
sudo tee /etc/systemd/system/n3rve-onboarding.service << EOF
[Unit]
Description=N3RVE Onboarding Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/n3rve-onboarding-platform
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
User=ubuntu
Group=docker

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable n3rve-onboarding.service

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your secrets"
echo "2. Run: docker-compose -f docker-compose.prod.yml up -d"
echo "3. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To update deployment in the future, run: ./update-deployment.sh"