# Internationalization (i18n) Guide

This document provides comprehensive guidance on the internationalization implementation in the IT Asset Management System (ITAMS), including language support, translation management, and localization best practices.

## Overview

ITAMS implements a comprehensive internationalization (i18n) system that supports multiple languages and locales, enabling organizations worldwide to use the system in their preferred language. The implementation follows industry best practices for web application internationalization.

### Supported Languages

1. **English (en)** - Default language
2. **Traditional Chinese (zh-TW)** - Traditional Chinese support
3. **Additional languages** - Extensible for future language additions

### Key Features

1. **Automatic Language Detection** - Browser-based language detection
2. **Manual Language Selection** - User-controlled language switching
3. **Dynamic Content Loading** - On-demand translation loading
4. **Server-Side Rendering** - Proper i18n with SSR support
5. **RTL Support** - Right-to-left language support (planned)

## Implementation Architecture

### Translation System

#### Language Files Structure

```
src/locales/
├── en.json          # English translations
├── zh-TW.json       # Traditional Chinese translations
└── ...              # Additional language files
```

#### Translation File Format

```json
// src/locales/en.json
{
  "common": {
    "actions": "Actions",
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "view": "View",
    "save": "Save",
    "cancel": "Cancel",
    "search": {
      "placeholder": "Search assets...",
      "button": "Search"
    }
  },
  "nav": {
    "dashboard": "Dashboard",
    "assets": "Assets",
    "pc": "PC",
    "laptop": "Laptop",
    "printer": "Printer",
    "license": "License",
    "warehouse": "Warehouse",
    "internet": "Internet"
  },
  "assets": {
    "pc": {
      "title": "PC",
      "list": {
        "title": "PC List",
        "description": "Manage your PC assets"
      }
    },
    "laptop": {
      "title": "Laptop",
      "list": {
        "title": "Laptop List",
        "description": "Manage your laptop assets"
      }
    }
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome to IT Asset Management System",
    "assetOverview": "Asset Overview",
    "refresh": {
      "success": "Data refreshed successfully",
      "error": "Failed to refresh data"
    }
  }
}
```

### Translation Loading

#### Dynamic Import System

```typescript
// src/lib/i18n.ts
import { logger } from './logger';

interface TranslationResources {
  [key: string]: any;
}

class I18nManager {
  private resources: Map<string, TranslationResources> = new Map();
  private currentLanguage: string = 'en';
  private supportedLanguages: string[] = ['en', 'zh-TW'];

  async loadLanguage(language: string): Promise<void> {
    if (!this.supportedLanguages.includes(language)) {
      logger.warn('Unsupported language requested:', language);
      return;
    }

    if (this.resources.has(language)) {
      return; // Already loaded
    }

    try {
      // Dynamically import the translation file
      const module = await import(`../locales/${language}.json`);
      this.resources.set(language, module.default);
      logger.info('Language loaded successfully:', language);
    } catch (error) {
      logger.error('Failed to load language:', { language, error });
      throw new Error(`Failed to load language: ${language}`);
    }
  }

  setLanguage(language: string): void {
    if (!this.supportedLanguages.includes(language)) {
      logger.warn('Unsupported language:', language);
      return;
    }

    this.currentLanguage = language;
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18n.language', language);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  t(key: string, fallback?: string, ...args: any[]): string {
    try {
      const resources = this.resources.get(this.currentLanguage);
      if (!resources) {
        return fallback || key;
      }

      // Navigate through nested object structure
      const keys = key.split('.');
      let value: any = resources;
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return fallback || key;
        }
      }

      // Handle parameterized translations
      if (typeof value === 'string' && args.length > 0) {
        return this.formatString(value, args);
      }

      return typeof value === 'string' ? value : fallback || key;
    } catch (error) {
      logger.error('Translation error:', { key, error });
      return fallback || key;
    }
  }

  private formatString(template: string, args: any[]): string {
    return template.replace(/{(\d+)}/g, (match, index) => {
      return args[parseInt(index, 10)] !== undefined ? String(args[parseInt(index, 10)]) : match;
    });
  }
}

export const i18nManager = new I18nManager();
```

