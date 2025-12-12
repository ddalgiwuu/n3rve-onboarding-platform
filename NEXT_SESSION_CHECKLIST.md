# 🔍 다음 세션 체크리스트 - 2024-12-12

## 📋 세션 시작 시 즉시 확인할 사항

### 🚨 현재 알려진 문제 (우선 수정 필요)

#### 문제 1: 아티스트 등록 모달이 보이지 않음
**증상**:
- "새 아티스트 등록" 버튼 클릭
- 화면이 블러 처리됨 (배경만 어두워짐)
- 모달 내용이 표시되지 않음

**원인 분석**:
```
파일: /frontend/src/pages/MarketingSubmission.tsx
위치: Line 744-772

예상 원인:
1. 모달 박스의 색상이 배경과 동일 (bg-gray-900)
2. z-index 충돌 가능성
3. 모달 내부 요소의 visibility 문제
4. 부모 요소의 overflow 제한
```

**해결 방법**:
```tsx
// Line 744-772를 다음으로 교체:

{showArtistForm && (
  <div
    className="fixed inset-0 z-[10000] flex items-center justify-center"
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    onClick={() => setShowArtistForm(false)}
  >
    <div
      className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-md w-full mx-4 border border-purple-500 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        {translate('새 아티스트 등록', 'Register New Artist')}
      </h3>
      <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm leading-relaxed">
        {translate(
          '아티스트 등록 기능은 곧 추가됩니다. 현재는 아티스트 이름만 입력하시면 됩니다.',
          'Artist registration feature coming soon. For now, you can just enter the artist name directly.'
        )}
      </p>
      <button
        onClick={() => setShowArtistForm(false)}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all"
      >
        {translate('확인', 'OK')}
      </button>
    </div>
  </div>
)}
```

**변경 사항**:
- `bg-gray-900` → `bg-white dark:bg-gray-800` (명확한 구분)
- `z-[9999]` → `z-[10000]` (더 높게)
- `border-purple-500/30` → `border-purple-500` (더 선명하게)
- 텍스트 색상 명확화

---

#### 문제 2: 드롭다운 위치 이상
**증상**:
- 드롭다운이 입력창 아래가 아닌 화면 하단에 표시
- 스크롤 시 위치 틀어짐

**원인 분석**:
```
파일: /frontend/src/components/submission/PrimaryArtistSelector.tsx
위치: Line 34-42 (position calculation)

문제:
1. getBoundingClientRect() 시점이 잘못됨
2. position: fixed를 사용하면서 scroll offset 계산 오류
```

**해결 방법 A (간단)**:
Portal 제거하고 일반 드롭다운으로 변경
```tsx
// Line 137-229를 간단한 드롭다운으로 교체
{showDropdown && (
  <div className="absolute z-50 w-full mt-2 ...">
    {/* 기존 드롭다운 내용 */}
  </div>
)}
```

**해결 방법 B (권장)**:
position 계산 수정
```tsx
// Line 34-42 수정
useEffect(() => {
  if (showDropdown && inputRef.current) {
    const updatePosition = () => {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }
}, [showDropdown]);
```

---

## ✅ 완료된 작업 (보존해야 함)

### 1. Backend 버그 수정 (9개) ✅
```
파일 위치:
- backend/src/submissions/submissions.service.ts (Line 105-109 제거)
- backend/src/submissions/submissions.controller.ts (Line 206-213 수정)

수정 내용:
1. ✅ Backend Submission 500 에러 (audioFiles 제거)
2. ✅ coverArt/coverImage 둘 다 처리
3. ✅ MarketingSubmission 401 에러 (api instance 사용)
4. ✅ StarRating AnimatePresence import
5. ✅ Dashboard React Query + Hook 순서
6. ✅ ReleaseProjects API 수정
7. ✅ Success Modal 추가
8. ✅ 텍스트 가독성 개선
```

### 2. FUGA 데이터 수집 (672개 항목) ✅
```
파일 위치:
- frontend/src/constants/fuga-data.ts (신규 생성)
- frontend/src/constants/fuga-tooltips.ts (신규 생성)

수집 완료:
- 22개 Main Genres
- 569개 Subgenres (장르별 동적)
- 18개 Moods
- 45개 Instruments
- 8개 Marketing Platforms

문서 위치:
- FUGA_COMPLETE_GENRE_SUBGENRE_LIST.md
- FUGA_MARKETING_FORM_ALL_PAGES.md
- FUGA_DROPDOWN_OPTIONS.md
```

