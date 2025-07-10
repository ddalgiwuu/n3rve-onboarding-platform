# GitHub Secrets 설정 가이드

GitHub Actions를 통한 자동 배포를 위해 다음 secrets를 설정해야 합니다.

## 필수 Secrets

### Docker Hub
- `DOCKER_USERNAME`: ddalgiwuu
- `DOCKER_PASSWORD`: Docker Hub 액세스 토큰

### EC2 배포
- `EC2_HOST`: 52.78.81.116
- `EC2_USERNAME`: ubuntu
- `EC2_SSH_KEY`: EC2 SSH 프라이빗 키 전체 내용

## Secrets 설정 방법

1. GitHub 저장소로 이동
2. Settings → Secrets and variables → Actions
3. "New repository secret" 클릭
4. 각 secret 추가

### EC2_SSH_KEY 설정 예시
```bash
# 로컬에서 키 파일 내용 복사
cat /Users/ryansong/AWS_KEY/N3RVE_AWS.pem
```
복사한 내용을 그대로 EC2_SSH_KEY secret에 붙여넣기

## EC2 배포 준비

EC2에서 다음 설정이 필요합니다:

1. 배포 디렉토리 생성
```bash
mkdir -p ~/n3rve-platform
cd ~/n3rve-platform
```

2. docker-compose.prod.yml 파일 생성
3. .env 파일 생성 (실제 환경변수 값 설정)

```bash
# .env 파일 예시
DATABASE_URL=mongodb+srv://ryan:7xojrRbDc6zK37Hr@n3rve-db.ie22loh.mongodb.net/?retryWrites=true&w=majority&appName=N3RVE-DB
JWT_SECRET=your-actual-jwt-secret
# ... 기타 환경변수
```

4. SSL 인증서 디렉토리 생성
```bash
mkdir -p ~/n3rve-platform/ssl
mkdir -p ~/n3rve-platform/nginx/conf.d
```