## React Integration

### Translation Hook

#### useTranslation Hook

```typescript
// src/hooks/use-translation.ts
import { useState, useEffect, useCallback } from 'react';
import { i18nManager } from '@/lib/i18n';

interface UseTranslationReturn {
  t: (key: string, fallback?: string, ...args: any[]) => string;
  language: string;
  setLanguage: (language: string) => Promise<void>;
  supportedLanguages: string[];
}

export function useTranslation(): UseTranslationReturn {
  const [language, setLanguageState] = useState<string>(i18nManager.getCurrentLanguage());
  const [supportedLanguages] = useState<string[]>(i18nManager.getSupportedLanguages());

  const setLanguage = useCallback(async (newLanguage: string) => {
    try {
      await i18nManager.loadLanguage(newLanguage);
      i18nManager.setLanguage(newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  }, []);

  const t = useCallback((key: string, fallback?: string, ...args: any[]): string => {
    return i18nManager.t(key, fallback, ...args);
  }, []);

  // Load initial language
  useEffect(() => {
    const initLanguage = async () => {
      const savedLanguage = typeof window !== 'undefined' 
        ? localStorage.getItem('i18n.language') 
        : null;
      
      const browserLanguage = typeof navigator !== 'undefined' 
        ? navigator.language 
        : 'en';
      
      const targetLanguage = savedLanguage || 
        supportedLanguages.find(lang => 
          lang.startsWith(browserLanguage.split('-')[0])
        ) || 
        'en';

      try {
        await i18nManager.loadLanguage(targetLanguage);
        i18nManager.setLanguage(targetLanguage);
        setLanguageState(targetLanguage);
      } catch (error) {
        console.error('Failed to initialize language:', error);
      }
    };

    initLanguage();
  }, [supportedLanguages]);

  return {
    t,
    language,
    setLanguage,
    supportedLanguages
  };
}
```

### Server-Side Rendering

#### SSR Implementation

```typescript
// src/lib/i18n-server.ts
import { cookies } from 'next/headers';
import { i18nManager } from './i18n';

export async function getServerTranslations(language?: string) {
  // Get language from cookie or default to 'en'
  const cookieStore = cookies();
  const cookieLanguage = cookieStore.get('i18n.language')?.value;
  const targetLanguage = language || cookieLanguage || 'en';

  try {
    // Load language resources
    await i18nManager.loadLanguage(targetLanguage);
    return {
      language: targetLanguage,
      resources: i18nManager.resources.get(targetLanguage) || {}
    };
  } catch (error) {
    console.error('Failed to load server translations:', error);
    // Fallback to English
    await i18nManager.loadLanguage('en');
    return {
      language: 'en',
      resources: i18nManager.resources.get('en') || {}
    };
  }
}

export function setLanguageCookie(language: string) {
  // This would be handled in middleware or API routes
  // Set cookie with appropriate expiration
}
```

## Context Provider

### I18n Context

```tsx
// src/contexts/i18n-context.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTranslation, UseTranslationReturn } from '@/hooks/use-translation';

interface I18nContextType extends UseTranslationReturn {}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const translation = useTranslation();
  
  return (
    <I18nContext.Provider value={translation}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
```

## Component Integration

### Translatable Components

#### Example Component

```tsx
// src/components/dashboard/summary-card.tsx
import { useTranslation } from '@/hooks/use-translation';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function SummaryCard({ title, value, description }: SummaryCardProps) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {t(title, title)}
      </h3>
      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
        {value}
      </p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {t(description, description)}
        </p>
      )}
    </div>
  );
}
```

### Dynamic Content

#### Parameterized Translations

