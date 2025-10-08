# Project Structure Analysis

## Overview
This document provides a comprehensive analysis of the IT Asset Management System (ITAMS) project structure, code organization, and key architectural patterns.

## Project Structure

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
└── ...                        # Configuration files
```

## Core Architecture

### 1. API Layer
The API follows a modular structure with separate routes for each asset type:
- PC, Laptop, Printer, License, Warehouse, Internet assets
- Each asset type has its own directory with CRUD operations
- Standardized response format using success/error responses

### 2. Business Logic Layer
- **BaseAssetApiHandler**: Generic handler implementing CRUD operations for all asset types
- **ApiRouteHandler**: Standardized wrapper for API routes with consistent error handling
- **Specialized handlers**: Individual handlers for each asset type (pc-handler.ts, laptop-handler.ts, etc.)

### 3. Data Access Layer
- Uses Prisma ORM for database operations
- Implements caching with Redis for performance optimization
- Follows tenant-based data isolation

### 4. Authentication & Authorization
- JWT-based authentication system
- Role-based access control (RBAC)
- Permission checking at the route level
- Rate limiting for security

### 5. Excel Import/Export
- Template-based Excel operations
- Separate modules for import and export functionality
- Asset-specific handling for different data structures

## Key Components

### Authentication System (`src/lib/auth.ts`)
- JWT token generation and verification
- Password hashing with bcrypt
- Rate limiting to prevent brute force attacks
- User caching for performance

### Permissions System (`src/lib/permissions.ts`)
- Role-based permission management
- Resource-action permission model
- Default permissions for admin and user roles
- Caching for improved performance

### Asset Management (`src/lib/asset-api/`)
- **BaseAssetApiHandler**: Core CRUD operations with:
  - Permission checking
  - Data validation
  - Cache invalidation
  - Audit logging
- **Specialized handlers**: Asset-type specific configurations

### Excel Operations (`src/lib/excel/`)
- **excel-export.ts**: Template-based export for all asset types
- **excel-import.ts**: Data import with validation and transformation

### API Utilities (`src/lib/api-route-handler.ts`)
- Standardized API route handling
- Consistent error responses
- Request parsing and validation

## Type Safety
The project follows strict TypeScript practices with:
- Dedicated type definition files in `src/types/`
- Interface definitions for all asset types
- Strict null checks and type validation
- Generic types for reusable components

## Caching Strategy
- Redis-based caching for performance
- Selective cache invalidation
- Composite keys for cache entries
- TTL-based expiration

## Error Handling
- Centralized error handling in API route handler
- Custom error types for different scenarios
- Structured logging with context
- Graceful degradation for cache failures

## Security Features
- Input validation and sanitization
- SQL injection prevention
- Rate limiting
- Token blacklisting
- Permission-based access control

## Performance Optimizations
- Database query optimization with selective field selection
- Caching strategies
- Batch processing for bulk operations
- Connection pooling