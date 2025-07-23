#!/bin/bash

# EC2 서버 정보
EC2_HOST="ubuntu@ec2-52-78-81-116.ap-northeast-2.compute.amazonaws.com"
PEM_FILE="/Users/ryansong/AWS_KEY/N3RVE_AWS.pem"

echo "EC2 서버에 Dropbox 환경 변수 재설정 중..."

# SSH 명령어로 원격 실행
ssh -i "$PEM_FILE" "$EC2_HOST" << 'ENDSSH'
cd /home/ubuntu/n3rve-onboarding-platform

# Docker 강제 종료 및 재시작
echo "Docker 컨테이너 강제 종료..."
docker stop n3rve-app || true
docker rm n3rve-app || true

echo "Docker 재시작..."
docker-compose -f docker-compose.prod.yml up -d

echo "환경 변수 확인..."
docker exec n3rve-app env | grep DROPBOX

echo "완료! 로그 확인 중..."
sleep 5
docker logs n3rve-app --tail 30
ENDSSH

echo "Dropbox 환경 변수 설정 완료!"