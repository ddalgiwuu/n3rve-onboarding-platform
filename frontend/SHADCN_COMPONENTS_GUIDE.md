# 🎨 shadcn/ui Monochrome Glass 컴포넌트 가이드

N3RVE 프로젝트의 shadcn/ui 컴포넌트 사용 가이드 - 순수 흑백 Glass 디자인

## 📦 설치된 컴포넌트 (18개)

### Core UI (4)
- ✅ **Button** - 6 variants (default, glass, outline, secondary, ghost, link)
- ✅ **Input** - Glass text input
- ✅ **Label** - Form labels
- ✅ **Textarea** - Glass multi-line input

### Forms (5)
- ✅ **Select** - Glass dropdown with search
- ✅ **Checkbox** - Glass checkbox
- ✅ **Switch** - Glass toggle
- ✅ **Form** - react-hook-form wrapper
- ✅ **Separator** - Divider line

### Layout (5)
- ✅ **Card** - Glass card container
- ✅ **Dialog** - Glass modal
- ✅ **Dropdown Menu** - Glass context menu
- ✅ **Tabs** - Glass tab navigation
- ✅ **Tooltip** - Hover tooltips

### Advanced (5)
- ✅ **Table** - Data tables
- ✅ **Badge** - Status badges
- ✅ **Progress** - Progress bars
- ✅ **Calendar** - Date picker
- ✅ **Command** - Search palette

---

## 🎨 Monochrome Glass 디자인 원칙

모든 컴포넌트는 다음 스타일을 따릅니다:

```tsx
// 순수 흑백 투명도
bg-white/[0.08] dark:bg-white/[0.06]  // 매우 투명

// 완전 무채색 블러
backdrop-blur-xl saturate-0           // 색상 제거

// 흰색 보더 (상단/좌측 밝게)
border-white/10 dark:border-white/8
border-t-white/15 border-l-white/15

// Layered shadows
shadow-[
  0_8px_32px_rgba(0,0,0,0.12),
  inset_0_1px_0_rgba(255,255,255,0.08)
]

// Hover 효과
hover:bg-white/12 dark:hover:bg-white/10
hover:scale-[1.02] hover:-translate-y-0.5
```

---

## 💻 사용 예시

### **1. Button**

```tsx
import { Button } from "@/components/ui/button"

// 6가지 variants
<Button>Default Glass</Button>
<Button variant="glass">Ultra Glass</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Upload /></Button>

// Loading state
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>
```

### **2. Card**

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Release Information</CardTitle>
    <CardDescription>Enter your album details below</CardDescription>
  </CardHeader>

  <CardContent>
    {/* Your content */}
  </CardContent>

  <CardFooter className="flex gap-2">
    <Button variant="ghost">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

### **3. Form with Input/Select**

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

<div className="space-y-4">
  <div>
    <Label htmlFor="title">Album Title</Label>
    <Input id="title" placeholder="Enter title..." />
  </div>

  <div>
    <Label htmlFor="genre">Genre</Label>
    <Select>
      <SelectTrigger id="genre">
        <SelectValue placeholder="Select genre" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pop">Pop</SelectItem>
        <SelectItem value="rock">Rock</SelectItem>
        <SelectItem value="hiphop">Hip Hop</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div>
    <Label htmlFor="desc">Description</Label>
    <Textarea id="desc" placeholder="Describe your release..." />
  </div>
</div>
```

### **4. Dialog (Modal)**

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Modal</Button>
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Submission</DialogTitle>
      <DialogDescription>
        Are you sure you want to submit this release?
      </DialogDescription>
    </DialogHeader>

    <div className="py-4">
      {/* Modal content */}
    </div>

    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### **5. Checkbox & Switch**

```tsx
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

<div className="space-y-3">
  <div className="flex items-center gap-2">
    <Checkbox id="dolby" />
    <Label htmlFor="dolby">Dolby Atmos</Label>
  </div>

  <div className="flex items-center gap-2">
    <Switch id="motion" />
    <Label htmlFor="motion">Motion Artwork</Label>
  </div>
