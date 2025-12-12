# 🔄 다음 세션 시작 가이드

## 📊 현재 상태

### ✅ 완료된 작업
1. Hydration 타이밍 해결 (useState lazy init)
2. React 19 lazy() 해결 (Admin 일반 import)
3. 보안 강화 (민감 로그 제거)
4. QC 검증 로직 완벽 개선 (roles 배열, instruments)
5. QC UI 현대화 (Modal, Banner, 번역)
6. MultiSelect 객체 지원
7. ReleaseProjects Array 방어
8. AccordionSection 중첩 button 제거

### ⏳ 남은 문제

**Backend Submission - Prisma audioFiles 에러**

**에러**:
```
Unknown argument `audioFiles` in Track type
```

**시도한 해결책**:
1. Frontend에서 track.audioFiles 제거 (destructuring)
2. Backend에서 track.audioFiles 제거 (destructuring)
3. Dropbox 토큰 갱신 (sharing.write 권한 추가)

**여전히 500 에러 발생**

## 🔍 다음 세션 시작 시

### 1단계: 환경 확인
```bash
cd /Users/ryansong/Desktop/n3rve-onbaording

# Backend 실행
cd backend
npm run start:dev

# Frontend 실행 (새 터미널)
cd frontend
npm run dev
```

### 2단계: 코드 확인

**Frontend**:
```bash
# Line 1291 확인
grep -A 10 "tracks: formData.tracks.map" frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx
```

**Backend**:
```bash
# Line 392 확인
grep -A 30 "tracks:.*submissionData.tracks?.map" backend/src/submissions/submissions.controller.ts
```

### 3단계: 브라우저 캐시 완전 제거

**방법 1**: 시크릿 창
```
Cmd+Shift+N (Chrome)
http://localhost:3000
```

**방법 2**: 캐시 삭제
```
1. DevTools (F12)
2. Application 탭
3. Clear site data
4. 완전 새로고침
```

### 4단계: Submit 테스트 및 로그 확인

**Backend 터미널에서**:
- POST /api/submissions 요청 확인
- Prisma 에러 메시지 확인
- track 데이터에 audioFiles가 있는지 확인

## 🎯 확인해야 할 사항

### Frontend가 보내는 데이터
```javascript
// Console에서 확인
console.log('Sending tracks:', tracks);
```

### Backend가 받는 데이터
```typescript
// Controller에서 로그 확인
console.log('Received tracks:', submissionData.tracks);
```

### Prisma가 받는 데이터
```typescript
// 최종 prismaData 확인
console.log('Prisma tracks:', prismaData.tracks);
```

## 💡 추가 디버깅 방법

**Frontend에 로그 추가**:
```typescript
// handleSubmit에서
console.log('📤 Sending to backend:', {
  tracks: formData.tracks.map(t => ({
    id: t.id,
    title: t.title,
    hasAudioFiles: !!t.audioFiles
  }))
});
```

**Backend에 로그 추가**:
```typescript
// Controller에서
console.log('📥 Received from frontend:', {
  tracksCount: submissionData.tracks?.length,
  firstTrack: submissionData.tracks?.[0],
  hasAudioFilesInTrack: !!submissionData.tracks?.[0]?.audioFiles
});
```

## 🔧 가능한 근본 원인

### 1. 브라우저 캐시
- **증상**: 코드는 수정되었지만 브라우저가 이전 코드 실행
- **해결**: 시크릿 창 또는 캐시 완전 삭제

### 2. Track 타입 정의 문제
- **증상**: TypeScript 타입에 audioFiles가 있어서 자동 포함
- **해결**: Track interface 확인 및 수정

### 3. Spread 연산자 문제
- **증상**: `...t` 사용 시 audioFiles가 포함됨
- **해결**: 명시적 필드 선택 (이미 수정함)

### 4. 다른 코드 경로
- **증상**: 다른 곳에서 audioFiles 추가
- **해결**: 전체 코드 검색

## 📋 체크리스트

- [ ] Backend 정상 실행 (port 3001)
- [ ] Frontend 정상 실행 (port 3000)
- [ ] Dropbox 토큰 설정됨
- [ ] 브라우저 캐시 제거
- [ ] 시크릿 창으로 테스트
- [ ] Backend 로그에서 정확한 에러 확인
- [ ] track.audioFiles가 여전히 나타나는지 확인

## 🚀 다음 작업

1. **시크릿 창**으로 http://localhost:3000 접속
2. **Submit** 클릭
3. **Backend 터미널**에서 로그 확인
4. **정확한 에러 메시지** 복사

**Backend 로그에서 찾을 내용**:
- `🔍 [CREATE SUBMISSION]` 로그들
- `track.audioFiles` 문자열이 있는지
- Prisma 에러의 정확한 메시지

---

**작성일**: 2024-12-10
**상태**: Backend submission 문제 해결 대기
**우선순위**: 높음
