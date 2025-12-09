# N3RVE Header - Visual Design Guide

## Layout Comparison

### BEFORE (Original Design)
```
┌────────────────────────────────────────────────────────────────────┐
│ [☰] [LOGO] Music Distribution    [KO] [EN] [JA] [🌙] [🔔] NAME    │
│                                                              ADMIN  │
│                                                              [👤]▾  │
└────────────────────────────────────────────────────────────────────┘
```
**Issues:**
- Language selector uses 3 buttons (wastes ~120px)
- Uneven spacing
- User info takes too much vertical space
- Center section completely empty

### AFTER (Redesigned)
```
┌────────────────────────────────────────────────────────────────────┐
│ [☰] [LOGO] │ Music Distribution      [🌐KO▾] [🌙] [🔔] │ [👤●] Ryan ADMIN ▾│
└────────────────────────────────────────────────────────────────────┘
```
**Improvements:**
- Compact language dropdown (~60px)
- Even spacing (2-3 gaps)
- Single-line layout
- Visual separators (gradient dividers)
- Online status indicator

---

## Component Details

### 1. Logo Section (Left)
```
Desktop:
┌────────────────────────────────────┐
│ [☰]  [LOGO] │ Music Distribution  │
└────────────────────────────────────┘
     2    3      3         (text)

Mobile:
┌─────────────┐
│ [☰]  [LOGO] │
└─────────────┘
     2    2
```

**Features:**
- Hamburger menu with glass effect
- Logo with hover scale (105%)
- Gradient separator (vertical line)
- Purple-pink gradient text
- Title hidden on mobile (<640px)

**Code:**
```tsx
<div className="flex items-center gap-3 sm:gap-4">
  {/* Hamburger */}
  <button className="p-2 glass-interactive rounded-xl hover:scale-105">
    <Menu className="w-5 h-5" />
  </button>

  {/* Logo + Title */}
  <Link className="flex items-center gap-2 sm:gap-3 group">
    <img className="h-7 sm:h-8" />
    <div className="hidden sm:flex items-center gap-3">
      <div className="w-px h-6 bg-gradient-to-b" /> {/* Separator */}
      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text">
        Music Distribution
      </span>
    </div>
  </Link>
</div>
```

---

### 2. Controls Section (Right)
```
Desktop:
┌────────────────────────────────────────────────────────────┐
│  [🌐KO▾]  [🌙]  [🔔●]  │  [👤● Ryan Song ADMIN ▾]        │
└────────────────────────────────────────────────────────────┘
      60     40     40   1     ~160px

Mobile:
┌──────────────────────────────┐
│  [🌐KO▾]  [🌙]  │  [👤●]    │
└──────────────────────────────┘
      60     40   1    40
```

**Spacing:**
- Controls gap: 2 (mobile) → 3 (desktop)
- Compact components (~40-60px each)
- Vertical divider before profile

---

### 3. User Profile Dropdown

#### Desktop View
```
┌─────────────────────────────────────┐
│  [👤●]  Ryan Song    ▾              │
│   (avatar)  ADMIN                   │
└─────────────────────────────────────┘
    32px    ~120px    icon
```

**Avatar States:**
```
With Picture:          Without Picture:
┌──────┐              ┌──────┐
│ IMG ●│              │ 👤  ●│  (Purple-pink gradient bg)
└──────┘              └──────┘
  32x32                 32x32

● = Green online status (3x3px)
```

#### Mobile View
```
┌──────┐
│ 👤  ●│  (Compact - no text)
└──────┘
```

#### Dropdown Menu
```
Desktop/Mobile:
┌───────────────────────────────┐
│ (Mobile only)                 │
│ Ryan Song                     │
│ ADMIN                         │
├───────────────────────────────┤
│                               │
│ [↪] Logout                    │
│                               │
└───────────────────────────────┘
     w-56 (224px)
```

**Dropdown Animation:**
- Entrance: `animate-scale-in` (scale from 0.9 to 1.0)
- Origin: `top-right`
- Duration: 300ms
- Glassmorphism with purple shadow

