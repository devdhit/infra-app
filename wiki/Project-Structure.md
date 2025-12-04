# Project Structure

## Directory Layout

```
infra-app/
├── __tests__/                 # Test files
├── agentex/                   # Agent-related functionality
├── docs/                      # Documentation files
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
├── scripts/                   # Utility scripts
├── src/                       # Source code
│   ├── app/                   # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── assets/            # Asset management pages
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   └── ...                # Other page directories
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries and services
│   ├── types/                 # TypeScript type definitions
│   └── ...                    # Other configuration files
├── templates/                 # Excel templates
├── wiki/                      # GitHub wiki documentation
└── ...                        # Configuration files
```

## Source Code Structure

### `src/app/` - Next.js App Directory

The app directory follows Next.js 15 App Router conventions:

```
src/app/
├── api/                       # API routes
│   ├── assets/                # Asset management APIs
│   │   ├── pc/
│   │   ├── laptop/
│   │   ├── printer/
│   │   ├── license/
│   │   ├── warehouse/
│   │   └── internet/
│   ├── auth/                  # Authentication APIs
│   ├── custom-fields/         # Custom fields APIs
│   ├── dashboard/             # Dashboard APIs
│   ├── tenants/               # Tenant management APIs
│   ├── users/                 # User management APIs
│   └── ...                    # Other API routes
├── assets/                    # Asset management pages
│   ├── pc/
│   ├── laptop/
│   ├── printer/
│   ├── license/
│   ├── warehouse/
│   └── internet/
├── auth/                      # Authentication pages
├── dashboard/                 # Dashboard pages
├── settings/                  # Settings pages
└── ...                        # Other page directories
```

### `src/components/` - React Components

```
src/components/
├── assets/                    # Asset-related components
├── dashboard/                 # Dashboard components
├── layout/                    # Layout components
├── providers/                 # React context providers
├── settings/                  # Settings components
├── ui/                        # Reusable UI components
└── ...                        # Other component directories
```

### `src/lib/` - Utility Libraries and Services

```
src/lib/
├── api/                       # API utility functions
├── asset-api/                 # Asset API handlers
├── excel/                     # Excel import/export functionality
├── api-route-handler.ts       # API route handler wrapper
├── api-utils.ts               # API utility functions
├── auth.ts                    # Authentication services
├── cache-manager.ts           # Cache management utilities
├── custom-fields.ts           # Custom fields utilities
├── db.ts                      # Database connection
├── excel.ts                   # Excel processing utilities
├── history.ts                 # History tracking utilities
├── logger.ts                  # Logging utilities
├── middleware.ts              # Application middleware
├── permissions.ts             # Permission checking utilities
├── redis-cache.ts             # Redis cache implementation
├── security.ts                # Security utilities
├── sql-injection-middleware.ts # SQL injection protection
├── utils.ts                   # General utility functions
└── ...                        # Other utility files
```

### `src/types/` - TypeScript Type Definitions

```
src/types/
├── api-responses.ts           # API response types
├── asset-interfaces.ts        # Asset interface definitions
├── assets.ts                  # Asset type definitions
├── auth.ts                    # Authentication types
├── custom-fields.ts           # Custom fields types
├── dashboard.ts               # Dashboard types
├── errors.ts                  # Error type definitions
├── permissions.ts             # Permission types
├── roles.ts                   # Role types
├── users.ts                   # User types
└── ...                        # Other type definition files
```

## Key Files

### Configuration Files

- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables
- `ecosystem.config.js` - PM2 configuration
- `Dockerfile` - Docker configuration

### Documentation Files

- `README.md` - Main project documentation
- `docs/` - Detailed technical documentation
- `wiki/` - GitHub wiki documentation

### Script Files

- `scripts/` - Utility scripts for deployment, testing, etc.
- `prisma/migrations/` - Database migration files
- `prisma/seed.ts` - Database seeding script

## Module Organization

### Asset Management Modules

Each asset type follows a consistent structure:

```
src/lib/asset-api/
├── base-asset-handler.ts      # Generic base handler
├── pc-handler.ts              # PC asset handler
├── laptop-handler.ts          # Laptop asset handler
├── printer-handler.ts         # Printer asset handler
├── license-handler.ts         # License asset handler
├── warehouse-handler.ts       # Warehouse asset handler
└── internet-handler.ts        # Internet asset handler
```

Each handler extends the base handler with asset-specific configurations.

### API Route Modules

API routes are organized by resource:

```
src/app/api/assets/
├── pc/
│   ├── route.ts               # PC API routes
│   └── ...                    # Other PC-related routes
├── laptop/
│   ├── route.ts               # Laptop API routes
│   └── ...                    # Other laptop-related routes
└── ...                        # Other asset type routes
```

### Component Modules

UI components are organized by feature:

```
src/components/assets/
├── asset-detail-dialog.tsx    # Asset detail view
├── asset-dialog.tsx           # Asset creation/editing dialog
├── asset-form.tsx             # Asset form component
├── asset-list.tsx             # Asset list component
├── excel-export-dialog.tsx    # Excel export dialog
├── excel-import-dialog.tsx    # Excel import dialog
└── ...                        # Other asset components
```

## Naming Conventions

### Files
- Use kebab-case for file names (e.g., `asset-list.tsx`)
- Use `.ts` extension for TypeScript files
- Use `.tsx` extension for React components
- Use descriptive names that indicate purpose

### Components
- Use PascalCase for component names (e.g., `AssetList`)
- Use functional components with hooks
- Memoize components when appropriate for performance

### Functions
- Use camelCase for function names (e.g., `getAssetById`)
- Use descriptive names that indicate purpose
- Use verb prefixes for action functions (e.g., `createAsset`, `updateAsset`)

### Variables
- Use camelCase for variable names (e.g., `assetData`)
- Use descriptive names that indicate purpose
- Use boolean variables with is/has/can prefixes (e.g., `isLoading`, `hasPermission`)

### Types and Interfaces
- Use PascalCase for type and interface names (e.g., `Asset`, `AssetResponse`)
- Use `I` prefix for interfaces when needed for clarity (e.g., `IAsset`)
- Define types in separate files when shared across modules

## Modularity Principles

### Separation of Concerns
- API routes handle HTTP concerns
- Business logic is in handler classes
- Data access is through Prisma ORM
- Utilities are in separate modules
- Types are in dedicated files

### Reusability
- Generic base classes for common functionality
- Shared utility functions
- Common component patterns
- Standardized error handling

### Maintainability
- Clear directory structure
- Consistent naming conventions
- Modular file organization
- Comprehensive type definitions