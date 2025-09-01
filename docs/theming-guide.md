# Theming Guide

This document explains how theming works in the IT Asset Management System and how to customize it.

## Theme Provider

The application uses `next-themes` for theme management. The ThemeProvider is configured in the root layout (`src/app/layout.tsx`):

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {/* children */}
</ThemeProvider>
```

## Theme Configuration

### Default Themes

The application supports three themes:
- **Light**: Light color scheme
- **Dark**: Dark color scheme
- **System**: Follows the system preference

### Color Palette

The color palette is defined in `src/app/globals.css` using CSS variables. The colors automatically adapt to light and dark modes:

```css
:root {
  /* Light theme colors */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... other colors */
}

.dark {
  /* Dark theme colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... other colors */
}
```

## Using Themes in Components

### useTheme Hook

Use the `useTheme` hook to access theme information:

```tsx
import { useTheme } from '@/hooks/useTheme'

export function MyComponent() {
  const { theme, setTheme, isDark, isLight, mounted } = useTheme()
  
  if (!mounted) return null
  
  return (
    <div className={isDark ? 'dark-theme' : 'light-theme'}>
      {/* Component content */}
    </div>
  )
}
```

### CSS Variables

Access theme colors using CSS variables:

```css
.my-element {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border));
}
```

### Conditional Classes

Use Tailwind's dark mode variants for theme-specific styling:

```tsx
<div className="bg-background text-foreground dark:bg-gray-900 dark:text-white">
  {/* Content */}
</div>
```

## Customizing Themes

### Adding New Colors

To add new colors, extend the CSS variables in `globals.css`:

```css
:root {
  --custom-color: oklch(0.5 0.2 250);
}

.dark {
  --custom-color: oklch(0.3 0.2 250);
}
```

### Theme-Specific Components

Create components that adapt to the current theme:

```tsx
import { useTheme } from '@/hooks/useTheme'

export function ThemedCard({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  
  return (
    <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>
      {children}
    </div>
  )
}
```

## Theme Toggle

The application includes a theme toggle component (`src/components/layout/theme-toggle.tsx`) that allows users to switch between light and dark modes.

To use it in your components:

```tsx
import { ThemeToggle } from '@/components/layout/theme-toggle'

export function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  )
}
```

## Best Practices

1. **Always use CSS variables** for colors instead of hardcoded values
2. **Test both light and dark modes** when creating new components
3. **Use the `mounted` state** from `useTheme` to prevent hydration mismatches
4. **Prefer semantic color names** over specific color values
5. **Use Tailwind's built-in dark mode variants** when possible

## Performance Considerations

1. The ThemeProvider is placed at the root level to ensure consistent theme access
2. Theme changes are debounced to prevent excessive re-renders
3. CSS variables are used for efficient color switching
4. System preference is respected by default to reduce user configuration

## Troubleshooting

### Theme Not Applying

1. Ensure the ThemeProvider is properly configured in the root layout
2. Check that CSS variables are defined for both light and dark modes
3. Verify that components are using the correct CSS variable names

### Hydration Mismatches

1. Use the `mounted` state from `useTheme` before rendering theme-dependent content
2. Avoid server/client theme mismatches by using `suppressHydrationWarning` on the html tag

### Custom Theme Persistence

The application automatically persists theme preferences in localStorage through `next-themes`.