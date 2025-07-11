# N3RVE Onboarding Platform

음원 제출 및 관리를 위한 통합 플랫폼

## 기능

- 🎵 음원 정보 제출 시스템
- 📁 Dropbox 통합 파일 업로드
- 👥 아티스트/레이블 관리
- 📊 관리자 대시보드
- 🌐 다국어 지원 (한국어/영어)
- 🔐 Google OAuth 로그인

## 기술 스택

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand (상태 관리)

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Prisma ORM
- JWT 인증
- Google OAuth 2.0

### Infrastructure
- Docker + Docker Compose
- Nginx
- AWS EC2

## 시작하기

### 사전 요구사항
- Node.js 18+
- MongoDB
- Docker & Docker Compose
- Dropbox App 설정

### 환경 변수 설정
1. `.env.example`을 `.env`로 복사
2. 필요한 환경 변수 설정

### 개발 환경 실행

```bash
# 의존성 설치
cd frontend && npm install
cd ../backend && npm install

# 개발 서버 실행
cd frontend && npm run dev
cd backend && npm run dev
```

### 프로덕션 배포

```bash
# Docker 이미지 빌드 및 실행
docker-compose -f docker-compose.prod.yml up -d
```

## 보안 주의사항

- `.env` 파일은 절대 커밋하지 마세요
- Dropbox Access Token은 주기적으로 갱신하세요
- SSL 인증서를 설정하세요

## 라이선스

Private Repository - All Rights Reserved

## CI/CD

GitHub Actions를 통한 자동 배포가 구성되어 있습니다.
- Push to main: 자동 배포
- Manual trigger: Actions 탭에서 수동 실행 가능
- SSL 인증서 자동 갱신: 매월 1일
- 배포 시간: 약 5-10분 소요# Trigger GitHub Actions
# Test commit to trigger workflow
# Repository is now public
