# ⚡ 빠른 수정 가이드 - 마케팅 Steps 완전 제거

## 🎯 수정할 파일

**파일**: `/frontend/src/pages/ImprovedReleaseSubmissionWithDnD.tsx`

---

## ✅ 이미 완료된 것

- Line 35-36: Import 주석 처리 ✅
- Line 2913-2926: 렌더링 case 4-5 주석 처리 ✅
- Line 2928: case 6 → case 4 변경 ✅
- Line 2984: case 7 → case 5 변경 ✅

---

## ⏳ 남은 1가지

### Line 763-810: 검증 로직 주석 처리

**찾기**: Line 763
```typescript
      case 4: // Marketing Details
```

**교체**:
```typescript
      // case 4: // Marketing Details - REMOVED
      // case 5: // Goals & Expectations - REMOVED

      case 4: // Distribution (changed from case 6)
```

**구체적으로**:
1. Line 763-808 **전체 삭제**
2. Line 810 `case 6` → `case 4`로 변경

---

## 🚀 완료 후

1. 브라우저 강력 새로고침 (`Cmd+Shift+R`)
2. 7-step → **5-step** 폼 확인!
3. 마케팅 정보 항목 사라짐 ✅

---

**예상 시간**: 1분
**위치**: Line 763-810
