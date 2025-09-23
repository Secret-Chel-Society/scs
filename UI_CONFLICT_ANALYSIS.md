# UI Conflict Analysis: shadcn/ui vs Mantine UI

## 🚨 **CRITICAL CONFLICTS IDENTIFIED**

### 1. **CSS Reset Conflicts**
**Problem:** Both libraries have their own CSS resets that conflict
- **shadcn/ui**: Uses Tailwind's `@tailwind base` which includes CSS reset
- **Mantine**: Has its own CSS reset in `@mantine/core/styles.css`

**Impact:** 
- Inconsistent styling across components
- Conflicting box-sizing, margins, and padding
- Different font rendering

### 2. **CSS Variable Conflicts**
**Problem:** Both libraries use CSS custom properties with overlapping names
- **shadcn/ui**: Uses `--background`, `--foreground`, `--primary`, etc.
- **Mantine**: Uses its own CSS variables for theming

**Impact:**
- Theme switching issues
- Color inconsistencies
- Dark mode conflicts

### 3. **Global Styles Override**
**Problem:** Your custom CSS in `globals.css` has extensive hockey-themed styles that may override Mantine components
- Custom `.hockey-*` classes
- Tailwind utilities that might conflict
- Custom animations and transitions

### 4. **Font Loading Conflicts**
**Problem:** Both libraries may try to load different fonts
- **shadcn/ui**: Uses Inter font from Google Fonts
- **Mantine**: Has its own font system

## 🔧 **SOLUTIONS**

### Solution 1: CSS Isolation (Recommended)
Create separate CSS files for each UI system:

```css
/* mantine-overrides.css */
@import '@mantine/core/styles.css';
@import '@mantine/notifications/styles.css';
@import '@mantine/dates/styles.css';

/* Override Mantine styles to work with your theme */
.mantine-Container-root {
  --mantine-color-scheme: light dark;
}

.mantine-Card-root {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
}

.mantine-Button-root {
  font-family: inherit;
}
```

### Solution 2: CSS Layer Management
Update your `globals.css` to use CSS layers:

```css
@layer base, mantine, components, utilities;

@layer base {
  @tailwind base;
}

@layer mantine {
  @import '@mantine/core/styles.css';
  @import '@mantine/notifications/styles.css';
  @import '@mantine/dates/styles.css';
}

@layer components {
  @tailwind components;
  /* Your custom components */
}

@layer utilities {
  @tailwind utilities;
}
```

### Solution 3: Component Wrapper Strategy
Create wrapper components that handle conflicts:

```typescript
// components/ui/mantine-safe-card.tsx
import { Card as MantineCard } from '@mantine/core'
import { cn } from '@/lib/utils'

interface MantineSafeCardProps {
  className?: string
  children: React.ReactNode
  // ... other props
}

export function MantineSafeCard({ className, children, ...props }: MantineSafeCardProps) {
  return (
    <MantineCard
      className={cn(
        "hockey-card", // Your custom styles
        className
      )}
      styles={{
        root: {
          backgroundColor: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        }
      }}
      {...props}
    >
      {children}
    </MantineCard>
  )
}
```

## 🎯 **IMMEDIATE ACTIONS NEEDED**

### 1. **Update Mantine Provider**
```typescript
// components/providers/mantine-provider.tsx
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

const theme = createTheme({
  // Use your existing CSS variables
  colors: {
    // Map your hockey colors to Mantine colors
    blue: ['#f0f8ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
    gray: ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a'],
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  // ... rest of theme
})
```

### 2. **Create CSS Override File**
```css
/* styles/mantine-overrides.css */
@import '@mantine/core/styles.css';
@import '@mantine/notifications/styles.css';

/* Override Mantine to use your CSS variables */
.mantine-Container-root {
  --mantine-color-scheme: light dark;
}

.mantine-Card-root {
  background: hsl(var(--card)) !important;
  color: hsl(var(--card-foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

.mantine-Button-root {
  font-family: inherit !important;
}

/* Ensure Mantine components respect your theme */
.mantine-Text-root {
  color: hsl(var(--foreground));
}

.mantine-Input-root {
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
}
```

### 3. **Update Layout**
```typescript
// app/layout.tsx
import './globals.css'
import './styles/mantine-overrides.css' // Add this

// ... rest of layout
```

## ⚠️ **POTENTIAL ISSUES**

### 1. **Performance Impact**
- Loading both CSS systems increases bundle size
- Potential for unused CSS

### 2. **Maintenance Complexity**
- Need to maintain compatibility between both systems
- Updates to either library might break integration

### 3. **Developer Experience**
- Developers need to know which components to use when
- Inconsistent APIs between libraries

## 🚀 **RECOMMENDED MIGRATION STRATEGY**

### Phase 1: Setup (Current)
- ✅ Install Mantine
- ✅ Create provider
- ⚠️ **NEXT**: Fix CSS conflicts

### Phase 2: Gradual Migration
- Start with one page (management)
- Create wrapper components
- Test thoroughly

### Phase 3: Complete Migration
- Remove shadcn/ui components
- Clean up unused CSS
- Optimize bundle

## 🔍 **TESTING CHECKLIST**

- [ ] Mantine components render correctly
- [ ] Dark mode works with both systems
- [ ] Custom hockey theme is preserved
- [ ] No layout shifts or styling conflicts
- [ ] Performance is acceptable
- [ ] Mobile responsiveness maintained

## 💡 **QUICK FIXES**

### Immediate CSS Fix
Add this to your `globals.css`:

```css
/* Mantine CSS Reset Override */
@import '@mantine/core/styles.css' layer(mantine);

@layer mantine {
  .mantine-Container-root {
    --mantine-color-scheme: light dark;
  }
  
  .mantine-Card-root {
    background: hsl(var(--card));
    color: hsl(var(--card-foreground));
    border: 1px solid hsl(var(--border));
  }
}
```

This will help resolve the most critical conflicts immediately.