```tsx
// src/components/assets/asset-list.tsx
import { useTranslation } from '@/hooks/use-translation';

export function AssetList({ assetType, assetCount }: { assetType: string; assetCount: number }) {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t(`assets.${assetType}.title`, assetType)}</h1>
      <p>
        {t(
          'assets.list.description', 
          'Manage your {0} assets', 
          t(`assets.${assetType}.title`, assetType).toLowerCase()
        )}
      </p>
      <p>
        {t(
          'common.pagination.showing', 
          'Showing {0} to {1} of {2} items',
          1,
          Math.min(20, assetCount),
          assetCount
        )}
      </p>
    </div>
  );
}
```

## Language Management

### Adding New Languages

#### Language Addition Process

1. **Create Translation File**
   ```bash
   # Create new language file
   touch src/locales/fr.json
   ```

2. **Add Language to Configuration**
   ```typescript
   // src/lib/i18n.ts
   private supportedLanguages: string[] = ['en', 'zh-TW', 'fr'];
   ```

3. **Update Language Switcher**
   ```tsx
   // src/components/layout/language-switcher.tsx
   const languages = [
     { code: 'en', name: 'English', flag: '🇺🇸' },
     { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
     { code: 'fr', name: 'Français', flag: '🇫🇷' }
   ];
   ```

#### Translation File Structure

```json
// src/locales/fr.json
{
  "common": {
    "actions": "Actions",
    "create": "Créer",
    "edit": "Modifier",
    "delete": "Supprimer",
    "view": "Voir",
    "save": "Sauvegarder",
    "cancel": "Annuler"
  },
  "nav": {
    "dashboard": "Tableau de bord",
    "assets": "Actifs",
    "pc": "PC",
    "laptop": "Portable",
    "printer": "Imprimante"
  },
  "assets": {
    "pc": {
      "title": "PC",
      "list": {
        "title": "Liste des PC",
        "description": "Gérer vos actifs PC"
      }
    }
  }
}
```

### Language Detection

#### Automatic Detection

```typescript
// src/lib/i18n-detection.ts
export function detectUserLanguage(supportedLanguages: string[]): string {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const savedLanguage = localStorage.getItem('i18n.language');
    if (savedLanguage && supportedLanguages.includes(savedLanguage)) {
      return savedLanguage;
    }
  }

  // Check browser language
  if (typeof navigator !== 'undefined') {
    const browserLanguage = navigator.language;
    
    // Exact match
    if (supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }
    
    // Prefix match (e.g., 'en-US' matches 'en')
    const prefix = browserLanguage.split('-')[0];
    const prefixMatch = supportedLanguages.find(lang => lang.startsWith(prefix));
    if (prefixMatch) {
      return prefixMatch;
    }
  }

  // Default to English
  return 'en';
}
```

## Performance Optimization

### Lazy Loading

#### On-Demand Translation Loading

```typescript
// src/lib/i18n-lazy.ts
class LazyI18nManager extends I18nManager {
  private loadingPromises: Map<string, Promise<void>> = new Map();

  async loadLanguageIfNeeded(language: string): Promise<void> {
    // If already loaded, return immediately
    if (this.resources.has(language)) {
      return;
    }

    // If already loading, return the existing promise
    if (this.loadingPromises.has(language)) {
      return this.loadingPromises.get(language);
    }

    // Start loading and store the promise
    const loadPromise = this.loadLanguage(language);
    this.loadingPromises.set(language, loadPromise);

    try {
      await loadPromise;
    } finally {
      // Clean up the promise once loading is complete
      this.loadingPromises.delete(language);
    }
  }
}
```

### Caching Strategy

#### Translation Caching

