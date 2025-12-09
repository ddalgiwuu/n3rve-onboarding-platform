# 🔧 마케팅 Steps 제거 가이드

## 📍 수정할 파일

**파일**: `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`

---

## ✅ Step 1: Import 주석 처리 (완료)

**Line 34-36**:
```typescript
// Marketing steps moved to separate MarketingSubmission page
// import Step11MarketingDetails from '@/components/steps/Step11MarketingDetails';
// import Step12GoalsExpectations from '@/components/steps/Step12GoalsExpectations';
```

---

## 🔧 Step 2: Case 4-5 주석 처리

### Line 2913-2919 (Case 4)
```typescript
// case 4: // Marketing Details - REMOVED
//   return (
//     <Step11MarketingDetails
//       formData={formData}
//       onChange={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
//     />
//   );
```

### Line 2921-2958 (Case 5)
```typescript
// case 5: // Goals & Expectations - REMOVED
// (전체 주석 처리)
```

---

## 🔢 Step 3: Case 번호 변경

**변경 전**:
```
case 1: Album Info
case 2: Tracks
case 3: Files
case 4: Marketing (삭제)
case 5: Goals (삭제)
case 6: Distribution
case 7: Review
```

**변경 후**:
```
case 1: Album Info
case 2: Tracks
case 3: Files
case 4: Distribution (원래 case 6)
case 5: Review (원래 case 7)
```

---

## 📝 구체적 수정 위치

### Location 1: Line 2960
**변경 전**: `case 6: // Distribution`
**변경 후**: `case 4: // Distribution`

### Location 2: Line 3016
**변경 전**: `case 7: // Review`
**변경 후**: `case 5: // Review`

### Location 3: Line 666-810 (상단 switch)
동일하게 case 4-5 주석, case 6-7을 4-5로 변경

---

## 🔍 확인할 변수

**totalSteps 변경**:
- 찾기: `const totalSteps = 7`
- 변경: `const totalSteps = 5`

**step 검증 로직**:
- `currentStep > 7` → `currentStep > 5`로 변경

---

## ✅ 완료 체크리스트

- [x] Step11-12 import 주석 처리
- [ ] Case 4-5 주석 처리
- [ ] Case 6 → Case 4로 변경
- [ ] Case 7 → Case 5로 변경
- [ ] totalSteps = 5로 변경
- [ ] 검증 로직 업데이트
- [ ] 테스트

---

## 🚀 다음: Success 페이지 업데이트

**파일**: `/pages/submission/SubmissionSuccess.tsx`

**추가할 버튼**:
```tsx
<button onClick={() => navigate(`/marketing-submission/${submissionId}`)}>
  🎯 마케팅 작성하기 (추천)
</button>

<button onClick={() => navigate('/release-projects')}>
  ⏭️ 나중에 작성
</button>
```

---

**예상 작업 시간**: 1-2시간
**위험도**: 낮음 (단순 주석 처리)
