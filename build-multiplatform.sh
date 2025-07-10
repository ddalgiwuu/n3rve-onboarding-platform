#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Multi-platform 이미지 빌드 시작${NC}"

# Docker buildx 설정
echo -e "${GREEN}📦 Docker buildx 설정 중...${NC}"
docker buildx create --name n3rve-builder --use --bootstrap || docker buildx use n3rve-builder

# 멀티 플랫폼 이미지 빌드 및 푸시
echo -e "${GREEN}🐳 Multi-platform 이미지 빌드 및 푸시 중...${NC}"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ddalgiwuu/n3rve-platform:latest \
  -t ddalgiwuu/n3rve-platform:v1.1 \
  -f Dockerfile \
  --push \
  .

echo -e "${GREEN}✅ Multi-platform 이미지 빌드 완료!${NC}"

# 빌더 정리
docker buildx rm n3rve-builder

echo -e "${YELLOW}📌 이제 EC2에서 배포를 다시 시도하세요:${NC}"
echo "./deploy-to-ec2.sh"