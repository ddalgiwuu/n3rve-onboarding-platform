# N3RVE Platform 수동 배포 가이드

## 1. EC2 접속
```bash
ssh -i "/Users/ryansong/AWS_KEY/N3RVE_AWS.pem" ubuntu@ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com
```

## 2. 배포 디렉토리 설정
```bash
mkdir -p ~/n3rve-platform
cd ~/n3rve-platform
mkdir -p ssl nginx/conf.d
```

## 3. docker-compose.yml 생성
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # MongoDB Atlas 사용 (로컬 MongoDB 컨테이너 제거)
  backend:
    image: ddalgiwuu/n3rve-platform:backend-latest
    container_name: n3rve-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}  # MongoDB Atlas URL
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - PORT=3001
    volumes:
      - backend_logs:/app/logs
      - uploads:/app/uploads
    networks:
      - n3rve-network

  # Frontend Service
  frontend:
    image: ddalgiwuu/n3rve-platform:frontend-latest
    container_name: n3rve-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/letsencrypt:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - backend
    networks:
      - n3rve-network

volumes:
  backend_logs:
  uploads:

networks:
  n3rve-network:
    driver: bridge
EOF
```

## 4. 환경 변수 파일 생성
```bash
cat > .env << 'EOF'
# Backend
DATABASE_URL=mongodb+srv://ryan:7xojrRbDc6zK37Hr@n3rve-db.ie22loh.mongodb.net/?retryWrites=true&w=majority&appName=N3RVE-DB
JWT_SECRET=your-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-secure-refresh-jwt-secret-key-here
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
EOF
```

**중요**: .env 파일의 실제 값들을 설정하세요:
```bash
nano .env
```

## 5. SSL 인증서 설정

### Certbot 설치
```bash
sudo apt update
sudo apt install certbot -y
```

### SSL 인증서 발급
```bash
# 임시로 포트 80 사용 (nginx가 실행중이면 중지)
sudo docker stop n3rve-frontend 2>/dev/null || true

# 인증서 발급
sudo certbot certonly --standalone \
  -d n3rve-onboarding.com \
  -d www.n3rve-onboarding.com \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com
```

### 인증서 심볼릭 링크 생성
```bash
sudo ln -sf /etc/letsencrypt ~/n3rve-platform/ssl
```

## 6. Nginx 설정 파일 생성
```bash
cat > nginx/conf.d/default.conf << 'EOF'
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
EOF
```

## 7. Docker 이미지 Pull 및 실행

### 기존 컨테이너 정리
```bash
docker-compose down
docker system prune -f
```

### Docker Hub에서 이미지 Pull
```bash
docker pull ddalgiwuu/n3rve-platform:backend-latest
docker pull ddalgiwuu/n3rve-platform:frontend-latest
```

### 컨테이너 시작
```bash
docker-compose up -d
```

### 로그 확인
```bash
docker-compose logs -f
```

## 8. 상태 확인
```bash
# 컨테이너 상태
docker-compose ps

# Backend 헬스체크
curl http://localhost:3001/health

# 웹사이트 접속
# https://n3rve-onboarding.com
```

## 문제 해결

### SSL 인증서 문제
```bash
# 인증서 경로 확인
ls -la ~/n3rve-platform/ssl/live/n3rve-onboarding.com/

# 권한 문제 해결
sudo chmod -R 755 /etc/letsencrypt
```

### 컨테이너 재시작
```bash
docker-compose restart
```

### 로그 확인
```bash
# Backend 로그
docker logs n3rve-backend

# Frontend 로그
docker logs n3rve-frontend
```

## 자동 SSL 갱신 설정
```bash
# Crontab 편집
sudo crontab -e

# 다음 줄 추가 (매주 월요일 새벽 2시에 갱신 시도)
0 2 * * 1 certbot renew --quiet && docker-compose -f ~/n3rve-platform/docker-compose.yml restart frontend
```