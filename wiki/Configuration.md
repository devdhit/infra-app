# Configuration Guide

This document provides comprehensive guidance on configuring the IT Asset Management System (ITAMS) for different environments and use cases.

## Configuration Overview

ITAMS uses environment variables for configuration, allowing flexible deployment across different environments. Configuration values can be set through:

1. **Environment Files**: `.env`, `.env.local`, `.env.production`, etc.
2. **System Environment Variables**: OS-level environment variables
3. **Runtime Configuration**: Dynamic configuration during application startup

## Environment Variables

### Core Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode (development, production, test) | `development` | Yes |
| `PORT` | HTTP server port | `3001` | Yes |
| `HOST` | Server host | `localhost` | No |
| `NEXT_PUBLIC_APP_URL` | Public application URL | `http://localhost:3001` | Yes |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `DATABASE_POOL_MIN` | Minimum database connections | `2` | No |
| `DATABASE_POOL_MAX` | Maximum database connections | `10` | No |

### Authentication Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT token signing | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` | No |
| `PASSWORD_MIN_LENGTH` | Minimum password length | `12` | No |
| `MAX_LOGIN_ATTEMPTS` | Maximum login attempts before lockout | `5` | No |
| `LOCKOUT_DURATION` | Account lockout duration (minutes) | `1440` (24 hours) | No |

### Redis Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection string | - | Yes |
| `REDIS_PREFIX` | Key prefix for Redis cache | `itams:` | No |
| `REDIS_TTL_DEFAULT` | Default cache TTL (seconds) | `300` | No |

### Performance Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ENABLE_CACHE` | Enable/disable caching | `true` | No |
| `CACHE_TTL_ASSETS` | Cache TTL for assets (seconds) | `300` | No |
| `CACHE_TTL_ASSET_LIST` | Cache TTL for asset lists (seconds) | `120` | No |
| `CACHE_TTL_PERMISSIONS` | Cache TTL for permissions (seconds) | `300` | No |
| `CACHE_TTL_CUSTOM_FIELDS` | Cache TTL for custom fields (seconds) | `600` | No |
| `CACHE_TTL_SEARCH` | Cache TTL for search results (seconds) | `60` | No |

### Logging Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` | No |
| `LOG_FORMAT` | Log format (json, simple) | `simple` | No |
| `LOG_FILE` | Log file path | - | No |

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window (milliseconds) | `900000` (15 minutes) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests per window | `100` | No |
| `ENABLE_SECURITY_HEADERS` | Enable security headers | `true` | No |
| `CONTENT_SECURITY_POLICY` | Custom CSP directives | - | No |

### Excel Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MAX_EXPORT_RECORDS` | Maximum records for Excel export | `10000` | No |
| `EXCEL_TEMPLATE_DIR` | Directory for Excel templates | `./templates` | No |

## Environment-Specific Configuration

### Development Environment

Create `.env.development`:
```env
NODE_ENV=development
PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://postgres:Abcd_2025@localhost:5432/infrasys_db?schema=public

# Authentication
JWT_SECRET=development-jwt-secret-change-in-production
PASSWORD_MIN_LENGTH=8

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=itams:dev:

# Performance
ENABLE_CACHE=true
LOG_LEVEL=debug
LOG_FORMAT=simple

# Security
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000
```

### Production Environment

Create `.env.production`:
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://itams_user:secure_password@localhost:5432/itams_db?schema=public
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-here-change-in-production
JWT_EXPIRES_IN=24h
PASSWORD_MIN_LENGTH=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1440

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=itams:
REDIS_TTL_DEFAULT=300

# Performance
ENABLE_CACHE=true
CACHE_TTL_ASSETS=300
CACHE_TTL_ASSET_LIST=120
CACHE_TTL_PERMISSIONS=300
CACHE_TTL_CUSTOM_FIELDS=600
CACHE_TTL_SEARCH=60
MAX_EXPORT_RECORDS=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_SECURITY_HEADERS=true
```

### Testing Environment

Create `.env.test`:
```env
NODE_ENV=test
PORT=3002
NEXT_PUBLIC_APP_URL=http://localhost:3002

# Database
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/itams_test?schema=public

# Authentication
JWT_SECRET=test-jwt-secret
PASSWORD_MIN_LENGTH=6

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=itams:test:

# Performance
ENABLE_CACHE=false
LOG_LEVEL=error

