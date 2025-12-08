# 🚀 Vercel + Fly.io 무료 배포 가이드

**작성일**: 2024-12-07
**목표**: AWS EC2 → Vercel + Fly.io 마이그레이션 ($0/월)

---

## 📋 배포 전 체크리스트

- [ ] Git 커밋 완료
- [ ] .env.production 파일 준비 (환경 변수 참고용)
- [ ] MongoDB Atlas 접속 정보 확인
- [ ] Dropbox Access Token 확인
- [ ] Google OAuth Client ID/Secret 확인
- [ ] Squarespace 도메인 로그인 정보 확인

---

## Phase 1: Vercel 프론트엔드 배포 (10분)

### Step 1: Vercel 프로젝트 생성

1. **Vercel 로그인**
   - https://vercel.com 접속
   - "Sign Up with GitHub" 클릭
   - GitHub 계정 연동

2. **새 프로젝트 생성**
   - Dashboard → "Add New Project"
   - "Import Git Repository" 선택
   - `n3rve-onboarding` 리포지토리 찾기
   - "Import" 클릭

3. **프로젝트 설정**
   ```
   Project Name: n3rve-frontend
   Framework Preset: Vite (자동 감지)
   Root Directory: frontend
   Build Command: npm run build (자동)
   Output Directory: dist (자동)
   Install Command: npm install (자동)
   ```

4. **환경 변수 추가**
   - Environment Variables 섹션 펼치기
   - Add Environment Variable 클릭
   ```
   Name: VITE_API_URL
   Value: https://n3rve-backend.fly.dev

   (나중에 Fly.io 배포 후 업데이트)
   ```

5. **배포**
   - "Deploy" 버튼 클릭!
   - 빌드 진행 상황 실시간 확인 (2-3분)
   - 성공 시 URL 확인: `https://n3rve-[random].vercel.app`

### Step 2: 배포 확인

```bash
# 브라우저에서 접속
open https://n3rve-[your-domain].vercel.app

# 또는 curl로 확인
curl -I https://n3rve-[your-domain].vercel.app
```

**예상 결과:**
- ✅ 페이지 로드 성공
- ✅ HTTPS 자동 적용
- ⚠️ API 호출 실패 (백엔드 아직 배포 안 됨)

---

## Phase 2: Fly.io 백엔드 배포 (30분)

### Step 1: Fly.io CLI 설치

**Mac/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**설치 확인:**
```bash
fly version
```

### Step 2: Fly.io 로그인

```bash
# 회원가입 (처음이면)
fly auth signup

# 로그인
fly auth login
```

브라우저가 열리면 GitHub 계정으로 로그인

### Step 3: 앱 초기화

```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/backend

# Fly.io 앱 생성 (대화형)
fly launch
```

**대화형 질문 답변:**
```
? App Name: n3rve-backend
? Region: Tokyo (nrt)
? Add PostgreSQL database? No
? Add Redis database? No
? Deploy now? No
```

`fly.toml` 파일이 자동 생성됩니다 (우리가 만든 것으로 대체 가능)

### Step 4: 환경 변수 설정

```bash
# MongoDB
fly secrets set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/n3rve_platform"

# JWT
fly secrets set JWT_SECRET="your-jwt-secret-from-env-production"
fly secrets set JWT_REFRESH_SECRET="your-refresh-secret"

# Google OAuth
fly secrets set GOOGLE_CLIENT_ID="673146550197-cf1qfbksu3hvc7ktqhogiuerqcv8urie.apps.googleusercontent.com"
fly secrets set GOOGLE_CLIENT_SECRET="your-google-secret"
fly secrets set GOOGLE_CALLBACK_URL="https://n3rve-backend.fly.dev/api/auth/google/callback"

# Dropbox
fly secrets set DROPBOX_ACCESS_TOKEN="your-dropbox-token"

# CORS
fly secrets set CORS_ORIGIN="https://n3rve-[your-vercel].vercel.app"
```

**환경 변수 확인:**
```bash
fly secrets list
```

### Step 5: 배포

```bash
fly deploy
```

**배포 진행:**
- Dockerfile 빌드 (5-10분)
- 이미지 푸시
- 헬스체크
- 성공!

**배포 확인:**
```bash
# 헬스체크
curl https://n3rve-backend.fly.dev/api/health

# 로그 확인
fly logs
```

### Step 6: Vercel 환경 변수 업데이트

1. Vercel Dashboard → Project Settings → Environment Variables
2. `VITE_API_URL` 수정:
   ```
   Value: https://n3rve-backend.fly.dev
   ```
3. Redeploy 트리거 (Deployments → ... → Redeploy)

---

## Phase 3: CORS 설정 업데이트 (5분)

### Step 1: Backend CORS 수정

파일: `backend/src/main.ts`

기존:
```typescript
origin: [
  'http://localhost:3000',
  'https://n3rve-onboarding.com',
]
```

수정:
```typescript
origin: [
  'http://localhost:3000',
  'https://n3rve-[your-vercel].vercel.app',  // Vercel 도메인
  'https://n3rve-onboarding.com',            // 커스텀 도메인
  'https://www.n3rve-onboarding.com'         // www 서브도메인
]
```

### Step 2: 재배포

```bash
cd backend
git add src/main.ts
git commit -m "chore: Update CORS for Vercel deployment"
git push

# Fly.io 자동 재배포 (GitHub Actions 설정 시)
# 또는 수동:
fly deploy
```

---

## Phase 4: 커스텀 도메인 연결 (15분)

### Step 1: Vercel 커스텀 도메인

