# GitHub Secrets Setup Guide

GitHub Actions를 위한 Secrets 설정 가이드입니다.

## 필요한 Secrets

Repository → Settings → Secrets and variables → Actions 에서 다음 secrets를 추가하세요:

### 1. Docker Hub 관련
- **DOCKER_HUB_USERNAME**: Docker Hub 사용자명 (예: ddalgiwuu)
- **DOCKER_HUB_TOKEN**: Docker Hub Access Token
  - Docker Hub → Account Settings → Security → New Access Token

### 2. AWS EC2 관련
- **EC2_SSH_KEY**: EC2 인스턴스 SSH Private Key
  - `/Users/ryansong/AWS_KEY/N3RVE_AWS.pem` 파일의 전체 내용
  - `cat /Users/ryansong/AWS_KEY/N3RVE_AWS.pem` 명령어로 확인
- **EC2_HOST**: EC2 Public IP 또는 도메인
  - 현재: `52.78.81.116`

## 설정 방법

1. GitHub Repository로 이동
2. Settings 탭 클릭
3. 왼쪽 메뉴에서 "Secrets and variables" → "Actions" 클릭
4. "New repository secret" 버튼 클릭
5. Name과 Value 입력 후 "Add secret" 클릭

## Docker Hub Access Token 생성

1. https://hub.docker.com 로그인
2. 우측 상단 프로필 클릭 → Account Settings
3. Security 탭 → Access Tokens
4. "New Access Token" 클릭
5. Description 입력 (예: "n3rve-github-actions")
6. Access permissions: "Read & Write" 선택
7. Generate → 토큰 복사

## 확인사항

모든 secrets가 설정되면 GitHub Actions가 자동으로:
1. 코드 push 시 Docker 이미지 빌드
2. Docker Hub에 이미지 푸시
3. EC2에서 새 이미지 pull 및 배포

## 주의사항

- EC2 인스턴스 IP가 변경되면 EC2_HOST secret 업데이트 필요
- Docker Hub 토큰은 안전하게 보관하고 주기적으로 갱신
- SSH Key는 줄바꿈 포함해서 전체 내용을 그대로 복사