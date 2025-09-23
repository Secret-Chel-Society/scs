# Mantine UI Migration Guide

## 🎯 Overview
This guide helps you migrate from shadcn/ui to Mantine UI gradually, component by component.

## ✅ What's Already Set Up

### 1. **Mantine Installed**
```bash
npm install @mantine/core@latest @mantine/hooks@latest @mantine/notifications@latest @mantine/dates@latest @mantine/form@latest --legacy-peer-deps
```

### 2. **Provider Setup**
- Created `components/providers/mantine-provider.tsx`
- Added to `app/layout.tsx`
- Custom theme with hockey colors

### 3. **Example Component**
- Created `components/management/mantine-management-page.tsx` as reference

## 🔄 Migration Strategy

### Phase 1: Install Additional Mantine Packages
```bash
# For more components
npm install @mantine/modals@latest @mantine/spotlight@latest @mantine/dropzone@latest @mantine/carousel@latest --legacy-peer-deps
```

### Phase 2: Component Mapping

| shadcn/ui | Mantine | Notes |
|-----------|---------|-------|
| `Card` | `Card` | Similar API, better theming |
| `Button` | `Button` | More variants and sizes |
| `Badge` | `Badge` | Better color system |
| `Tabs` | `Tabs` | More flexible |
| `Table` | `Table` | Better responsive design |
| `Select` | `Select` | More features |
| `Input` | `TextInput` | Better validation |
| `Skeleton` | `Skeleton` | Similar functionality |
| `Toast` | `Notifications` | Better positioning |

### Phase 3: Gradual Migration

#### Step 1: Update Imports
```typescript
// Before (shadcn/ui)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// After (Mantine)
import { Card, Text, Group, Badge, Button } from '@mantine/core'
```

#### Step 2: Update Component Usage
```typescript
// Before (shadcn/ui)
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>

// After (Mantine)
<Card padding="md" radius="md" withBorder>
  <Stack gap="md">
    <Text size="lg" fw={600}>Title</Text>
    <Text>Content</Text>
  </Stack>
</Card>
```

## 🎨 Custom Theme

The Mantine theme includes your hockey colors:
- `ice` - Blue variants
- `rink` - Gray variants  
- `hockey` - Dark variants
- `goal` - Red variants
- `assist` - Green variants

## 📝 Migration Examples

### Card Component
```typescript
// shadcn/ui
<Card className="p-4">
  <CardHeader>
    <CardTitle>Team Stats</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Content here</p>
  </CardContent>
</Card>

// Mantine
<Card padding="md" radius="md" withBorder>
  <Stack gap="sm">
    <Text size="lg" fw={600}>Team Stats</Text>
    <Text>Content here</Text>
  </Stack>
</Card>
```

### Button Component
```typescript
// shadcn/ui
<Button variant="outline" size="sm">
  Click me
</Button>

// Mantine
<Button variant="light" size="sm">
  Click me
</Button>
```

### Table Component
```typescript
// shadcn/ui
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John</TableCell>
    </TableRow>
  </TableBody>
</Table>

// Mantine
<Table>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Name</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    <Table.Tr>
      <Table.Td>John</Table.Td>
    </Table.Tr>
  </Table.Tbody>
</Table>
```

## 🚀 Next Steps

1. **Start with one page** (e.g., management page)
2. **Replace components gradually**
3. **Test functionality** after each change
4. **Remove shadcn/ui** components when no longer used

## 💡 Benefits of Mantine

- **Better TypeScript support**
- **More components** out of the box
- **Better theming system**
- **Built-in dark mode**
- **Better responsive design**
- **More customization options**

## 🔧 Troubleshooting

### Common Issues:
1. **Import errors**: Make sure to import from `@mantine/core`
2. **Styling conflicts**: Mantine styles might conflict with Tailwind
3. **Theme issues**: Check the custom theme configuration

### Solutions:
1. **Use Mantine's CSS-in-JS** instead of Tailwind classes
2. **Configure Mantine theme** properly
3. **Use Mantine's responsive system** instead of Tailwind breakpoints