# Security
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=10000
```

## Configuration Files

### Next.js Configuration

`next.config.ts`:
```typescript
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // React strict mode
  reactStrictMode: true,
  
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'your-domain.com'],
  },
  
  // Webpack configuration
  webpack: (config) => {
    // Add custom webpack configuration
    return config;
  },
  
  // Internationalization
  i18n: {
    locales: ['en', 'zh-TW'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
```

### TypeScript Configuration

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### ESLint Configuration

`eslint.config.mjs`:
```javascript
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',
    },
  },
];
```

### Prisma Configuration

`prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models and schema definitions
// ... (existing schema)
```

## Runtime Configuration

### Configuration Service

Create a configuration service to manage runtime configuration:

```typescript
// src/lib/config.ts
export interface AppConfig {
  // Core
  nodeEnv: string;
  port: number;
  host: string;
  appUrl: string;
  
  // Database
  databaseUrl: string;
  databasePoolMin: number;
  databasePoolMax: number;
  
  // Authentication
  jwtSecret: string;
  jwtExpiresIn: string;
  passwordMinLength: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Redis
  redisUrl: string;
  redisPrefix: string;
  redisTtlDefault: number;
  
  // Performance
  enableCache: boolean;
  cacheTtlAssets: number;
  cacheTtlAssetList: number;
  cacheTtlPermissions: number;
  cacheTtlCustomFields: number;
  cacheTtlSearch: number;
  maxExportRecords: number;
  
  // Logging
  logLevel: string;
  logFormat: string;
  logFile?: string;
  
  // Security
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableSecurityHeaders: boolean;
  contentSecurityPolicy?: string;
}

export function getConfig(): AppConfig {
  return {
    // Core
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || 'localhost',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
    
    // Database
    databaseUrl: process.env.DATABASE_URL || '',
    databasePoolMin: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
    databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
    
    // Authentication
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1440', 10),
    
    // Redis
    redisUrl: process.env.REDIS_URL || '',
    redisPrefix: process.env.REDIS_PREFIX || 'itams:',
    redisTtlDefault: parseInt(process.env.REDIS_TTL_DEFAULT || '300', 10),
    
    // Performance
    enableCache: process.env.ENABLE_CACHE === 'true',
    cacheTtlAssets: parseInt(process.env.CACHE_TTL_ASSETS || '300', 10),
    cacheTtlAssetList: parseInt(process.env.CACHE_TTL_ASSET_LIST || '120', 10),
    cacheTtlPermissions: parseInt(process.env.CACHE_TTL_PERMISSIONS || '300', 10),
    cacheTtlCustomFields: parseInt(process.env.CACHE_TTL_CUSTOM_FIELDS || '600', 10),
    cacheTtlSearch: parseInt(process.env.CACHE_TTL_SEARCH || '60', 10),
    maxExportRecords: parseInt(process.env.MAX_EXPORT_RECORDS || '10000', 10),
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'simple',
    logFile: process.env.LOG_FILE,
    
    // Security
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS === 'true',
    contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY,
  };
}

// Validate required configuration
export function validateConfig(config: AppConfig): void {
  const required = [
    'databaseUrl',
    'jwtSecret',
    'redisUrl'
  ];
  
  const missing = required.filter(key => !config[key as keyof AppConfig]);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  // Validate numeric values
  if (config.port < 1 || config.port > 65535) {
    throw new Error('Invalid PORT value');
  }
  
  if (config.passwordMinLength < 6) {
    throw new Error('PASSWORD_MIN_LENGTH must be at least 6');
  }
}
```

### Configuration Validation

Create a startup validation script:

```typescript
// src/lib/validate-config.ts
import { getConfig, validateConfig } from './config';

export function validateStartupConfig(): void {
  try {
    const config = getConfig();
    validateConfig(config);
    
    console.log('Configuration validation passed');
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}
```

## Multi-Tenant Configuration

### Tenant-Specific Settings

ITAMS supports tenant-specific configuration through the database:

```typescript
// src/lib/tenant-config.ts
import { db } from './db';

export interface TenantConfig {
  id: string;
  tenantId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getTenantConfig(tenantId: string, key: string): Promise<string | null> {
  const config = await db.tenantConfig.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key
      }
    }
  });
  
  return config?.value || null;
}

export async function setTenantConfig(
  tenantId: string, 
  key: string, 
  value: string
): Promise<void> {
  await db.tenantConfig.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key
      }
    },
    update: {
      value
    },
    create: {
      tenantId,
      key,
      value
    }
  });
}
```

### Feature Flags

Implement feature flags for gradual rollouts:

```typescript
// src/lib/feature-flags.ts
import { getTenantConfig } from './tenant-config';

export interface FeatureFlags {
  enableNewDashboard: boolean;
  enableAdvancedSearch: boolean;
  enableCustomReports: boolean;
}

