# 🎯 FUGA SCORE Marketing 제출 폼 완전 분석

## 📋 폼 구조

### 제목
```
testusername | testt
Add Your Release Project To FUGA SCORE
```

---

## ✅ Step 1: Project Details in FUGA (읽기 전용)

**초록색 확인 박스** - FUGA에서 가져온 정보

```
Project Details in FUGA
  Artist(s): testusername
  Project Name: testt
  Your Project Code: (비어있음)
  FUGA Project ID: 1005874867701
  Project Start Date: 12/11/2025

✓ Your Project Description

Digital Products
  Here's a list of the Digital Product(s) currently linked to
  your Release Project in FUGA:

PLEASE NOTE: You will only be able to update these project
details in FUGA.
```

**특징**:
- ✅ 체크마크: 검증 통과
- 📝 읽기 전용: FUGA에서만 수정 가능
- 🔗 연동 데이터: FUGA → SCORE 자동 동기화

---

## 📝 Step 2: Project Context (입력 필수)

### 필드 1: Frontline/Catalog *
```
타입: 라디오 버튼 (필수)
옵션:
  ○ Frontline  - 신규 릴리즈, 적극적 프로모션
  ○ Catalog    - 기존 카탈로그, 유지 관리
```

**설명**:
```
"Please provide our Marketing Services Team with some
extra context on your release project."
```

---

### 필드 2: Are There More Digital Products Coming Up? *
```
타입: 드롭다운 (필수)
질문: "Will you be uploading more digital products for this project later?"
옵션: (스크린샷에서 열리지 않음)
  - 예상: Yes / No / Maybe
```

---

### 필드 3: Priority Level *
```
타입: 별점 (1-5 stars, 필수)
현재: 선택되지 않음 (☆☆☆☆☆)

설명:
"The priority levels you choose are only used to indicate
the importance of this project within the context of your
organization."

예시:
  ⭐ Specialist release or compilation f.e.
  ⭐⭐⭐⭐⭐ Biggest release of the year
```

**용도**: 조직 내부 우선순위 설정

---

### 필드 4: Project Artwork *
```
타입: 파일 업로드 (필수)
형식: Drag & drop 또는 browse

┌─────────────────────────────────┐
│        📁                        │
│  Drag & drop a file or browse   │
└─────────────────────────────────┘

허용 파일: 이미지 (JPG, PNG 등)
```

---

### 필드 5: Select Primary Artist *
```
타입: 텍스트 입력 + Add 버튼 (필수)
현재 값: testusername
상태: ✅ 이미 입력됨

설명:
"You can reuse Artist Information - select from your
previous submission and update your details post-submission
in SCORE."

기능:
  - 기존 아티스트 재사용 가능
  - 제출 후 SCORE에서 수정 가능
  - "+ Add" 버튼으로 추가
```

---

## 🔄 데이터 흐름

### FUGA → Fillout
```
FUGA Release Project
  ↓ 자동 가져오기
Fillout 폼 (읽기 전용 섹션)
  - Artist(s): testusername
  - Project Name: testt
  - Project ID: 1005874867701
  - Start Date: 12/11/2025
```

### 사용자 입력 → SCORE
```
Fillout 폼 입력
  - Frontline/Catalog: [선택]
  - More Products Coming: [선택]
  - Priority Level: [1-5 stars]
  - Project Artwork: [파일 업로드]
  - Primary Artist: testusername
  ↓ 제출
SCORE 마케팅 시스템
  ↓ 처리
Marketing Team 접수
```

---

## 📊 필수 필드 요약

| 필드 | 타입 | 필수 | 기본값 | 출처 |
|------|------|------|--------|------|
| Artist(s) | 텍스트 | ✅ | testusername | FUGA |
| Project Name | 텍스트 | ✅ | testt | FUGA |
| Project ID | 숫자 | ✅ | 1005874867701 | FUGA |
| Start Date | 날짜 | ✅ | 12/11/2025 | FUGA |
| Frontline/Catalog | 라디오 | ✅ | - | 사용자 |
| More Products | 드롭다운 | ✅ | - | 사용자 |
| Priority Level | 별점 | ✅ | - | 사용자 |
| Project Artwork | 파일 | ✅ | - | 사용자 |
| Primary Artist | 텍스트 | ✅ | testusername | 사용자 |

---

## 💡 N3RVE 플랫폼 연동 시사점

### 필요한 데이터 매핑

```typescript
// N3RVE Submission → FUGA SCORE
{
  // FUGA에서 자동 가져옴
  artist: submission.artistName,
  projectName: submission.albumTitle,
  projectId: fugaProjectId,
  startDate: submission.releaseDate,

  // 사용자가 Fillout에서 입력
  frontlineOrCatalog: 'Frontline' | 'Catalog',
  moreProductsComing: boolean,
  priorityLevel: 1 | 2 | 3 | 4 | 5,
  projectArtwork: File,  // 커버아트
  primaryArtist: string
}
```

### N3RVE에서 수집해야 할 추가 정보

**현재 N3RVE 폼에 없는 필드**:
1. **Frontline/Catalog** - 릴리즈 타입 분류
2. **More Products Coming** - 추가 제품 계획
3. **Priority Level** - 우선순위 (1-5)
4. **Project Artwork** - 프로젝트 전용 아트워크

**이미 있는 필드**:
- ✅ Artist Name
- ✅ Album Title
- ✅ Release Date
- ✅ Cover Art

---

## 🎨 UI/UX 특징

### 정보 표시
- **초록색 박스**: 성공/확인 의미
- **읽기 전용**: FUGA 데이터는 수정 불가
- **명확한 안내**: "PLEASE NOTE" 주의사항

### 입력 필드
- **필수 표시**: 별표(*) 사용
- **도움말**: 각 필드마다 설명 텍스트
- **예시 제공**: Priority Level에 예시

### 검증 로직
- **사전 검증**: Fillout 진입 전 (아티스트, Start Date)
- **폼 검증**: 모든 필수 필드 입력 후 제출 가능

---

## 🔗 시스템 연동 구조

```
N3RVE 온보딩 플랫폼
  ↓ 릴리즈 제출
  ↓
FUGA API 연동
  ↓ Release Project 생성
  ↓ Artist 연결
  ↓ Products 추가
  ↓
FUGA Release Project
  ↓ Marketing Services 제출
  ↓
Fillout 검증
  ↓ 아티스트 확인
  ↓ Start Date 확인
  ↓
Fillout 마케팅 폼
  ↓ Project Context 입력
  ↓ Priority 설정
  ↓ Artwork 업로드
  ↓
SCORE 마케팅 시스템
  ↓
Marketing Team 처리
```

---

## 📋 다음 화면 예상

이 폼을 제출하면:
1. 추가 마케팅 정보 입력 (hook, pitch, moods 등)
2. 소셜 미디어 계획
3. 타겟 플레이리스트
4. 최종 제출 확인
5. SCORE 시스템에 등록

---

**작성일**: 2024-12-11 08:45 PM
**문서**: FUGA_MARKETING_FORM_COMPLETE.md
**상태**: 마케팅 폼 구조 완전 분석됨