</div>
```

### **6. Tabs**

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

<Tabs defaultValue="info" className="w-full">
  <TabsList>
    <TabsTrigger value="info">Album Info</TabsTrigger>
    <TabsTrigger value="tracks">Tracks</TabsTrigger>
    <TabsTrigger value="marketing">Marketing</TabsTrigger>
  </TabsList>

  <TabsContent value="info">
    <Card>{/* Album info form */}</Card>
  </TabsContent>

  <TabsContent value="tracks">
    <Card>{/* Track list */}</Card>
  </TabsContent>

  <TabsContent value="marketing">
    <Card>{/* Marketing form */}</Card>
  </TabsContent>
</Tabs>
```

### **7. Badge (상태 표시)**

```tsx
import { Badge } from "@/components/ui/badge"

<div className="flex gap-2">
  <Badge>Default</Badge>
  <Badge variant="secondary">Pending</Badge>
  <Badge variant="success">Approved</Badge>
  <Badge variant="destructive">Rejected</Badge>
  <Badge variant="outline">Draft</Badge>
</div>
```

### **8. Table (Admin 페이지)**

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Album</TableHead>
      <TableHead>Artist</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>My Album</TableCell>
      <TableCell>Artist Name</TableCell>
      <TableCell><Badge>Pending</Badge></TableCell>
      <TableCell>2025-12-20</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 🎯 마이그레이션 가이드

### 기존 컴포넌트 → shadcn 교체

```tsx
// Before (기존 커스텀)
import Button from "@/components/ui/Button"  // 대문자
import Input from "@/components/ui/Input"
import GlassCard from "@/components/ui/GlassCard"

// After (shadcn)
import { Button } from "@/components/ui/button"  // 소문자 + named export
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

// 사용법은 거의 동일
<Button>Click Me</Button>
<Input placeholder="Enter text..." />
<Card>{/* content */}</Card>
```

### Variant 사용

```tsx
// 기존 커스텀에서 variant prop이 있었다면
<Button variant="glass-premium">  // 기존

// shadcn에서는
<Button variant="glass">  // shadcn (동일한 효과)
```

---

## ⚙️ 커스터마이징 방법

### 개별 컴포넌트 스타일 변경

```tsx
// className으로 추가 스타일
<Button className="w-full">Full Width</Button>

<Card className="hover:shadow-2xl">
  Enhanced hover
</Card>
```

### 새 Variant 추가

```tsx
// /src/components/ui/button.tsx
const buttonVariants = cva(/* ... */, {
  variants: {
    variant: {
      // 기존 variants...

      // 새 variant 추가
      premium: "bg-white/20 dark:bg-white/15 backdrop-blur-2xl ..."
    }
  }
})

// 사용
<Button variant="premium">Premium Button</Button>
```

---

## 🔧 Tailwind 통합

shadcn 컴포넌트는 Tailwind와 완벽 호환:

```tsx
<Button className="mt-4 w-full">
  Tailwind utilities work!
</Button>

<Card className="max-w-md mx-auto">
  Responsive & spacing
</Card>
```

---

## 📚 참고 자료

- [shadcn/ui 공식 문서](https://ui.shadcn.com/)
- [컴포넌트 카탈로그](https://ui.shadcn.com/docs/components)
- [Theming 가이드](https://ui.shadcn.com/docs/theming)
- [Examples](https://ui.shadcn.com/examples)

---

## ✅ 마이그레이션 체크리스트

### Week 1-5: 컴포넌트 설치 ✅
- [x] Foundation setup
- [x] Core UI (Button, Input, Textarea, Label)
- [x] Forms (Select, Checkbox, Switch, Form)
- [x] Layout (Card, Dialog, Dropdown, Tabs, Tooltip)
- [x] Advanced (Table, Badge, Progress, Calendar, Command)

### Week 6: 최종 검증 ⏳
- [ ] 전체 페이지 테스트
- [ ] Glass 효과 일관성 확인
- [ ] Light/Dark mode 전환 테스트
- [ ] 접근성 검증
- [ ] 성능 측정
- [ ] 문서 완성

---

## 🎉 마이그레이션 완료!

**18개 shadcn/ui 컴포넌트**가 순수 Monochrome Glass 디자인으로 준비되었습니다.

모든 컴포넌트를 바로 사용할 수 있습니다:
```tsx
import { Button, Card, Input, Select, Dialog, Badge, /* ... */ } from "@/components/ui/*"
```

**세련되고 일관된 디자인 시스템이 완성되었습니다!** 🚀
