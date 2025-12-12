# 🎯 FUGA Marketing Services 제출 워크플로우

## 📋 전체 프로세스

### Step 1: Release Project 생성
```
URL: /catalog/release_projects/[ID]
예시: /catalog/release_projects/1005874867701
```

### Step 2: "Submit project to marketing services" 버튼 클릭
```
위치: Marketing Services 섹션
버튼: "Submit project to marketing services"
```

### Step 3: Fillout 검증 화면 (이미지 #1)
```
URL: Fillout 외부 폼
제목: testt
```

---

## ⚠️ 필수 요구사항 (Fillout 검증)

### 1. Link an Artist to Release Project
```
경고: "It looks like you haven't selected an artist for your release project yet."

필수 이유:
"While this field isn't required in FUGA, linking an artist to your release
project is essential for marketing submissions to ensure your artist submissions
are processed correctly in our system."

해결 방법:
1. Close this link and return to FUGA
2. Select the first primary artist for your release project
3. Hit the "Save" button (bottom right corner)
4. Then, click the "Submit" button again

FAQ 링크: Why can I only submit one artist for my project in SCORE,
and why must I select an artist in FUGA first?
```

### 2. Add a Project Start Date
```
경고: "It looks like you haven't selected a Project Start Date yet."

필수 이유:
"While this field isn't required in FUGA, assigning a start date is essential
for projects without products to ensure proper planning and scheduling in our system."

해결 방법:
1. Close this link and return to FUGA
2. Add a "Project Start Date" in your release project settings
3. Hit the "Save" button (bottom right corner)
4. Then, click the "Submit" button again

FAQ 링크: Why is a Project Start Date required for projects without products?
```

---

## 🔄 올바른 제출 순서

### 필수 전제 조건
```
1. ✅ Release Project 생성
2. ✅ 아티스트 연결 (필수!)
3. ✅ Project Start Date 설정 (제품 없을 시 필수!)
4. (선택) 제품 추가
```

### 제출 프로세스
```
1. Release Project 페이지
2. Details 섹션에서:
   - Release project artist 입력
   - Project start date 입력
   - "Save" 버튼 클릭 (우측 하단)

3. Marketing Services 섹션
4. "Submit project to marketing services" 클릭
5. Fillout 검증 통과
6. 마케팅 팀에 제출됨
```

---

## 💡 Fillout 검증 로직

### 검증 항목
```typescript
interface ValidationChecks {
  hasArtist: boolean;        // 필수
  hasStartDate: boolean;     // 제품 없을 시 필수
  hasProducts: boolean;      // 선택
}

// 검증 실패 시
if (!hasArtist) {
  showWarning('Link an Artist to Your Release Project');
  blockSubmission();
}

if (!hasProducts && !hasStartDate) {
  showWarning('Add a Project Start Date');
  blockSubmission();
}

// 모두 통과 시
if (hasArtist && (hasProducts || hasStartDate)) {
  allowSubmission();
  proceedToMarketingForm();
}
```

---

## 🎨 Fillout 화면 구조

```
┌─────────────────────────────────────────────┐
│  testt                                       │
├─────────────────────────────────────────────┤
│                                              │
│  ⚠️ Action Required: Link an Artist         │
│  ⚠️ 경고 메시지                              │
│  📝 설명                                     │
│  • 해결 방법 1                               │
│  • 해결 방법 2                               │
│  • 해결 방법 3                               │
│  • 해결 방법 4                               │
│  FAQ: 링크                                   │
│                                              │
├─────────────────────────────────────────────┤
│                                              │
│  ⚠️ Action Required: Add Project Start Date │
│  ⚠️ 경고 메시지                              │
│  📝 설명                                     │
│  • 해결 방법 1                               │
│  • 해결 방법 2                               │
│  • 해결 방법 3                               │
│  • 해결 방법 4                               │
│  FAQ: 링크                                   │
│                                              │
├─────────────────────────────────────────────┤
│                          [Next →]            │
└─────────────────────────────────────────────┘
```

---

## 🔍 N3RVE 플랫폼 연동 포인트

### FUGA 시스템과의 연결
```
N3RVE 온보딩 플랫폼
  ↓ 제출 완료
Release Project 생성 (FUGA)
  ↓ 아티스트 연결 + Start Date
Submit to Marketing Services
  ↓ Fillout 검증
Marketing Team 접수
```

### 필수 데이터 매핑
```typescript
// N3RVE → FUGA
{
  projectName: submission.albumTitle,
  artist: submission.artistName,  // 필수!
  products: submission.tracks,
  startDate: submission.releaseDate  // 제품 없을 시 필수!
}
```

---

**문서가 저장되었습니다!** 📝

`FUGA_MARKETING_WORKFLOW.md` 파일에 모든 로직이 기록되었습니다.

다음 조사가 필요하신가요?