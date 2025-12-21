# 🎨 N3RVE Premium Color System Guide

프로젝트 전체의 세련되고 고급스러운 색상 시스템 가이드입니다.

## 📊 디자인 철학

**영감**: Stripe, Linear, Vercel, Apple
**핵심**: 검은색/회색 기반 + 전략적 투명도 + 최소 악센트

### 왜 이 색상 시스템인가?

1. **전문성**: 금융/엔터프라이즈 플랫폼 수준
2. **시대를 초월한 우아함**: 2-3년 후에도 현대적
3. **콘텐츠 중심**: 색상이 사용자 콘텐츠와 경쟁하지 않음
4. **프리미엄 인식**: 명품 브랜드 (Apple, Tesla)와 연관
5. **눈의 피로 감소**: 낮은 채도로 장시간 사용 최적화

---

## 🎯 색상 매핑 가이드

### 기존 → 새 시스템

| 컴포넌트 | 기존 (Legacy) | 새 시스템 (Premium) |
|----------|---------------|---------------------|
| **배경** | `from-purple-50 via-pink-50 to-blue-50` | `bg-dark-0` |
| **카드** | `bg-white/5 border-white/10` | `bg-glass-dark-medium backdrop-blur-premium border-glass-dark shadow-glass-dark` |
| **Primary CTA** | `bg-gradient-to-r from-purple-500 to-pink-500` | `bg-accent-blue-400 hover:bg-accent-blue-500 shadow-premium` |
| **Secondary 버튼** | `bg-white/5 border-white/10` | `bg-glass-dark-medium hover:bg-glass-dark-strong border-glass-dark` |
| **텍스트 제목** | `text-white` | `text-dark-900` |
| **텍스트 본문** | `text-gray-400` | `text-dark-700` |
| **텍스트 보조** | `text-gray-500` | `text-dark-600` |
| **보더** | `border-white/10` | `border-glass-dark` |
| **성공** | `text-green-400` | `text-accent-green-400` |
| **에러** | `text-red-400` | `text-accent-red-400` |

---

## 💻 실전 사용 예시

### Premium Card

```tsx
// Before (Legacy - 주석 처리됨)
/*
<div className="
  p-6 bg-white/5 backdrop-blur-md
  border border-white/10 rounded-xl
">
*/

// After (Premium)
<div className="
  p-6 bg-glass-dark-medium backdrop-blur-premium
  border border-glass-dark rounded-2xl
  shadow-glass-dark hover:shadow-premium
  transition-all duration-300
">
  {/* Content */}
</div>
```

### Primary CTA Button

```tsx
// Before (Legacy - 주석 처리됨)
/*
<button className="
  bg-gradient-to-r from-purple-500 to-pink-500
  hover:shadow-lg hover:shadow-purple-500/50
">
*/

// After (Premium)
<button className="
  bg-accent-blue-400 hover:bg-accent-blue-500
  text-white font-medium
  shadow-premium hover:shadow-premium-lg
  rounded-xl px-6 py-3
  transition-all duration-200
">
  {translate('제출', 'Submit', '提出')}
</button>
```

### Secondary Button

```tsx
// Before (Legacy - 주석 처리됨)
/*
<button className="
  bg-white/5 hover:bg-white/10
  border border-white/10
">
*/

// After (Premium)
<button className="
  bg-glass-dark-medium hover:bg-glass-dark-strong
  backdrop-blur-premium
  border border-glass-dark
  text-dark-800 hover:text-dark-900
  rounded-xl px-6 py-3
  transition-all duration-200
">
  {translate('취소', 'Cancel', 'キャンセル')}
</button>
```

### Section Headers

```tsx
// Before (Legacy - 주석 처리됨)
/*
<div className="p-2 bg-purple-500/20 rounded-lg">
  <Target size={20} className="text-purple-400" />
</div>
*/

// After (Premium)
<div className="p-2 bg-accent-blue-400/10 rounded-lg">
  <Target size={20} className="text-accent-blue-400" />
</div>
```

### Page Background

```tsx
// Before (Legacy - 주석 처리됨)
/*
<div className="
  min-h-screen
  bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50
  dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900
">
*/

// After (Premium)
<div className="
  min-h-screen
  bg-dark-0
  dark:bg-dark-0
">
  {/* Content */}
</div>
```

---

## 🔧 적용 단계

### 1단계: Tailwind Config ✅
- [x] 프리미엄 색상 팔레트 추가
- [x] 기존 n3rve 보라색 주석 처리
- [x] Glass effect 유틸리티 업데이트

### 2단계: MarketingSubmission (진행 중)
- [ ] 배경 색상 변경
- [ ] 카드 스타일 업데이트
- [ ] 버튼 색상 변경
- [ ] 섹션 아이콘 색상 조정

### 3단계: 공통 컴포넌트
- [ ] Header.tsx
- [ ] Button components
- [ ] Card components
- [ ] Input components

### 4단계: 기타 페이지
- [ ] Login/Register
- [ ] Dashboard
- [ ] ReleaseSubmission

---

## 🎨 색상 Quick Reference

### 자주 사용하는 조합

```css
/* Primary CTA */
bg-accent-blue-400 hover:bg-accent-blue-500 text-white

/* Secondary Button */
bg-glass-dark-medium hover:bg-glass-dark-strong border-glass-dark text-dark-800

/* Card */
bg-glass-dark-medium backdrop-blur-premium border-glass-dark shadow-glass-dark

/* Text Heading */
text-dark-900 font-bold

/* Text Body */
text-dark-700

/* Text Secondary */
text-dark-600

/* Success State */
text-accent-green-400 bg-accent-green-400/10

/* Error State */
text-accent-red-400 bg-accent-red-400/10

/* Warning State */
text-accent-amber-400 bg-accent-amber-400/10
```

---

## ♿ 접근성 체크리스트

- ✅ WCAG AAA 대비 (7:1 ratio)
- ✅ 키보드 네비게이션 focus ring
- ✅ 색맹 모드 호환
- ✅ 고대비 모드 지원

---

## 🔄 롤백 방법

기존 색상으로 되돌리려면:

1. `tailwind.config.js` 열기
2. 주석 처리된 legacy 색상 주석 해제
3. 새 premium 색상 주석 처리
4. 컴포넌트에서 legacy 클래스 주석 해제

모든 기존 코드는 주석으로 보존되어 있어 언제든 복원 가능합니다.

---

## 🚀 다음 단계

1. MarketingSubmission 페이지 색상 적용
2. 브라우저에서 미리보기
3. 피드백 수집
4. 점진적으로 다른 페이지 적용

**시작일**: 2025-12-19
**예상 완료**: 점진적 적용 (1-2주)
