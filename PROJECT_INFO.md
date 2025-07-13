# N3RVE Onboarding Platform - Project Information

## 🎯 Project Overview
N3RVE Music Distribution Platform - 음악 유통을 위한 온보딩 플랫폼

### Main Features
- 🎵 음원 메타데이터 입력 및 관리
- 📁 Dropbox 통합 파일 업로드
- 🔐 Google OAuth 로그인
- 👥 관리자/고객 대시보드
- 🌏 한국어/영어 다국어 지원
- 🎚️ Dolby Atmos 지원

## 📂 Project Structure
```
n3rve-onboarding-platform/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # UI 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── services/       # API 서비스
│   │   ├── store/          # Zustand 상태 관리
│   │   └── utils/          # 유틸리티 함수
│   └── package.json
├── backend/                 # NestJS + Prisma
│   ├── src/
│   │   ├── auth/           # 인증 모듈
│   │   ├── users/          # 사용자 모듈
│   │   ├── submissions/    # 제출 모듈
│   │   └── admin/          # 관리자 모듈
│   ├── prisma/             # 데이터베이스 스키마
│   └── package.json
├── nginx/                   # 웹서버 설정
├── docker-compose.yml       # 로컬 개발용
├── docker-compose.prod.yml  # 프로덕션용
└── Dockerfile              # 컨테이너 빌드
```

## 🔧 Tech Stack
### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- Zustand (상태 관리)
- React Router v6
- React Hook Form
- React Hot Toast

### Backend
- NestJS
- Prisma ORM
- MongoDB (Atlas)
- JWT Authentication
- Google OAuth 2.0

### Infrastructure
- AWS EC2 (Ubuntu)
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- Let's Encrypt SSL
- Dropbox API

## 📝 Important URLs
- **Production**: https://n3rve-onboarding.com
- **GitHub**: https://github.com/ddalgiwuu/n3rve-onboarding-platform
- **Docker Hub**: https://hub.docker.com/r/ddalgiwuu/n3rve-platform

## 👥 User Roles
1. **ADMIN** - 전체 시스템 관리
2. **USER** - 일반 고객 (음원 제출)

## 🌐 Supported Languages
- 한국어 (ko)
- English (en)

## 📱 Key Components
### Customer Side
- `/dashboard` - 고객 대시보드
- `/onboarding` - 새 음원 제출 (ReleaseSubmissionNew)
- `/submissions` - 제출 내역
- `/guide` - 사용 가이드

### Admin Side
- `/admin` - 관리자 대시보드
- `/admin/submission-management` - 제출 관리
- `/admin/customers` - 고객 관리
- `/admin/settings` - 설정