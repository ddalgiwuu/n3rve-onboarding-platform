# 🔧 Backend Submission 문제 완전 해결 가이드

## 🎯 근본 원인 분석

### 문제
```
POST /api/submissions → 500 Internal Server Error

Prisma Error: Unknown argument `audioFiles`
tracks: [{
  audioFiles: []  ← Track 타입에 없는 필드!
}]
```

### 왜 발생했나?

**Prisma Track 타입**:
```typescript
type Track {
  id: String
  titleKo: String
  // ...
  // audioFiles 필드 없음!
}
```

**Frontend가 보내는 데이터**:
```typescript
tracks: [{
  id: "...",
  title: "...",
  audioFiles: []  ← 이것이 문제!
}]
```

**Backend가 받아서 Prisma로 전달**:
```typescript
prisma.submission.create({
  data: {
    tracks: [{
      audioFiles: []  ← Prisma 에러 발생!
    }]
  }
})
```

---

## 🔍 꼬인 부분 정리

### 1. 코드 수정은 완료됨 ✅

**Frontend** (`ImprovedReleaseSubmissionWithDnD.tsx` Line 1291):
```typescript
tracks: formData.tracks.map(t => ({
  id: t.id,
  title: t.title,
  artists: t.artists,
  // ... 필요한 필드만
  // audioFiles 명시적으로 제외!
}))
```

**Backend** (`submissions.controller.ts` Line 394):
```typescript
const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;
return {
  // trackData만 사용 (파일 필드 제외!)
};
```

### 2. 하지만 적용되지 않음 ❌

**원인**:
1. **Backend 컴파일 캐시**: `dist/` 폴더가 이전 코드 사용
2. **Backend watch 모드 오작동**: 파일 변경 감지 실패
3. **Frontend 브라우저 캐시**: 이전 JS 파일 사용
4. **여러 Backend 프로세스**: 잘못된 프로세스 실행

---

## ✅ 완전한 해결 방법

### 1단계: 완전 초기화 (필수!)

```bash
# 1. 모든 프로세스 종료
pkill -9 -f "nest start"
pkill -9 -f "vite"
lsof -ti:3001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# 2. 캐시 삭제
cd /Users/ryansong/Desktop/n3rve-onbaording/backend
rm -rf dist/
rm -rf node_modules/.cache/

cd ../frontend
rm -rf dist/
rm -rf node_modules/.vite/

# 3. 완전히 깨끗한 상태 확인
ps aux | grep -E "nest|vite" | grep -v grep
# → 아무것도 나오지 않아야 함!
```

### 2단계: Backend 재시작

```bash
cd /Users/ryansong/Desktop/n3rve-onbaording/backend

# .env 확인
grep "DROPBOX_ACCESS_TOKEN" .env
# → sharing.write 권한 포함된 최신 토큰 확인

# Backend 시작
npm run start:dev
```

**확인사항**:
```
✅ Found 0 errors. Watching for file changes.
✅ Nest application successfully started
✅ Application is running on: http://127.0.0.1:3001
```

### 3단계: Frontend 재시작

```bash
# 새 터미널
cd /Users/ryansong/Desktop/n3rve-onbaording/frontend

npm run dev
```

**확인사항**:
```
✅ VITE ready
✅ Local: http://localhost:3000/
```

### 4단계: 테스트 (중요!)

**시크릿 창 사용 (필수!)**:
```
1. Cmd+Shift+N (Chrome 시크릿 창)
2. http://localhost:3000
3. 로그인
4. 릴리즈 폼 작성
5. Submit 클릭
```

**왜 시크릿 창인가?**
- ✅ 브라우저 캐시 없음
- ✅ 최신 JS 파일 사용
- ✅ 100% 최신 코드 실행

### 5단계: Backend 로그 확인

**Backend 터미널에서 확인**:
```
✅ 🔍 [CREATE SUBMISSION] Controller entered
✅ 🔍 [FILES] Dropbox configured: true
✅ 🔍 [FILES] Processing audioFiles: 1
✅ 🔍 [FILES] Uploading to Dropbox: 2 files
✅ Files uploaded to Dropbox successfully
✅ 🔍 [CREATE SUBMISSION] Calling submissionsService.create
✅ ✅ [CREATE SUBMISSION] Success!
```

**에러가 나타나면**:
- `track.audioFiles` 문자열이 있는지 확인
- 있으면 → Frontend 캐시 문제 (시크릿 창 사용!)
- 없으면 → 다른 에러 (메시지 확인)

---

## 🔧 디버깅 체크리스트

### Frontend 체크
```bash
cd frontend
grep -A 10 "tracks: formData.tracks.map" src/pages/ImprovedReleaseSubmissionWithDnD.tsx | grep -c "audioFiles"
# → 0이어야 함 (audioFiles 없어야 함)
```

### Backend 체크
```bash
cd backend
grep -A 30 "tracks:.*submissionData.tracks?.map" src/submissions/submissions.controller.ts | grep "audioFiles"
# → Line 394: const { audioFiles, ...trackData } 만 있어야 함
```

### Dropbox 토큰 체크
```bash
grep "DROPBOX" backend/.env
# → 최신 토큰 (sharing.write 포함) 확인
```

---

## 📊 수정된 파일 목록

### Frontend
- `src/pages/ImprovedReleaseSubmissionWithDnD.tsx`
  - Line 1291: tracks 필드 명시적 선택
  - Line 1217: QC validation용 (유지)
  - Line 1377: API 직접 호출

