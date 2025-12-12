# 🚀 다음 세션 시작 가이드

## ✅ 현재 상태

### 서버 실행 중
```
Backend:  PID 73795 → Port 3001 ✅
Frontend: PID 78682 → Port 3000 ✅
```

### 완료된 작업 (오늘)
1. ✅ Backend Submission 500 에러 해결
2. ✅ Dashboard/ReleaseProjects 데이터 로딩
3. ✅ 401 에러 모두 해결
4. ✅ 커버아트 처리 개선
5. ✅ Success Modal 추가
6. ✅ FUGA 워크플로우 완전 분석
7. ✅ 654개 항목 수집 (Genres, Moods, Instruments)
8. ✅ FUGA Constants 파일 생성

---

## 🎯 다음 작업: FUGA 필드 33개 통합

### 구현 계획

**계획서 위치**: `/Users/ryansong/.claude/plans/soft-twirling-quill.md`

**우선순위**:

**Phase 1: Primary Artist 시스템** (P0)
```
1. Primary Artist Selector 컴포넌트 생성
   - 기존 아티스트 선택 (SavedArtistsContext 활용)
   - 신규 아티스트 등록 버튼

2. Artist Submission Modal
   - EnhancedArtistModal 활용 또는 신규 생성
   - 필드: Name, Type, Country, Genre, Bio, SNS, Photo

3. MarketingSubmission 통합
   - State 추가: primaryArtist
   - UI 추가: Project Info 카드 위
   - Save API: primaryArtist 필드 전송
```

**Phase 2: Genre/Subgenre 시스템** (P1)
```
1. GenreSelector 컴포넌트 생성
   - Main Genre 드롭다운 (22개)
   - Subgenre 다중선택 (동적, 최대 3)
   - GENRE_SUBGENRES 활용

2. MarketingSubmission 통합
   - State: mainGenre, subgenres
   - UI: About The Music 섹션 생성
   - Save API: genre, subgenres 필드
```

**Phase 3: 나머지 필드** (P1-P2)
```
1. Private Listening Link (URL 입력)
2. Frontline/Catalog (라디오 버튼)
3. Dolby Atmos (체크박스)
4. More Products Coming (드롭다운)
5. Project Artwork (파일 업로드)
6. Moods 확장 (18개)
7. Instruments 확장 (45개 + 검색)
8. Soundtrack/Score (라디오)
9. Marketing Drivers (동적 리스트)
10. 플랫폼별 예산 (8개 × 3 필드)
11. Other Notes (텍스트 영역)
```

---

## 📁 주요 파일 위치

### 신규 생성
```
frontend/src/constants/fuga-data.ts ✅ 생성 완료
```

### 수정 필요
```
frontend/src/pages/MarketingSubmission.tsx
frontend/src/components/submission/MarketingSection.tsx
frontend/src/components/submission/PrimaryArtistSelector.tsx (신규)
frontend/src/components/submission/GenreSelector.tsx (신규)
frontend/src/components/submission/PlatformBudgetTable.tsx (신규)
```

### Backend 확인 필요
```
backend/src/submissions/submissions.controller.ts
backend/src/submissions/submissions.service.ts
backend/prisma/schema.prisma
```

---

## 🔍 현재 MarketingSubmission 상태

### 구현된 필드 (14개)
1. ✅ Hook
2. ✅ Main Pitch
3. ✅ Moods (12개 - 18개로 확장 필요)
4. ✅ Instruments (11개 - 45개로 확장 필요)
5. ✅ Priority Level
6. ✅ Social Media Plan
7. ✅ Marketing Spend (구조화 필요)
8. ✅ Fact Sheet URL
9. ✅ YouTube Shorts
10. ✅ This Is Playlist
11. ✅ Motion Artwork
12. ✅ Focus Tracks

### 누락 필드 (33개)
- Primary Artist
- Frontline/Catalog
- More Products Coming
- Project Artwork
- Main Genre
- Subgenre
- Private Listening Link
- Dolby Atmos
- Soundtrack/Score
- Marketing Drivers
- 플랫폼별 예산 (24개 필드)
- Other Notes

---

## 🎨 UI/UX 개선 계획

### 섹션 재구성

```
📋 Section 1: Project Context (신규)
  ✅ Primary Artist *
  - Frontline/Catalog *
  - More Products Coming *
  - Project Artwork *

🎵 Section 2: About The Music (신규)
  - Main Genre *
  - Subgenre(s) * (최대 3)
  - Soundtrack/Score? *
  - Private Listening Link *
  - Fact Sheets URL

🎭 Section 3: Music Characterization (확장)
  - Mood(s) * (18개, 최대 3)
  - Instruments * (45개, 검색)
  - Priority Level

🎤 Section 4: Marketing Pitch (기존)
  - Hook *
  - Main Pitch *
  - Marketing Drivers

📱 Section 5: Campaign Details (확장)
  - Social Media Rollout Plan *
  - Platform Budgets (8개)
  - Other Notes

📊 Section 6: Distribution (기존)
  - YouTube Shorts
  - This Is Playlist
  - Dolby Atmos *
  - Motion Artwork

🎯 Section 7: Focus Tracks (기존)
```

---

## 💻 명령어

### 서버 확인
```bash
curl http://localhost:3001/api/health
curl -I http://localhost:3000
```

### 로그 확인
```bash
tail -f /tmp/backend-final.log
tail -f /tmp/frontend-clean.log
```

### 서버 종료 (필요시)
```bash
kill 73795 78682
```

---

## 📊 예상 작업량

### 신규 컴포넌트 (6개)
1. PrimaryArtistSelector
2. GenreSelector
3. PlatformBudgetTable
4. MarketingDriversList
5. ArtistSubmissionModal (또는 기존 활용)
6. 기타 소형 컴포넌트

### 코드 라인 예상
- Constants: 200줄 (완료)
- Components: 800줄
- MarketingSubmission: +200줄
- 총: 약 1,200줄

### 예상 시간
- Phase 1 (Primary Artist): 2일
- Phase 2 (Genre/Subgenre): 2일
- Phase 3 (나머지): 3일
- **총: 6-7일**

---

**작성일**: 2024-12-11
**상태**: 준비 완료
**다음**: Primary Artist 시스템부터 구현 시작
