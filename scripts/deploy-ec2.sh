#!/bin/bash

# EC2 배포 준비 스크립트
# EC2에서 실행하세요

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 N3RVE Platform EC2 배포 준비${NC}"

# 1. 디렉토리 생성
echo -e "${GREEN}📁 디렉토리 생성 중...${NC}"
mkdir -p ~/n3rve-platform
cd ~/n3rve-platform
mkdir -p ssl nginx/conf.d

# 2. docker-compose.prod.yml 다운로드
echo -e "${GREEN}📥 docker-compose.prod.yml 다운로드 중...${NC}"
curl -o docker-compose.yml https://raw.githubusercontent.com/YOUR_USERNAME/n3rve-onboarding-platform/main/docker-compose.prod.yml

# 3. .env 파일 생성
echo -e "${GREEN}🔧 환경 변수 파일 생성 중...${NC}"
cat > .env << 'EOL'
# Backend
DATABASE_URL=mongodb+srv://ryan:7xojrRbDc6zK37Hr@n3rve-db.ie22loh.mongodb.net/?retryWrites=true&w=majority&appName=N3RVE-DB
JWT_SECRET=your-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-secure-refresh-jwt-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://n3rve-onboarding.com/api/auth/google/callback
CORS_ORIGIN=https://n3rve-onboarding.com
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=https://n3rve-onboarding.com/api
VITE_DROPBOX_APP_KEY=slffi4mfztfohqd
VITE_DROPBOX_REDIRECT_URI=https://n3rve-onboarding.com/dropbox-callback
VITE_DROPBOX_ACCESS_TOKEN=your-dropbox-access-token
VITE_APP_URL=https://n3rve-onboarding.com
EOL

echo -e "${YELLOW}⚠️  .env 파일이 생성되었습니다. 실제 값으로 업데이트하세요!${NC}"
echo -e "${YELLOW}   nano .env${NC}"

# 4. SSL 설정 (Let's Encrypt)
echo -e "${GREEN}🔒 SSL 인증서 설정...${NC}"
echo "Certbot 설치 및 SSL 인증서 발급이 필요합니다:"
echo "sudo apt update"
echo "sudo apt install certbot"
echo "sudo certbot certonly --standalone -d n3rve-onboarding.com -d www.n3rve-onboarding.com"
echo ""
echo "인증서 심볼릭 링크 생성:"
echo "sudo ln -s /etc/letsencrypt ~/n3rve-platform/ssl"

# 5. nginx 설정 파일
echo -e "${GREEN}📝 Nginx 설정 파일 생성 중...${NC}"
cat > nginx/conf.d/default.conf << 'EOL'
server {
    listen 80;
    server_name n3rve-onboarding.com www.n3rve-onboarding.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name n3rve-onboarding.com www.n3rve-onboarding.com;

    ssl_certificate /etc/letsencrypt/live/n3rve-onboarding.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n3rve-onboarding.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://n3rve-backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://n3rve-backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOL

echo -e "${GREEN}✅ 배포 준비 완료!${NC}"
echo -e "${YELLOW}📌 다음 단계:${NC}"
echo "1. .env 파일의 실제 값 설정: nano .env"
echo "2. SSL 인증서 발급 (위의 certbot 명령어 실행)"
echo "3. Docker 이미지 pull 및 실행:"
echo "   docker-compose pull"
echo "   docker-compose up -d"