export async function getFeatureFlags(tenantId: string): Promise<FeatureFlags> {
  return {
    enableNewDashboard: (await getTenantConfig(tenantId, 'feature.newDashboard')) === 'true',
    enableAdvancedSearch: (await getTenantConfig(tenantId, 'feature.advancedSearch')) === 'true',
    enableCustomReports: (await getTenantConfig(tenantId, 'feature.customReports')) === 'true',
  };
}
```

## Internationalization Configuration

### Language Settings

Configure supported languages and default settings:

```typescript
// src/lib/i18n-config.ts
export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' }
];

export const defaultLanguage = 'en';

export const languageConfig = {
  en: {
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm',
    currency: 'USD',
    timezone: 'America/New_York'
  },
  'zh-TW': {
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currency: 'TWD',
    timezone: 'Asia/Taipei'
  }
};
```

## Security Configuration

### CORS Settings

Configure CORS for API security:

```typescript
// src/lib/cors-config.ts
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};
```

### Rate Limiting

Configure rate limiting for different endpoints:

```typescript
// src/lib/rate-limit-config.ts
export const rateLimitConfig = {
  // Global rate limiting
  global: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 900000, // 15 minutes
    max: 5 // 5 attempts
  },
  
  // API endpoints
  api: {
    windowMs: 60000, // 1 minute
    max: 100 // 100 requests
  }
};
```

## Performance Configuration

### Cache Settings

Configure caching strategies:

```typescript
// src/lib/cache-config.ts
export const cacheConfig = {
  ttl: {
    assets: parseInt(process.env.CACHE_TTL_ASSETS || '300', 10),
    assetList: parseInt(process.env.CACHE_TTL_ASSET_LIST || '120', 10),
    permissions: parseInt(process.env.CACHE_TTL_PERMISSIONS || '300', 10),
    customFields: parseInt(process.env.CACHE_TTL_CUSTOM_FIELDS || '600', 10),
    search: parseInt(process.env.CACHE_TTL_SEARCH || '60', 10)
  },
  
  prefixes: {
    assets: 'asset:',
    assetList: 'asset_list:',
    permissions: 'permissions:',
    customFields: 'custom_fields:',
    search: 'search:'
  }
};
```

## Monitoring Configuration

### Logging Configuration

Configure structured logging:

```typescript
// src/lib/logging-config.ts
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'simple',
  file: process.env.LOG_FILE,
  
  // Structured logging fields
  fields: {
    timestamp: true,
    level: true,
    component: true,
    tenantId: true,
    userId: true
  }
};
```

## Configuration Management Best Practices

### 1. Environment Segregation

- Keep environment-specific configurations separate
- Use different configuration files for each environment
- Never commit sensitive configuration to version control

### 2. Validation

- Validate configuration at startup
- Check for required values
- Validate data types and ranges

### 3. Documentation

- Document all configuration options
- Provide default values and descriptions
- Include examples for complex configurations

### 4. Security

- Use environment variables for sensitive data
- Rotate secrets regularly
- Implement proper access controls

### 5. Monitoring

- Log configuration changes
- Monitor for invalid configurations
- Alert on configuration issues

## Troubleshooting Configuration Issues

### Common Issues

#### 1. Missing Environment Variables
```bash
# Check environment variables
printenv | grep ITAMS

# Verify .env file
cat .env.production
```

#### 2. Invalid Configuration Values
```bash
# Check configuration validation
npm run validate-config
```

#### 3. Database Connection Issues
```bash
# Test database connection
npx prisma migrate status
```

#### 4. Redis Connection Issues
```bash
# Test Redis connection
npm run test:redis-connection
```

### Configuration Debugging

Create a configuration debugging tool:

```typescript
// src/lib/debug-config.ts
import { getConfig } from './config';

export function debugConfig(): void {
  const config = getConfig();
  
  console.log('=== ITAMS Configuration Debug ===');
  console.log('Environment:', config.nodeEnv);
  console.log('Port:', config.port);
  console.log('Database URL:', config.databaseUrl ? 'SET' : 'MISSING');
  console.log('JWT Secret:', config.jwtSecret ? 'SET' : 'MISSING');
  console.log('Redis URL:', config.redisUrl ? 'SET' : 'MISSING');
  console.log('Cache Enabled:', config.enableCache);
  console.log('===============================');
}
```

## Conclusion

Proper configuration is essential for the successful deployment and operation of ITAMS. By following these guidelines and best practices, you can ensure your system is properly configured for your specific environment and requirements.

Regular review and updates of configuration settings help maintain optimal performance, security, and functionality as your system evolves and grows.