**Logout Button Hover:**
```
Normal:                 Hover:
[↪] Logout             [↪-12°] Logout  (icon rotates)
                       (scale 110%, red tint)
```

---

### 4. Language Toggle (Existing Component)

#### Mobile Dropdown
```
Button (Closed):
┌──────────────────┐
│ 🌐 🇰🇷 KO ▾     │
└──────────────────┘

Dropdown (Open):
┌──────────────────────┐
│ ● 🇰🇷 한국어         │
│   Korean           │ (Active - purple bg)
├────────────────────┤
│   🇺🇸 English       │
│   English          │
├────────────────────┤
│   🇯🇵 日本語        │
│   Japanese         │
└──────────────────────┘
```

#### Desktop Pill Toggle
```
┌─────────────────────────────────┐
│ [🇰🇷KO] 🇺🇸EN  🇯🇵JA          │
│  (selected - purple bg)        │
└─────────────────────────────────┘
   80px   80px   80px

Animated indicator slides between options
```

---

### 5. Dark Mode Toggle (Existing Component)

```
Light Mode:          Dark Mode:
┌──────┐             ┌──────┐
│  ☀️  │             │  🌙  │
└──────┘             └──────┘

Transition: 500ms with rotation (180° for sun, 0° for moon)
```

**Hover Effects:**
- Scale: 105%
- Glow effect (purple for moon, amber for sun)
- Background gradient shimmer

---

### 6. Notification Bell

```
Without Notifications:    With Notifications:
┌──────┐                 ┌──────┐
│  🔔  │                 │  🔔 ●│  (Red badge)
└──────┘                 └──────┘

Badge: 2x2px red dot with white ring
Position: top-right corner (-1px offset)
```

**Interaction:**
- Hover: Scale 105%, shadow increase
- Active: Scale 95%
- Desktop only (hidden on mobile)

---

## Color Palette

### Primary Colors (N3RVE Brand)
```css
Purple Primary:   #5B02FF (n3rve-500)
Purple Light:     #9070ff (n3rve-400)
Pink Accent:      #EC4899 (pink-500)

Gradients:
- Logo text:      purple-600 → pink-600
- Avatar bg:      purple-500 → pink-500
- Button hover:   purple-500/20 → blue-500/15
```

### Glass Effects
```css
Light Mode:
- Background:     rgba(255, 255, 255, 0.85-0.95)
- Border:         rgba(255, 255, 255, 0.2-0.4)
- Shadow:         rgba(31, 38, 135, 0.08-0.2)

Dark Mode:
- Background:     rgba(15, 23, 42, 0.6-0.95)
- Border:         rgba(148, 163, 184, 0.1-0.25)
- Shadow:         rgba(0, 0, 0, 0.2-0.5)
```

### Interactive States
```css
Hover:
- Purple border:  rgba(91, 2, 255, 0.2)
- Purple shadow:  rgba(91, 2, 255, 0.1)
- Scale:          1.02-1.05

Active:
- Border:         rgba(91, 2, 255, 0.3)
- Shadow:         rgba(91, 2, 255, 0.2)
- Scale:          0.95-0.98
```

---

## Animations & Transitions

### Micro-interactions
```typescript
// Scale on hover
hover:scale-105         // 1.05x
active:scale-95         // 0.95x
transition-all          // All properties
duration-300            // 300ms

// Icon rotation
group-hover:rotate-180  // Chevron (dropdown)
group-hover:-rotate-12  // Logout icon
```

### Dropdown Entrance
```css
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Applied to dropdown */
.animate-scale-in {
  animation: scale-in 0.3s ease-out;
  transform-origin: top-right;
}
```

### Gradient Separator
```css
/* Vertical gradient line */
.gradient-separator {
  width: 1px;
  height: 24px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(209, 213, 219, 1),  /* gray-300 */
    transparent
  );
}

/* Dark mode */
.dark .gradient-separator {
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(55, 65, 81, 1),     /* gray-700 */
    transparent
  );
}
```

---

