# N3RVE Onboarding - Framer Import Guide

This folder contains all the components, styles, and assets from the n3rve-onboarding platform, optimized for import into Framer.

## 📁 Folder Structure

```
framer-export/
├── components/          # Framer-ready components
│   ├── GlassCard.tsx   # Glassmorphism card component
│   ├── GlassButton.tsx # Button with multiple variants
│   └── GlassInput.tsx  # Form input with validation
├── styles/             # Design tokens and animations
│   ├── design-tokens.css   # Colors, typography, spacing
│   └── animations.ts        # Animation variants for Framer Motion
├── examples/           # Complete examples
│   └── LoginForm.tsx   # Full login form example
└── assets/            # Images and icons (copy from frontend/public)
```

## 🚀 Quick Start

### Method 1: Code Components (Recommended)

1. **Create a new Framer project**
2. **Add Code Components**:
   - In Framer, go to Assets → Code
   - Click "+" to create a new code file
   - Copy the component code from this folder
   - Save with the same filename

3. **Import Order**:
   ```
   1. GlassCard.tsx
   2. GlassButton.tsx
   3. GlassInput.tsx
   4. LoginForm.tsx (example)
   ```

4. **Configure Components**:
   - Each component has property controls
   - Customize colors, sizes, and behaviors
   - Use the visual property panel in Framer

### Method 2: Design Tokens Import

1. **Import CSS Variables**:
   - Copy contents of `design-tokens.css`
   - In Framer: File → Preferences → Custom Code
   - Add to Global CSS section

2. **Create Color Styles**:
   ```css
   /* N3RVE Purple Palette */
   --n3rve-500: #5B02FF;  /* Primary */
   --n3rve-600: #5002e6;  /* Hover */
   --n3rve-700: #4301cc;  /* Active */
   ```

3. **Apply Glass Effects**:
   - Use the glass effect classes from design-tokens.css
   - Apply backdrop-filter for blur effects
   - Use rgba colors for transparency

### Method 3: Animation Variants

1. **Import Animations**:
   ```typescript
   import { animations } from './animations'
   
   // Use in Framer Motion components
   <motion.div variants={animations.card} />
   ```

2. **Available Animations**:
   - Page transitions (fadeIn, slideUp, scaleIn)
   - Card animations (hover, tap effects)
   - Loading states (spinner, skeleton)
   - Success/Error states
   - Floating animations

## 🎨 Design System

### Color Palette
- **Primary**: #5B02FF (N3RVE Purple)
- **Glass Background**: rgba(255, 255, 255, 0.9)
- **Glass Border**: rgba(255, 255, 255, 0.3)
- **Dark Mode**: Included in components

### Typography Scale
```css
text-xs:   0.75rem  (12px)
text-sm:   0.875rem (14px)
text-base: 1rem     (16px)
text-lg:   1.125rem (18px)
text-xl:   1.25rem  (20px)
text-2xl:  1.5rem   (24px)
text-3xl:  1.875rem (30px)
text-4xl:  2.25rem  (36px)
```

### Spacing System
```css
space-xs:  0.5rem  (8px)
space-sm:  0.75rem (12px)
space-md:  1rem    (16px)
space-lg:  1.5rem  (24px)
space-xl:  2rem    (32px)
space-2xl: 3rem    (48px)
```

## 🔧 Component Properties

### GlassCard
- **variant**: light, default, strong, ultra
- **color**: default, purple, blue, pink, success, warning, error
- **hover**: Enable hover effects
- **animate**: Enable animations
- **gradient**: Apply gradient overlay
- **showShimmer**: Add shimmer effect

### GlassButton
- **variant**: primary, secondary, glass, outline, ghost
- **size**: small, medium, large
- **loading**: Show loading state
- **disabled**: Disable interactions
- **primaryColor**: Custom color
- **icon**: Add icon component

### GlassInput
- **type**: text, email, password, number, tel, url
- **error/success**: Validation states
- **helperText**: Additional information
- **maxLength**: Character limit
- **showCharCount**: Display character counter

## 💡 Tips for Framer

### 1. Component Instances
- Use component instances for consistency
- Override properties per instance
- Create variants using property controls

### 2. Responsive Design
- Use Framer's breakpoint system
- Components are responsive by default
- Adjust padding/sizing for mobile

### 3. Interactions
- Components include hover/tap states
- Use onTap event handlers
- Combine with Framer's page transitions

### 4. Dark Mode
- Components support dark mode
- Toggle using CSS classes
- Customize dark mode colors

### 5. Performance
- Components are optimized for web
- Use lazy loading for heavy components
- Minimize animation complexity

## 📚 Advanced Usage

### Custom Glassmorphism
```css
.custom-glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}
```

### Gradient Text
```css
.gradient-text {
  background: linear-gradient(135deg, #9070ff 0%, #5002e6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Floating Animation
```typescript
const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}
```

## 🔗 Resources

- **Original Project**: `/Users/ryansong/Desktop/n3rve-onbaording`
- **Framer Documentation**: https://www.framer.com/docs/
- **Framer Motion**: https://www.framer.com/motion/
- **Support**: Contact N3RVE development team

## ⚠️ Important Notes

1. **Dependencies**: Components use Framer Motion (included in Framer)
2. **Browser Support**: Modern browsers with backdrop-filter support
3. **Performance**: Test on actual devices for glass effects
4. **Customization**: All components are fully customizable
5. **Assets**: Copy logo files from `frontend/public/assets/logos/`

## 🎯 Next Steps

1. Import components into Framer
2. Customize colors to match your brand
3. Create page layouts using components
4. Add interactions and animations
5. Test responsive behavior
6. Publish your Framer site

---

## Component Import Checklist

- [ ] Create new Framer project
- [ ] Import GlassCard component
- [ ] Import GlassButton component
- [ ] Import GlassInput component
- [ ] Import design tokens CSS
- [ ] Import animation variants
- [ ] Test LoginForm example
- [ ] Customize colors and styles
- [ ] Add logo assets
- [ ] Configure dark mode
- [ ] Test responsive layouts
- [ ] Add page transitions
- [ ] Publish and test

## Support

For questions or issues with the Framer import:
1. Check component property controls
2. Verify CSS imports
3. Test in Framer preview mode
4. Review browser console for errors
5. Contact development team if needed

Happy designing! 🎨✨