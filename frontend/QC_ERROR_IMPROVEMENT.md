# 📋 QC 검증 에러 메시지 개선

## 문제 상황

**Before** ❌:
- Submit 클릭
- Toast: "QC 검증 실패: 오류를 수정해주세요"
- **무엇이 문제인지 전혀 알 수 없음**
- 사용자가 답답함

## 개선 사항

### 1. 상세 에러 메시지

**After** ✅:
```
QC 검증 실패 (5개 오류):

1. [album-title] 앨범 제목에 금지된 문자가 포함되어 있습니다
2. [track-1-title] 트랙 제목이 너무 깁니다 (최대 100자)
3. [cover-art] 커버 아트 해상도가 낮습니다 (최소 3000x3000)

...및 2개 더 (아래 QC 경고 섹션 확인)
```

**포함 정보**:
- ✅ 에러 개수
- ✅ 필드명 ([field])
- ✅ 구체적인 문제 내용
- ✅ 추가 에러 안내

### 2. Toast 설정 개선

```typescript
toast.error(message, {
  duration: 8000,  // 8초 - 읽을 시간 충분
  style: { whiteSpace: 'pre-line' }  // 줄바꿈 표시
});
```

### 3. 자동 스크롤

```typescript
// QC Warnings 섹션으로 자동 스크롤
const warningsElement = document.querySelector('[data-qc-warnings]');
warningsElement.scrollIntoView({ behavior: 'smooth' });
```

---

## 코드 변경

### handleSubmit 함수

**Before**:
```typescript
if (results.errors.length > 0) {
  setShowWarnings(true);
  toast.error('QC 검증 실패: 오류를 수정해주세요');
  return;
}
```

**After**:
```typescript
if (results.errors.length > 0) {
  setShowWarnings(true);

  // Detailed error summary
  const errorCount = results.errors.length;
  const firstErrors = results.errors.slice(0, 3);
  const errorSummary = firstErrors.map((err, idx) =>
    `${idx + 1}. ${err.field ? `[${err.field}] ` : ''}${err.message}`
  ).join('\n');

  const fullMessage = errorCount <= 3
    ? `QC 검증 실패 (${errorCount}개 오류):\n\n${errorSummary}`
    : `QC 검증 실패 (${errorCount}개 오류):\n\n${errorSummary}\n\n...및 ${errorCount - 3}개 더`;

  toast.error(fullMessage, {
    duration: 8000,
    style: { whiteSpace: 'pre-line' }
  });

  // Auto-scroll to warnings
  setTimeout(() => {
    document.querySelector('[data-qc-warnings]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);

  return;
}
```

### QCWarnings 렌더링

**Before**:
```jsx
{showWarnings && validationResults && (
  <QCWarnings ... />
)}
```

**After**:
```jsx
{showWarnings && validationResults && (
  <div data-qc-warnings className="scroll-mt-4">
    <QCWarnings ... />
  </div>
)}
```

---

## 사용자 경험 개선

### Before ❌

1. Submit 클릭
2. Toast: "오류를 수정해주세요" (막연함)
3. QCWarnings 어딘가에 있지만 못 찾음
4. 무엇이 문제인지 모름
5. 사용자 답답함

### After ✅

1. Submit 클릭
2. Toast (8초, 상세):
   ```
   QC 검증 실패 (3개 오류):
   1. [album-title] 문제 설명
   2. [track-1] 문제 설명
   3. [cover-art] 문제 설명
   ```
3. 자동으로 QCWarnings 섹션으로 스크롤
4. 전체 에러 목록 확인
5. 각 에러를 하나씩 수정

---

## 배포 정보

**Git Commit**: `bb33307`
```bash
feat: Add detailed QC error messages on submit
```

**Changes**:
- frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx

**Benefits**:
- ✅ 명확한 에러 식별
- ✅ 빠른 문제 해결
- ✅ 향상된 UX
- ✅ 사용자 답답함 해소

---

## 예시 시나리오

### 시나리오 1: 1개 에러

Toast:
```
QC 검증 실패 (1개 오류):

1. [album-title] 앨범 제목에 특수문자가 포함되어 있습니다
```

### 시나리오 2: 3개 에러

Toast:
```
QC 검증 실패 (3개 오류):

1. [album-title] 앨범 제목 문제
2. [track-1-title] 트랙 제목 문제
3. [cover-art] 커버 아트 문제
```

### 시나리오 3: 5개 이상

Toast:
```
QC 검증 실패 (7개 오류):

1. [album-title] 문제 1
2. [track-1] 문제 2
3. [cover-art] 문제 3

...및 4개 더 (아래 QC 경고 섹션 확인)
```
+ 자동 스크롤 → QCWarnings 전체 목록

---

**사용자 경험 크게 향상!** 📋✅

**작성일**: 2024-12-10
**Git Commit**: bb33307
**Status**: Deployed