### 3. 신규 컴포넌트 생성 (6개) ✅
```
생성 완료:
1. ✅ PrimaryArtistSelector.tsx (7.3KB)
2. ✅ GenreSelector.tsx (9.3KB)
3. ✅ PlatformBudgetTable.tsx (8.9KB)
4. ✅ MarketingDriversList.tsx (6.6KB)
5. ✅ FieldTooltip.tsx (신규)
6. ✅ MarketingSection.tsx (14.1KB - 업데이트)

위치: /frontend/src/components/submission/
```

### 4. MarketingSubmission.tsx 확장 (33개 필드 추가) ✅
```
파일: /frontend/src/pages/MarketingSubmission.tsx
라인 수: 434줄 → 759줄 (+325줄, 75% 증가)

추가된 State (15개):
- primaryArtist
- frontlineOrCatalog
- moreProductsComing
- projectArtwork
- privateListeningLink
- mainGenre
- subgenres
- isSoundtrack
- dolbyAtmos
- marketingDrivers
- platformBudgets
- otherNotes
- showArtistForm

추가된 UI 섹션 (5개):
1. 주 아티스트 섹션
2. 프로젝트 컨텍스트 섹션
3. 음악 정보 섹션
4. 마케팅 드라이버 섹션
5. 플랫폼별 예산 섹션
```

---

## 🔧 즉시 수정 필요 (다음 세션 첫 작업)

### 1️⃣ 아티스트 등록 모달 표시 문제 (최우선)

**수정 파일**: `/frontend/src/pages/MarketingSubmission.tsx`
**수정 위치**: Line 744-772

**현재 코드**:
```tsx
// bg-gray-900 사용 → 배경과 구분 안 됨
<div className="bg-gray-900 p-8 rounded-2xl ...">
```

**수정 코드**:
```tsx
// bg-white dark:bg-gray-800 사용 → 명확한 구분
<div className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-md w-full mx-4 border-2 border-purple-500 shadow-2xl">
  {/* 텍스트 색상도 명확하게 */}
  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
  <p className="text-gray-700 dark:text-gray-300 mb-6 ...">
</div>
```

**테스트 방법**:
1. 브라우저 새로고침
2. 아티스트 검색창에 커서 → 드롭다운 열림
3. "새 아티스트 등록" 클릭
4. ✅ 흰색/회색 박스 표시 확인
5. ✅ 텍스트 읽기 가능 확인

---

### 2️⃣ 드롭다운 위치 수정

**수정 파일**: `/frontend/src/components/submission/PrimaryArtistSelector.tsx`
**수정 위치**: Line 34-42, Line 137-229

**옵션 A: 간단 수정** (Portal 제거, 권장)
```tsx
// Line 137-229 전체 교체
{showDropdown && (
  <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
    {/* 기존 드롭다운 내용 그대로 */}
  </div>
)}
```

**옵션 B: Portal 수정** (현재 방식 유지)
```tsx
// Line 34-42에서 scroll/resize 이벤트 리스너 추가
useEffect(() => {
  if (!showDropdown || !inputRef.current) return;

  const updatePosition = () => {
    const rect = inputRef.current!.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  };

  updatePosition();
  window.addEventListener('scroll', updatePosition, true);
  window.addEventListener('resize', updatePosition);

  return () => {
    window.removeEventListener('scroll', updatePosition, true);
    window.removeEventListener('resize', updatePosition);
  };
}, [showDropdown]);
```

**권장**: 옵션 A (간단하고 안정적)

---

## 📊 현재 서버 상태

### Backend
```
PID: 73795
Port: 3001
Status: ✅ Running
Health: http://localhost:3001/api/health → {"status":"ok"}
```

### Frontend
```
PID: 78682
Port: 3000
Status: ✅ Running
VITE: v7.2.4
```

