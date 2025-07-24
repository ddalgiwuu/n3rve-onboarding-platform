# N3RVE Platform 배포 문제 해결 가이드

## GitHub Actions 배포 실패 원인 및 해결 방법

### 1. 필수 GitHub Secrets 확인

GitHub repository → Settings → Secrets and variables → Actions 에서 다음 secrets이 설정되어 있는지 확인:

- **DOCKER_USERNAME**: Docker Hub 사용자명 (ddalgiwuu)
- **DOCKER_PASSWORD**: Docker Hub 패스워드 또는 Access Token
- **EC2_SSH_KEY**: EC2 인스턴스 접속용 private key (N3RVE_AWS.pem 내용)
- **EC2_HOST** (optional): EC2 호스트 주소 (현재 하드코딩: 52.78.81.116)

### 2. Docker Hub Access Token 생성 방법

1. https://hub.docker.com 로그인
2. Account Settings → Security → Access Tokens
3. "New Access Token" 클릭
4. Token 이름 입력 (예: n3rve-github-actions)
5. Access permissions: Read, Write, Delete 선택
6. 생성된 토큰을 DOCKER_PASSWORD secret에 저장

### 3. EC2_SSH_KEY 설정 방법

1. N3RVE_AWS.pem 파일 내용 복사:
```bash
cat /path/to/N3RVE_AWS.pem
```

2. GitHub repository → Settings → Secrets → New repository secret
3. Name: EC2_SSH_KEY
4. Value: -----BEGIN RSA PRIVATE KEY----- 부터 -----END RSA PRIVATE KEY----- 까지 전체 내용 붙여넣기

### 4. 일반적인 배포 실패 원인

#### Docker Build 실패
- **증상**: "docker buildx build" 단계에서 실패
- **원인**: 
  - Docker Hub 인증 실패
  - 이미지 빌드 중 에러
- **해결**:
  - Docker Hub credentials 확인
  - 로컬에서 docker build 테스트

#### EC2 연결 실패
- **증상**: "Deploy to EC2" 단계에서 timeout
- **원인**:
  - EC2 인스턴스 중지됨
  - SSH key 권한 문제
  - Security Group 설정
- **해결**:
  - AWS Console에서 인스턴스 상태 확인
  - EC2_SSH_KEY secret 재설정
  - Security Group에서 포트 22 (SSH) 허용 확인

#### Docker Container 시작 실패
- **증상**: 배포는 성공하지만 사이트 접속 불가
- **원인**:
  - 환경 변수 누락
  - 포트 충돌
  - MongoDB 연결 실패
- **해결**:
  - EC2에서 .env 파일 확인
  - docker logs n3rve-app 로그 확인

### 5. 수동 배포 방법 (GitHub Actions 실패 시)

```bash
# 1. 로컬에서 Docker 이미지 빌드 및 푸시
docker buildx build --platform linux/amd64 -t ddalgiwuu/n3rve-platform:latest --push .

# 2. EC2 접속
ssh -i "N3RVE_AWS.pem" ubuntu@52.78.81.116

# 3. EC2에서 최신 이미지 pull 및 재시작
cd /home/ubuntu/n3rve-onboarding-platform
git pull origin main
docker pull ddalgiwuu/n3rve-platform:latest
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 4. 로그 확인
docker logs n3rve-app -f
```

### 6. 배포 상태 확인 명령어

```bash
# GitHub Actions 워크플로우 수동 실행
gh workflow run deploy-docker.yml

# 워크플로우 상태 확인
gh run list --workflow=deploy-docker.yml

# 최근 실행 로그 보기
gh run view

# EC2 상태 확인
aws ec2 describe-instances --instance-ids i-0fd6de9be4fa199a9 --region ap-northeast-2
```

### 7. 환경 변수 체크리스트

EC2의 `/home/ubuntu/n3rve-onboarding-platform/.env` 파일에 다음 변수들이 있는지 확인:

- MONGODB_URI
- JWT_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- DROPBOX_ACCESS_TOKEN
- NODE_ENV=production

### 8. 디버깅 팁

1. **GitHub Actions 로그 확인**:
   - https://github.com/ddalgiwuu/n3rve-onboarding-platform/actions
   - 실패한 워크플로우 클릭 → 상세 로그 확인

2. **로컬 테스트**:
   ```bash
   # Docker 빌드 테스트
   docker build -t test-build .
   
   # Docker Compose 테스트
   docker-compose -f docker-compose.prod.yml config
   ```

3. **EC2 로그 확인**:
   ```bash
   # Docker 컨테이너 로그
   docker logs n3rve-app --tail 100
   
   # Nginx 로그
   docker exec n3rve-app tail -f /var/log/nginx/error.log
   ```

## 문의사항

배포 관련 추가 문제가 있으면 다음 정보와 함께 문의해주세요:
- GitHub Actions 실패 로그
- EC2 docker logs 출력
- 에러 메시지 스크린샷