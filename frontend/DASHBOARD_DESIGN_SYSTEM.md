# 📐 Dashboard 디자인 시스템 - 전체 프로젝트 표준

모든 페이지에 적용할 통일된 디자인 시스템

## 🎨 핵심 스타일

### **배경 & 레이아웃**
```tsx
// 페이지 컨테이너
<div className="min-h-screen bg-transparent p-6 relative overflow-hidden">
  {/* Monochrome gradient orbs */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.02] dark:bg-white/[0.03] rounded-full blur-3xl" />
    <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-white/[0.015] dark:bg-white/[0.025] rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-black/[0.02] dark:bg-black/[0.03] rounded-full blur-3xl" />
  </div>

  {/* Noise texture */}
  <div
    className="fixed inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: `url("data:image/svg+xml,...")`,
      mixBlendMode: 'overlay'
    }}
  />

  {/* Content - Full width */}
  <div className="w-full space-y-6 relative z-10">
    {/* Page content */}
  </div>
</div>
```

### **Card 컴포넌트 (shadcn)**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card className="magnetic">  {/* Sidebar 효과 */}
  <CardHeader>
    <CardTitle>제목</CardTitle>
    <CardDescription>설명</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**자동 적용 효과**:
- `bg-surface` (투명 배경)
- `backdrop-blur-2xl` (강한 블러)
- `border-modern` (동적 보더)
- `shadow-2xl shadow-black/10 dark:shadow-black/30`
- `overflow-hidden` (scale overflow 방지)

### **Typography**
```tsx
// 3단계만 사용
text-sm (14px)   // 메타데이터, 라벨
text-base (16px) // 본문
text-lg (18px)   // 섹션 제목

// Font Weight
font-semibold  // 라벨
font-bold      // 제목, 숫자
font-medium    // 설명
```

### **Grid 레이아웃**
```tsx
// Stats (3열 고정)
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6

// Actions (반응형)
grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4
```

---

## 📝 적용 체크리스트

모든 페이지에 아래 항목 적용:

- [ ] 배경: `bg-transparent` (html 배경 상속)
- [ ] Gradient orbs (흑백 3개)
- [ ] Noise texture
- [ ] Full width: `w-full`
- [ ] shadcn Card 사용
- [ ] `magnetic` class 추가
- [ ] `overflow-hidden` 적용
- [ ] Typography: sm/base/lg만
- [ ] 텍스트: font-bold, font-semibold

---

## 🚀 페이지별 적용 순서

1. MarketingSubmission
2. ReleaseProjects
3. Submissions
4. Guide
5. Account
6. Settings
7. Admin 페이지들

**모든 페이지가 Dashboard와 동일한 세련된 디자인을 가지게 됩니다!**