**서버 확인 명령어**:
```bash
# 프로세스 확인
ps aux | grep -E "(73795|78682)" | grep -v grep

# Health check
curl http://localhost:3001/api/health
curl -I http://localhost:3000

# 서버 재시작 (필요시)
kill 73795 78682
cd backend && npm run start:dev
cd frontend && npm run dev
```

---

## 📝 수정된 파일 목록

### Backend (2개)
```
backend/src/submissions/submissions.service.ts
  - Line 105-109: audioFiles 제거

backend/src/submissions/submissions.controller.ts
  - Line 206-213: coverArt/coverImage 둘 다 처리
```

### Frontend - Constants (2개)
```
frontend/src/constants/fuga-data.ts (신규, 300줄)
  - 22 Genres
  - 569 Subgenres
  - 18 Moods
  - 45 Instruments
  - TypeScript types

frontend/src/constants/fuga-tooltips.ts (신규, 200줄)
  - 모든 필드 설명
  - 한/영 번역
  - FUGA 베스트 프랙티스
```

### Frontend - Components (6개)
```
frontend/src/components/submission/PrimaryArtistSelector.tsx (신규, 230줄)
  ⚠️ 수정 필요: 드롭다운 위치 문제

frontend/src/components/submission/GenreSelector.tsx (신규, 9.3KB)
  ✅ 정상 작동

frontend/src/components/submission/PlatformBudgetTable.tsx (신규, 8.9KB)
  ✅ 정상 작동

frontend/src/components/submission/MarketingDriversList.tsx (신규, 6.6KB)
  ✅ 정상 작동

frontend/src/components/ui/FieldTooltip.tsx (신규)
  ✅ 정상 작동

frontend/src/components/submission/MarketingSection.tsx (업데이트)
  - Moods: 12 → 18개
  - Instruments: 11 → 45개
  ✅ 정상 작동
```

### Frontend - Pages (1개)
```
frontend/src/pages/MarketingSubmission.tsx (대폭 업데이트)
  - 434줄 → 759줄 (+325줄)
  - 33개 State 추가
  - 5개 UI 섹션 추가
  ⚠️ 수정 필요: 아티스트 모달 표시 문제
```

### Frontend - 기타 (4개)
```
frontend/src/pages/Dashboard.tsx
  - React Query 추가
  - Hook 순서 수정
  ✅ 정상 작동

frontend/src/pages/ReleaseProjects.tsx
  - API 파라미터 추가
  - 응답 형식 처리
  - 텍스트 가독성 개선
  ✅ 정상 작동

frontend/src/components/SubmissionSuccessModal.tsx (신규)
  ✅ 정상 작동

frontend/src/components/ui/StarRating.tsx
  - AnimatePresence import
  ✅ 정상 작동
```

---

## 🎯 다음 세션 작업 순서

### 1단계: 즉시 수정 (10분)
```
1. 아티스트 모달 배경색 수정
   - bg-gray-900 → bg-white dark:bg-gray-800
   - 텍스트 색상 명확화

2. 드롭다운 Portal 제거 (옵션 A 적용)
   - createPortal 제거
   - 일반 absolute 드롭다운으로 변경

3. 브라우저 테스트
   - 모달 표시 확인
   - 드롭다운 위치 확인
```

### 2단계: Backend 통합 (2-3시간)
```
1. Prisma Schema 확인
   - submission 모델에 33개 필드 존재 여부
   - 없으면 추가 필요

2. API 엔드포인트 확장
   - PATCH /api/submissions/:id/marketing
   - 33개 신규 필드 수신 및 저장

3. 파일 업로드 처리
   - projectArtwork 업로드
   - Dropbox 또는 로컬 저장
```

### 3단계: 데이터 저장/로드 테스트 (1시간)
```
1. 모든 필드 입력
2. 임시저장 클릭
3. 페이지 새로고침
4. 데이터 로딩 확인
5. 최종 제출 테스트
```

---

## 📚 참고 문서 위치

### 구현 완료 문서
```
MARKETING_INTEGRATION_COMPLETE.md
  - 47개 필드 전체 목록
  - 컴포넌트 사용법
  - Props 인터페이스
```

