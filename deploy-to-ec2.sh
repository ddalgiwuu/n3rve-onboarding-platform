#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# EC2 접속 정보
EC2_HOST="ubuntu@ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com"
KEY_PATH="/Users/ryansong/AWS_KEY/N3RVE_AWS.pem"

echo -e "${YELLOW}🚀 N3RVE Platform EC2 배포 시작${NC}"

# 1. 필요한 파일들을 EC2로 복사
echo -e "${GREEN}📦 배포 파일 전송 중...${NC}"

# docker-compose.yml 복사 (Hub 버전)
scp -i "$KEY_PATH" docker-compose-hub.yml "$EC2_HOST:~/docker-compose.yml"

# nginx 설정 파일 복사
ssh -i "$KEY_PATH" "$EC2_HOST" "mkdir -p ~/nginx"
scp -i "$KEY_PATH" nginx/nginx.conf "$EC2_HOST:~/nginx/"
scp -i "$KEY_PATH" nginx/default.conf "$EC2_HOST:~/nginx/"

# 2. EC2에서 환경 변수 파일 생성
echo -e "${GREEN}🔧 환경 변수 설정 중...${NC}"
ssh -i "$KEY_PATH" "$EC2_HOST" << 'EOF'
cat > .env << EOL
# Backend
DATABASE_URL=mongodb://n3rve_user:your_secure_password@mongodb:27017/n3rve_db?authSource=n3rve_db
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

# MongoDB
MONGODB_ROOT_USERNAME=root
MONGODB_ROOT_PASSWORD=your-mongo-root-password
MONGODB_USER=n3rve_user
MONGODB_PASSWORD=your_secure_password
MONGODB_DATABASE=n3rve_db

# Nginx
SERVER_NAME=n3rve-onboarding.com
EOL
EOF

echo -e "${YELLOW}⚠️  .env 파일이 생성되었습니다. EC2에서 실제 값으로 업데이트하세요!${NC}"
echo -e "${YELLOW}   ssh -i \"$KEY_PATH\" \"$EC2_HOST\"${NC}"
echo -e "${YELLOW}   nano .env${NC}"

# 3. Docker 이미지 pull 및 컨테이너 시작
echo -e "${GREEN}🐳 Docker 컨테이너 배포 중...${NC}"
ssh -i "$KEY_PATH" "$EC2_HOST" << 'EOF'
# 이전 컨테이너 정지 및 제거
docker-compose down

# 최신 이미지 pull
docker pull ddalgiwuu/n3rve-platform:latest

# 컨테이너 시작
docker-compose up -d

# 상태 확인
docker-compose ps
EOF

echo -e "${GREEN}✅ 배포가 완료되었습니다!${NC}"
echo -e "${YELLOW}📌 다음 단계:${NC}"
echo "1. EC2에 접속하여 .env 파일의 실제 값을 설정하세요"
echo "2. docker-compose logs -f 로 로그를 확인하세요"
echo "3. https://n3rve-onboarding.com 에서 서비스를 확인하세요"