## Responsive Breakpoints

### Mobile (< 640px)
```typescript
Hidden:
- Logo title text (Music Distribution)
- User info in button (name + role)
- Notification bell
- Chevron icon in profile

Shown:
- Compact logo only
- Language dropdown (mobile version)
- Dark mode toggle
- Profile avatar with dropdown
```

### Tablet/Desktop (≥ 640px)
```typescript
Shown:
- Full logo + title + separator
- Language pill toggle (desktop version)
- Dark mode toggle
- Notification bell with badge
- User info in profile button
- Chevron dropdown indicator
- Vertical divider before profile
```

### Gap Adjustments
```css
gap-2           /* Mobile: 8px */
sm:gap-3        /* Desktop: 12px */
sm:gap-4        /* Desktop: 16px */
```

---

## Accessibility Features

### ARIA Labels
```tsx
<button aria-label="Toggle menu">
<button aria-label="Notifications">
<button aria-label="User menu" aria-expanded={isOpen}>
```

### Keyboard Navigation
- Tab order: Menu → Logo → Language → Dark Mode → Bell → Profile
- Enter/Space: Activate buttons
- Escape: Close dropdowns
- Click outside: Close dropdowns

### Focus States
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-purple-500/50
focus-visible:ring-offset-2
```

### Screen Reader Support
- Semantic HTML (header, button, nav)
- Alt text for images
- Descriptive button labels
- State announcements (aria-expanded)

---

## Performance Optimizations

### CSS Hardware Acceleration
```css
transform: translateY(-2px) scale(1.02);  /* GPU accelerated */
will-change: transform;                    /* Hint to browser */
backface-visibility: hidden;               /* Prevent flicker */
```

### Event Listener Cleanup
```typescript
useEffect(() => {
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### Conditional Rendering
```tsx
{/* Only render dropdown when open */}
{isProfileOpen && (
  <DropdownMenu />
)}
```

### Image Optimization
```tsx
{/* Separate light/dark logos */}
<img className="dark:hidden" />  {/* Light mode */}
<img className="hidden dark:block" />  {/* Dark mode */}
```

---

## Browser Support

### Modern Features Used
- CSS Grid & Flexbox (full support)
- CSS Custom Properties (full support)
- backdrop-filter (with fallback in globals.css)
- CSS transforms (full support)
- CSS gradients (full support)

### Fallbacks
```css
@supports not (backdrop-filter: blur(12px)) {
  .glass-premium {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

### Tested Browsers
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile Safari ✓
- Chrome Android ✓

---

## Maintenance Guide

### Adding New Controls
```tsx
{/* Add between Language and Dark Mode */}
<div className="flex-shrink-0">
  <YourComponent />
</div>
```

### Customizing Colors
```tsx
{/* Update in tailwind.config.js */}
colors: {
  n3rve: {
    500: '#5B02FF',  // Primary brand color
  }
}
```

### Adjusting Spacing
```tsx
{/* Header container */}
<div className="px-4 sm:px-6">  {/* Horizontal padding */}

{/* Controls gap */}
<div className="gap-2 sm:gap-3">  {/* Between controls */}
```

### Modifying Animations
```tsx
{/* globals.css */}
@keyframes your-animation {
  /* Define keyframes */
}

{/* Component */}
<div className="animate-your-animation">
```

---

## Quick Reference

### Component Sizes
- Header height: 64px (h-16)
- Logo height: 28px mobile, 32px desktop
- Avatar size: 32x32px
- Icon size: 20x20px (w-5 h-5)
- Button padding: 8px (p-2)
- Profile button: 6-12px padding

### Z-Index Layers
- Header: z-50
- Dropdown: z-50
- Notification badge: (relative positioning)

### Transition Speeds
- Fast: 200ms (micro-interactions)
- Normal: 300ms (standard transitions)
- Slow: 500ms (dark mode toggle)

### Shadow Depths
- Light: shadow-md
- Medium: shadow-lg
- Strong: shadow-xl, shadow-2xl
- Colored: shadow-purple-500/5-30
