# Design System Guidelines

## 1. Color Palette

### Primary Colors
- Primary: #3B82F6 (Blue-600)
- Primary Dark: #1D4ED8 (Blue-800)
- Primary Light: #93C5FD (Blue-300)

### Neutral Colors
- Background: #FFFFFF
- Surface: #F9FAFB
- Text Primary: #111827
- Text Secondary: #6B7280
- Border: #D1D5DB

### Semantic Colors
- Success: #10B981 (Green-500)
- Warning: #F59E0B (Yellow-500)
- Error: #EF4444 (Red-500)
- Info: #3B82F6 (Blue-500)

## 2. Typography

### Font Family
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Monospace: 'JetBrains Mono', 'Courier New', monospace

### Font Sizes (rem scale)
- Display: 3rem (48px)
- Heading 1: 2.25rem (36px)
- Heading 2: 1.875rem (30px)
- Heading 3: 1.5rem (24px)
- Body Large: 1.125rem (18px)
- Body: 1rem (16px)
- Body Small: 0.875rem (14px)
- Caption: 0.75rem (12px)

### Font Weights
- Light: 300
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### Line Heights
- Tight: 1.25
- Normal: 1.5
- Relaxed: 1.75

## 3. Spacing

### Spacing Scale (based on 4px unit)
- 0: 0px
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)
- 20: 5rem (80px)

### Usage
- Padding, margins, gaps should use these values.
- Use consistent spacing between elements (e.g., 1rem between form fields).

## 4. UI Component Standards

### Buttons
- Primary Button: Background Primary, white text, rounded-md, padding 0.5rem 1rem.
- Secondary Button: Transparent, border Primary, text Primary, rounded-md, padding 0.5rem 1rem.
- Disabled: opacity 0.5, cursor not-allowed.

### Inputs
- Height: 2.5rem
- Padding: 0.5rem 0.75rem
- Border: 1px solid Border color, rounded-md
- Focus: ring-2 ring Primary Light

### Cards
- Background: Surface
- Border: 1px solid Border color
- Border radius: 0.5rem
- Padding: 1.5rem
- Box shadow: subtle shadow for elevation

### Alerts
- Success: green background, white text, icon
- Warning: yellow background, dark text, icon
- Error: red background, white text, icon
- Info: blue background, white text, icon

## 5. Grid & Layout
- Use a 12-column grid system.
- Max container width: 1280px
- Breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px

## 6. Icons
- Use a consistent icon set (e.g., Heroicons, Lucide).
- Size: match text size (e.g., 1rem for body).

## 7. Accessibility
- Ensure sufficient color contrast (WCAG AA).
- Use semantic HTML.
- Provide focus indicators.
- Support keyboard navigation.

---
*This design system is a living document. Update as the product evolves.*