```typescript
// src/lib/i18n-cache.ts
class CachedI18nManager extends I18nManager {
  private cache: Map<string, { value: string; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  t(key: string, fallback?: string, ...args: any[]): string {
    // Create cache key
    const cacheKey = `${this.currentLanguage}:${key}:${JSON.stringify(args)}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value;
    }

    // Generate value
    const value = super.t(key, fallback, ...args);
    
    // Cache the result
    this.cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });

    return value;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

## Middleware Integration

### Language Middleware

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Get language from cookie
  const languageCookie = request.cookies.get('i18n.language');
  
  // Get language from Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  const detectedLanguage = detectLanguageFromHeader(acceptLanguage);
  
  // Set language cookie if not present
  if (!languageCookie && detectedLanguage) {
    response.cookies.set('i18n.language', detectedLanguage, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      path: '/'
    });
  }
  
  return response;
}

function detectLanguageFromHeader(acceptLanguage?: string | null): string | null {
  if (!acceptLanguage) return null;
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, quality = 'q=1'] = lang.trim().split(';');
    const q = parseFloat(quality.split('=')[1]) || 0;
    return { code, q };
  });
  
  languages.sort((a, b) => b.q - a.q);
  
  // Map to supported languages
  const supported = ['en', 'zh-TW'];
  for (const lang of languages) {
    if (supported.includes(lang.code)) {
      return lang.code;
    }
    // Check prefix match
    const prefix = lang.code.split('-')[0];
    const match = supported.find(s => s.startsWith(prefix));
    if (match) {
      return match;
    }
  }
  
  return null;
}
```

## Testing Internationalization

### Translation Testing

#### Unit Tests

```typescript
// __tests__/lib/i18n.test.ts
import { i18nManager } from '@/lib/i18n';

describe('I18nManager', () => {
  beforeEach(async () => {
    // Load test languages
    await i18nManager.loadLanguage('en');
    await i18nManager.loadLanguage('zh-TW');
  });

  describe('t()', () => {
    it('should return translated string for existing key', () => {
      i18nManager.setLanguage('en');
      expect(i18nManager.t('common.actions')).toBe('Actions');
    });

    it('should return fallback for non-existing key', () => {
      i18nManager.setLanguage('en');
      expect(i18nManager.t('non.existing.key', 'Fallback')).toBe('Fallback');
    });

    it('should handle parameterized translations', () => {
      i18nManager.setLanguage('en');
      expect(i18nManager.t('common.pagination.showing', 'Showing {0} to {1} of {2} items', 1, 20, 100))
        .toBe('Showing 1 to 20 of 100 items');
    });
  });

  describe('language switching', () => {
    it('should switch languages correctly', async () => {
      i18nManager.setLanguage('en');
      expect(i18nManager.t('common.actions')).toBe('Actions');
      
      i18nManager.setLanguage('zh-TW');
      expect(i18nManager.t('common.actions')).toBe('操作');
    });
  });
});
```

### Component Testing

#### React Component Tests

```tsx
// __tests__/components/summary-card.test.tsx
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/contexts/i18n-context';
import { SummaryCard } from '@/components/dashboard/summary-card';

// Mock i18n
jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    language: 'en',
    setLanguage: jest.fn(),
    supportedLanguages: ['en', 'zh-TW']
  })
}));

