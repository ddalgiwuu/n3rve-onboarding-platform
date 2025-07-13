# GitHub Secrets 설정 가이드

GitHub Repository Settings → Secrets and variables → Actions에서 다음 secrets를 추가해야 합니다:

## 필수 Secrets

### Docker Hub 관련
- `DOCKER_USERNAME`: ddalgiwuu
- `DOCKER_PASSWORD`: Docker Hub 비밀번호

### EC2 관련
- `EC2_HOST`: 52.78.81.116
- `EC2_SSH_KEY`: N3RVE_AWS.pem 파일의 전체 내용 (-----BEGIN RSA PRIVATE KEY----- 부터 끝까지)
- `EC2_INSTANCE_ID`: i-0fd6de9be4fa199a9

### MongoDB 관련
- `MONGODB_URI`: mongodb+srv://ryan:7xojrRbDc6zK37Hr@n3rve-db.ie22loh.mongodb.net/n3rve-platform?retryWrites=true&w=majority&appName=N3RVE-DB

### JWT 관련
- `JWT_SECRET`: n3rve-production-jwt-secret-2024-very-secure
- `JWT_REFRESH_SECRET`: n3rve-production-refresh-secret-2024-very-secure

### Google OAuth 관련
- `GOOGLE_CLIENT_ID`: 845573085403-drel56srcdvhhqut0suf4i0pul28lkdl.apps.googleusercontent.com
- `GOOGLE_CLIENT_SECRET`: [Google Cloud Console에서 생성한 Client Secret]

## 설정 방법

1. GitHub 저장소로 이동
2. Settings 탭 클릭
3. 왼쪽 메뉴에서 Secrets and variables → Actions 클릭
4. New repository secret 버튼 클릭
5. 위의 각 항목을 Name과 Secret 필드에 입력
6. Add secret 버튼 클릭

## EC2_SSH_KEY 설정 시 주의사항

```bash
cat /Users/ryansong/AWS_KEY/N3RVE_AWS.pem
```

위 명령어로 출력된 전체 내용을 복사하여 붙여넣기 (줄바꿈 포함)