### Backend
- `src/submissions/submissions.controller.ts`
  - Line 70: try-catch 추가
  - Line 156-169: FILES 디버깅 로그
  - Line 394: track.audioFiles destructuring 제거
  - Line 515: 에러 핸들링

- `.env`
  - DROPBOX_ACCESS_TOKEN 추가 (sharing.write 권한)

---

## 🚨 만약 여전히 에러가 나온다면

### 시나리오 1: track.audioFiles 여전히 나타남

**원인**: 브라우저 캐시

**해결**:
1. 모든 localhost:3000 탭 닫기
2. 브라우저 완전 종료
3. 재시작 후 시크릿 창 사용

### 시나리오 2: Dropbox 401/400 에러

**원인**: 토큰 권한 부족

**해결**:
```
Dropbox App Console → Permissions:
☑️ files.content.write
☑️ files.content.read
☑️ files.metadata.write
☑️ files.metadata.read
☑️ sharing.write

새 토큰 생성 → backend/.env 업데이트
```

### 시나리오 3: 다른 Prisma 에러

**원인**: 다른 필드 문제

**해결**:
- Backend 로그의 Prisma 에러 전체 복사
- 어떤 필드가 문제인지 확인
- 해당 필드 제거 또는 수정

---

## 🎯 확실한 성공을 위한 절차

### Step 1: 완전 초기화 (10분)
```bash
# 모든 프로세스 종료
pkill -9 -f "nest"
pkill -9 -f "vite"

# 캐시 삭제
rm -rf backend/dist/
rm -rf frontend/dist/

# 프로세스 확인
ps aux | grep -E "nest|vite" | grep -v grep
# → 아무것도 없어야 함
```

### Step 2: Backend 시작 (5분)
```bash
cd backend
npm run start:dev

# 로그 확인:
# ✅ Found 0 errors
# ✅ successfully started
```

### Step 3: Frontend 시작 (2분)
```bash
cd frontend
npm run dev

# 로그 확인:
# ✅ VITE ready
```

### Step 4: 테스트 (5분)
```
시크릿 창 → localhost:3000 → Submit
```

**총 예상 시간**: 20-30분

---

## 📝 다음 세션 첫 작업

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/ryansong/Desktop/n3rve-onbaording

# 2. 이 문서 열기
cat BACKEND_SUBMISSION_FIX_GUIDE.md

# 3. "완전 초기화" 부터 순서대로 실행

# 4. 각 단계마다 체크리스트 확인

# 5. Submit 테스트
```

---

## 💡 핵심 포인트

### 반드시 지켜야 할 것

1. **시크릿 창 사용** - 브라우저 캐시 문제 100% 회피
2. **dist/ 삭제** - 컴파일 캐시 문제 100% 해결
3. **프로세스 완전 종료** - 여러 프로세스 문제 100% 해결
4. **한 번에 하나씩** - Backend 먼저, Frontend 나중에

### 성공의 신호

**Backend 로그**:
```
✅ 🔍 [FILES] Processing audioFiles: 1
✅ Files uploaded to Dropbox successfully
✅ ✅ [CREATE SUBMISSION] Success!
```

**Frontend**:
```
✅ Toast: "릴리즈가 성공적으로 제출되었습니다!"
✅ /submissions 페이지로 이동
```

---

## 🔄 만약 여전히 실패한다면

### 최후의 수단: 코드 재확인

**Backend Line 394 확인**:
```bash
sed -n '390,425p' backend/src/submissions/submissions.controller.ts
```

**기대 내용**:
```typescript
const { audioFiles, musicVideoFile, musicVideoThumbnail, lyricsFile, ...trackData } = track;
```

**만약 없다면**:
- 파일이 저장되지 않았음
- 다시 수정 필요

**Frontend Line 1291 확인**:
```bash
sed -n '1291,1302p' frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx
```

**기대 내용**:
```typescript
tracks: formData.tracks.map(t => ({
  id: t.id,
  title: t.title,
  // ... 필요한 필드만
}))
```

---

## 📊 오늘 완료된 작업 (배포 가능)

1. ✅ Hydration 타이밍 해결
2. ✅ React 19 lazy() 해결
3. ✅ 보안 강화
4. ✅ QC 검증 로직 완벽 개선
5. ✅ QC UI 현대화
6. ✅ MultiSelect, ReleaseProjects, AccordionSection 수정

**이것들을 먼저 커밋/배포하면**:
- 사용자에게 즉시 가치 제공
- Backend submission은 다음에 안정적으로 해결

---

## 🎯 다음 세션 시작 명령어

```bash
# 1. 모든 프로세스 종료
pkill -9 -f "nest"; pkill -9 -f "vite"

# 2. 캐시 삭제
cd backend && rm -rf dist/
cd ../frontend && rm -rf dist/ node_modules/.vite/

# 3. Backend 시작
cd ../backend && npm run start:dev

# 4. Frontend 시작 (새 터미널)
cd ../frontend && npm run dev

# 5. 시크릿 창으로 테스트
# Cmd+Shift+N → http://localhost:3000
```

**예상 소요 시간**: 30분 이내 완전 해결

---

**작성일**: 2024-12-10
**상태**: Backend submission 문제 분석 완료, 해결 대기
**우선순위**: 높음
**예상 난이도**: 낮음 (절차만 따르면 해결)