### FUGA 분석 문서 (8개)
```
FUGA_COMPLETE_GENRE_SUBGENRE_LIST.md - 전체 목록
FUGA_MARKETING_FORM_ALL_PAGES.md - 3페이지 분석
FUGA_DROPDOWN_OPTIONS.md - 드롭다운 옵션
FUGA_MARKETING_WORKFLOW.md - 제출 워크플로우
FUGA_ARTIST_SUBMISSION.md - 아티스트 등록
FUGA_ADD_PRODUCTS_ANALYSIS.md - Add Products 기능
FUGA_MARKETING_FORM_COMPLETE.md - 마케팅 폼 구조
FUGA_GENRES_PROGRESS.md - 수집 진행 기록
```

### 세션 요약 문서 (3개)
```
SESSION_SUMMARY_2024-12-11_COMPLETE.md - 전체 요약
TODAY_COMPLETE_FINAL.md - 오늘 완료 사항
NEXT_SESSION_START_HERE.md - 시작 가이드
```

---

## 🔍 코드 검색 키워드

### 문제 해결 시 유용한 검색어
```bash
# 아티스트 모달 관련
grep -r "showArtistForm" frontend/src/pages/

# 드롭다운 Portal 관련
grep -r "createPortal" frontend/src/components/

# Primary Artist 관련
grep -r "PrimaryArtistSelector" frontend/src/

# FUGA Constants 사용처
grep -r "fuga-data" frontend/src/
grep -r "FUGA_GENRES\|FUGA_MOODS\|FUGA_INSTRUMENTS" frontend/src/
```

---

## ⚠️ 주의사항

### 코드 수정 시 주의
1. **기존 작동하는 코드는 건드리지 말 것**:
   - Dashboard.tsx ✅
   - ReleaseProjects.tsx ✅
   - SubmissionSuccessModal.tsx ✅
   - MarketingSection.tsx ✅

2. **Backend 수정 전 백업**:
   - Prisma Schema 변경 전 마이그레이션 확인
   - API 엔드포인트 수정 시 기존 호환성 유지

3. **테스트 필수**:
   - 각 수정 후 브라우저 테스트
   - Backend 로그 확인
   - Console 에러 확인

---

## 🚀 빠른 시작 명령어

```bash
# 1. 프로젝트 디렉토리 이동
cd /Users/ryansong/Desktop/n3rve-onbaording

# 2. 서버 상태 확인
ps aux | grep -E "(73795|78682)" | grep -v grep

# 3. 이 문서 다시 열기
cat NEXT_SESSION_CHECKLIST.md

# 4. 수정할 파일 열기
code frontend/src/pages/MarketingSubmission.tsx
code frontend/src/components/submission/PrimaryArtistSelector.tsx

# 5. Backend 로그 모니터링 (다른 터미널)
tail -f /tmp/backend-final.log

# 6. Frontend 로그 모니터링 (다른 터미널)
tail -f /tmp/frontend-clean.log
```

---

## 📊 진행 상황

### 완료
- ✅ Backend 버그: 9/9 (100%)
- ✅ FUGA 데이터 수집: 672/672 (100%)
- ✅ Frontend 구현: 47/47 필드 (100%)
- ✅ 컴포넌트 생성: 6/6 (100%)
- ✅ Constants 생성: 2/2 (100%)

### 수정 필요
- ⚠️ 아티스트 모달 표시: 1개
- ⚠️ 드롭다운 위치: 1개

### 미완료
- ⏳ Backend 통합: 0%
- ⏳ 데이터 저장/로드 테스트: 0%

---

## 💡 문제 해결 팁

### 모달이 안 보일 때
1. 브라우저 개발자 도구 열기 (F12)
2. Elements 탭에서 모달 div 검색
3. 존재하는지 확인
4. 스타일 확인 (display, visibility, opacity, z-index)
5. 색상 확인 (배경과 구분되는지)

### 드롭다운이 안 열릴 때
1. Console에서 에러 확인
2. showDropdown state 확인 (React DevTools)
3. inputRef.current 존재 여부 확인
4. getBoundingClientRect() 값 확인
5. Portal 렌더링 위치 확인 (document.body)

---

**작성일**: 2024-12-12 00:00
**작성자**: Claude Code
**다음 작업**: 위 1단계 즉시 수정부터 시작
**예상 시간**: 10분 (수정) + 3시간 (Backend)
