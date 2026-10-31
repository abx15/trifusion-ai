# TriFusion AI - Design System

**Location:** `packages/ui/src/`  
**Framework:** Material UI v7 + Emotion  
**Theme:** Light and dark modes  
**Font:** Inter (sans-serif)

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#003F5C` | Primary buttons, links, active states |
| Secondary | `#58508D` | Secondary actions, accents |
| Purple | `#8A508F` | Analytics, creative elements |
| Pink | `#BC5090` | Highlights, special badges |
| Coral | `#FF6361` | Errors, destructive actions |
| Orange | `#FF8531` | Warnings, attention |
| Amber | `#FFA600` | Info, caution |

## Theme Tokens

### Typography
- Font family: `Inter`, system sans-serif
- h1-h6: Semantic headings with decreasing sizes
- body1/body2: Body text at 1rem and 0.875rem
- button: 0.9375rem, font-weight 500, no text-transform
- caption/overline: Small auxiliary text

### Spacing
- Base unit: 8px
- Padding options: none (0), small (16px), medium (24px), large (32px)

### Border Radius
- Standard: 8px
- Cards: 12px

### Elevation
- Cards: subtle border + optional shadow
- Elevated cards: `0 4px 6px -1px rgb(0 0 0 / 0.05)`
- No heavy shadows — flat, enterprise aesthetic

## Component Variants

### Button
- Variants: primary, secondary, outline, ghost, danger, destructive, success
- Sizes: small, medium, large, sm, lg
- Props: isLoading, fullWidth, asChild

### Card
- Variants: default, outlined, elevated
- Padding: none, small, medium, large

### Badge
- Variants: default, primary, secondary, success, warning, error, info
- Sizes: small, medium, large

### Alert
- Severities: error, warning, info, success
- Variant: destructive, default
- Sub-components: AlertTitle, AlertDescription

### Table
- Configurable columns with alignment
- Loading and empty states
- Row click support

## Usage

```tsx
import { TrifusionProvider, Button, Card, KPICard, Badge } from '@trifusion/ui';

function MyComponent() {
  return (
    <TrifusionProvider mode="light">
      <Card variant="elevated">
        <Button variant="primary" isLoading={false}>
          Click me
        </Button>
      </Card>
    </TrifusionProvider>
  );
}
```
