# GitHub Secrets 설정 가이드 (필수)

자동 배포를 위해서는 다음 3개의 GitHub Secrets을 반드시 설정해야 합니다.

## 1. GitHub Repository Secrets 페이지 접속
https://github.com/ddalgiwuu/n3rve-onboarding-platform/settings/secrets/actions

## 2. 필수 Secrets 설정

### DOCKER_USERNAME
- **값**: `ddalgiwuu`
- **설명**: Docker Hub 사용자명

### DOCKER_PASSWORD
1. Docker Hub 로그인: https://hub.docker.com
2. Account Settings → Security → Access Tokens
3. "New Access Token" 클릭
4. Token 이름: `n3rve-github-actions`
5. Access permissions: `Read, Write, Delete` 선택
6. Generate → 생성된 토큰 복사
7. GitHub Secrets에 붙여넣기

### EC2_SSH_KEY
1. N3RVE_AWS.pem 파일 내용 복사:
```bash
cat /Users/ryansong/AWS_KEY/N3RVE_AWS.pem
```
2. 전체 내용 복사 (-----BEGIN RSA PRIVATE KEY----- 부터 -----END RSA PRIVATE KEY-----)
3. GitHub Secrets에 붙여넣기

## 3. Secrets 추가 방법
1. "New repository secret" 버튼 클릭
2. Name: 위의 이름 입력 (예: DOCKER_USERNAME)
3. Secret: 해당 값 입력
4. "Add secret" 클릭

## 4. 설정 확인
모든 Secrets 설정 후:
1. Actions 탭으로 이동
2. 최신 workflow 실행 확인
3. "check-secrets" job이 성공하는지 확인

## 5. 자동 배포 프로세스
```
git push → GitHub Actions 트리거 → Docker 빌드 → Docker Hub 푸시 → EC2 배포
```

## 버전 관리
- 자동으로 `v1.3.{run_number}` 형식으로 버전 생성
- Docker Hub에 버전별 태그 저장
- 배포 후 Summary에서 버전 정보 확인 가능