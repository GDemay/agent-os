# Design System Style Guide

## Overview
This document defines the core design system components for ensuring consistency across the application.

## Color Palette

### Primary Colors
- **Primary Blue**: `#007AFF` - Used for primary actions and links.
- **Primary Dark**: `#0056CC` - Used for hover states.
- **Primary Light**: `#66B3FF` - Used for subtle highlights.

### Neutral Colors
- **Black**: `#000000` - Text and icons.
- **Gray 900**: `#1A1A1A` - Headings.
- **Gray 700**: `#4D4D4D` - Body text.
- **Gray 500**: `#808080` - Secondary text.
- **Gray 300**: `#CCCCCC` - Borders and dividers.
- **Gray 100**: `#F5F5F5` - Backgrounds.
- **White**: `#FFFFFF` - Backgrounds and cards.

### Semantic Colors
- **Success**: `#28A745` - Positive actions and indicators.
- **Warning**: `#FFC107` - Cautionary messages.
- **Error**: `#DC3545` - Errors and destructive actions.
- **Info**: `#17A2B8` - Informational messages.

## Typography

### Font Family
- **Primary Font**: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Monospace Font**: 'Roboto Mono', 'Courier New', monospace

### Font Sizes (Scale: 1.25)
- **H1**: 3.052rem (48.83px) - Page titles
- **H2**: 2.441rem (39.06px) - Section headings
- **H3**: 1.953rem (31.25px) - Subsection headings
- **H4**: 1.563rem (25.00px) - Card titles
- **H5**: 1.25rem (20.00px) - Small headings
- **Body Large**: 1.125rem (18px) - Lead paragraphs
- **Body**: 1rem (16px) - Default body text
- **Body Small**: 0.875rem (14px) - Captions and metadata
- **Caption**: 0.75rem (12px) - Tiny labels

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semi-bold**: 600
- **Bold**: 700

### Line Heights
- **Tight**: 1.2 - For headings
- **Normal**: 1.5 - For body text
- **Loose**: 1.8 - For long-form content

## Iconography

### Icon Set
We use **Material Design Icons** (filled variant) from [material.io/icons](https://material.io/icons).

### Sizes
- **Small**: 16px
- **Medium**: 24px (default)
- **Large**: 32px
- **X-Large**: 48px

### Usage Guidelines
- Use icons to enhance clarity, not decorate.
- Ensure icons are accessible with proper `aria-label`.
- Maintain consistent stroke weight (2px).
- Use the same color as adjacent text unless indicating state.

## Spacing

### Base Unit
**8px** - All spacing multiples are based on this unit.

### Scale
- **xxs**: 2px (0.25 × base)
- **xs**: 4px (0.5 × base)
- **sm**: 8px (1 × base)
- **md**: 16px (2 × base)
- **lg**: 24px (3 × base)
- **xl**: 32px (4 × base)
- **xxl**: 48px (6 × base)
- **xxxl**: 64px (8 × base)

### Usage
- Use for margins, padding, and gaps.
- Prefer even multiples of the base unit.
- Use consistent spacing within components.

## Border Radius
- **Small**: 4px
- **Medium**: 8px
- **Large**: 16px
- **Full**: 9999px (for pills and circles)

## Shadows
- **Small**: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)
- **Medium**: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)
- **Large**: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)

## Breakpoints
- **Mobile**: 0–767px
- **Tablet**: 768px–1023px
- **Desktop**: 1024px–1439px
- **Wide Desktop**: 1440px+

## Usage Guidelines
1. Always reference this guide when designing new components.
2. Use CSS custom properties (variables) for theming.
3. Test contrast ratios for accessibility (WCAG AA minimum).
4. Maintain consistency across platforms (web, mobile).

---
*Last updated: $(date)*