1. **Vercel Dashboard**
   - Project Settings → Domains
   - Add Domain: `n3rve-onboarding.com`
   - Vercel이 DNS 레코드 제시

2. **Squarespace DNS 설정**
   - https://domains.squarespace.com 로그인
   - `n3rve-onboarding.com` → DNS Settings → Manage
   - 기존 A 레코드 삭제
   - Vercel 레코드 추가:
     ```
     Type: A
     Host: @
     Value: 76.76.21.21
     TTL: 3600

     Type: CNAME
     Host: www
     Value: cname.vercel-dns.com
     TTL: 3600
     ```
   - Save

3. **전파 대기**
   - 5-30분 소요
   - 확인: `dig n3rve-onboarding.com`

### Step 2: Fly.io API 서브도메인

1. **Squarespace DNS에 API 서브도메인 추가**
   ```
   Type: CNAME
   Host: api
   Value: n3rve-backend.fly.dev
   TTL: 3600
   ```

2. **Fly.io 인증서 발급**
   ```bash
   fly certs add api.n3rve-onboarding.com

   # 상태 확인
   fly certs show api.n3rve-onboarding.com
   ```

3. **CORS 최종 업데이트**
   ```typescript
   // backend/src/main.ts
   origin: [
     'http://localhost:3000',
     'https://n3rve-onboarding.com',
     'https://www.n3rve-onboarding.com',
     'https://n3rve-[your-vercel].vercel.app'
   ]
   ```

4. **Vercel 환경 변수 최종 업데이트**
   ```
   VITE_API_URL=https://api.n3rve-onboarding.com
   ```

---

## Phase 5: 최종 테스트

### 테스트 체크리스트

- [ ] **Frontend 접속**
  - https://n3rve-onboarding.com
  - 페이지 로드 확인

- [ ] **Backend 헬스체크**
  - https://api.n3rve-onboarding.com/api/health
  - `{"status":"ok"}` 응답 확인

- [ ] **Google OAuth 로그인**
  - 로그인 버튼 클릭
  - Google 로그인 성공
  - 대시보드 접속 확인

- [ ] **음악 제출 테스트**
  - 새 제출 시작
  - 파일 업로드 (Dropbox)
  - MongoDB 저장 확인

- [ ] **WebSocket 테스트**
  - 제출 상태 변경
  - 실시간 업데이트 확인

---

## 문제 해결

### 1. Vercel 빌드 실패

**에러:** `Module not found`
**해결:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
git add package-lock.json
git commit -m "fix: Update package-lock.json"
git push
```

### 2. Fly.io 배포 실패

**에러:** `Dockerfile not found`
**해결:**
```bash
# Dockerfile.flyio를 Dockerfile로 복사
cp Dockerfile.flyio Dockerfile
fly deploy
```

### 3. CORS 에러

**에러:** `Access-Control-Allow-Origin`
**해결:**
- Vercel 도메인을 CORS origin에 추가했는지 확인
- Fly.io 재배포: `fly deploy`

### 4. MongoDB 연결 실패

**에러:** `MongoServerError: Authentication failed`
**해결:**
- MongoDB Atlas → Network Access
- IP Whitelist에 `0.0.0.0/0` 추가 (또는 Fly.io IP)

---

## Git 커밋

```bash
git add frontend/vercel.json backend/fly.toml backend/Dockerfile.flyio backend/src/main.ts
git commit -m "feat: Add Vercel + Fly.io deployment configuration

- Add vercel.json for frontend deployment
- Add fly.toml for Fly.io backend deployment
- Add simplified Dockerfile for Fly.io
- Update CORS origins for Vercel domain

Migrating from AWS EC2 to free tier hosting
Cost savings: $120-360/year

🚀 Generated with Claude Code"
git push
```

---

## 배포 완료 후

### AWS EC2 종료

⚠️ **주의:** 새 배포가 완전히 작동 확인 후에만 실행!

```bash
# EC2 인스턴스 중지 (AWS Console)
1. AWS Console → EC2
2. 인스턴스 선택 (i-0fd6de9be4fa199a9)
3. Instance State → Stop Instance
4. 1주일 테스트 후 문제 없으면 Terminate
```

### 모니터링

- **Vercel Analytics**: 무료 (기본 제공)
- **Fly.io Metrics**: Dashboard에서 확인
- **UptimeRobot**: 무료 웹사이트 모니터링 설정 추천

---

## 최종 URL

**Production:**
- Frontend: https://n3rve-onboarding.com
- Backend: https://api.n3rve-onboarding.com

**Preview (Vercel):**
- https://n3rve-[random].vercel.app

**개발:**
- http://localhost:3000 (Frontend)
- http://localhost:3001 (Backend)

---

## 비용 요약

| 항목 | 기존 (EC2) | 새로운 (Vercel + Fly.io) |
|------|-----------|-------------------------|
| 컴퓨팅 | $10-30/월 | $0/월 |
| 대역폭 | 포함 | $0/월 |
| SSL | $0 | $0 (자동) |
| **월 총액** | **$10-30** | **$0** |
| **연 절감** | - | **$120-360** |

---

## 다음 단계

1. ✅ Vercel 계정 생성 및 프로젝트 배포
2. ✅ Fly.io CLI 설치 및 백엔드 배포
3. ✅ 환경 변수 설정
4. ✅ CORS 업데이트
5. ✅ 커스텀 도메인 연결
6. ✅ 최종 테스트
7. ⚠️ EC2 인스턴스 종료

**예상 완료 시간**: 1-1.5시간
**난이도**: ⭐⭐ (중간)