describe('SummaryCard', () => {
  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nProvider>{component}</I18nProvider>);
  };

  it('renders title and value correctly', () => {
    renderWithI18n(
      <SummaryCard 
        title="Test Title" 
        value="100" 
        description="Test Description" 
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
});
```

## Best Practices

### Translation Management

#### Consistent Key Naming

1. **Hierarchical Structure**
   ```json
   {
     "module": {
       "component": {
         "element": "translation"
       }
     }
   }
   ```

2. **Descriptive Keys**
   ```json
   {
     "assets": {
       "pc": {
         "list": {
           "title": "PC List",
           "emptyState": "No PCs found",
           "actions": {
             "create": "Create PC",
             "import": "Import PCs"
           }
         }
       }
     }
   }
   ```

#### Reusable Translations

1. **Common Translations**
   ```json
   {
     "common": {
       "actions": {
         "create": "Create",
         "edit": "Edit",
         "delete": "Delete",
         "save": "Save",
         "cancel": "Cancel"
       },
       "status": {
         "active": "Active",
         "inactive": "Inactive",
         "pending": "Pending"
       }
     }
   }
   ```

2. **Component Reuse**
   ```tsx
   // Reuse common translations
   <button onClick={handleSave}>
     {t('common.actions.save', 'Save')}
   </button>
   ```

### Performance Considerations

#### Efficient Loading

1. **Lazy Loading**
   - Load translations on-demand
   - Preload frequently used languages
   - Cache loaded translations

2. **Bundle Optimization**
   - Code-split translation files
   - Compress translation JSON
   - Remove unused translations

#### Memory Management

1. **Cache Management**
   - Implement cache expiration
   - Monitor cache size
   - Clean up unused translations

2. **Resource Cleanup**
   - Unload unused languages
   - Free memory when possible
   - Monitor memory usage

## Troubleshooting

### Common Issues

#### Missing Translations

1. **Debug Missing Keys**
   ```typescript
   // Enable debug mode
   const debugI18nManager = new I18nManager(true); // debug = true
   
   // Log missing keys
   i18nManager.t('missing.key'); // Will log warning
   ```

2. **Translation Validation**
   ```bash
   # Script to validate translations
   node scripts/validate-translations.js
   ```

#### Language Loading Failures

1. **Network Issues**
   ```typescript
   // Implement retry logic
   async function loadLanguageWithRetry(language: string, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         await i18nManager.loadLanguage(language);
         return;
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   }
   ```

### Debugging Tools

#### Translation Debugging

```typescript
// src/lib/i18n-debug.ts
class DebugI18nManager extends I18nManager {
  private debugMode: boolean = false;
  private missingKeys: Set<string> = new Set();

  constructor(debug: boolean = false) {
    super();
    this.debugMode = debug;
  }

  t(key: string, fallback?: string, ...args: any[]): string {
    const result = super.t(key, fallback, ...args);
    
    if (this.debugMode && result === (fallback || key)) {
      if (!this.missingKeys.has(key)) {
        console.warn('Missing translation key:', key);
        this.missingKeys.add(key);
      }
    }
    
    return result;
  }

  getMissingKeys(): string[] {
    return Array.from(this.missingKeys);
  }

  clearMissingKeys(): void {
    this.missingKeys.clear();
  }
}
```

## Future Enhancements

### Planned Features

#### Right-to-Left Support

```typescript
// src/lib/i18n-rtl.ts
interface LanguageDirection {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

const languageDirections: LanguageDirection[] = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'zh-TW', name: '繁體中文', direction: 'ltr' },
  { code: 'ar', name: 'العربية', direction: 'rtl' } // Arabic example
];

export function getLanguageDirection(language: string): 'ltr' | 'rtl' {
  const lang = languageDirections.find(l => l.code === language);
  return lang ? lang.direction : 'ltr';
}
```

#### Pluralization Support

```typescript
// src/lib/i18n-plural.ts
export function tPlural(
  key: string, 
  count: number, 
  fallback?: string
): string {
  // Implementation for pluralization
  const pluralKey = `${key}_${count === 1 ? 'one' : 'other'}`;
  return i18nManager.t(pluralKey, fallback);
}
```

## Conclusion

The internationalization implementation in ITAMS provides a robust, scalable solution for supporting multiple languages and locales. By following the patterns, best practices, and optimization strategies outlined in this guide, organizations can ensure their users have access to the system in their preferred language while maintaining optimal performance and user experience.

Regular updates to translation files, proper testing of internationalization features, and monitoring of user language preferences will help maintain a high-quality multilingual experience as the system grows and evolves. The flexible architecture allows for easy addition of new languages and features while maintaining backward compatibility and performance.