# Architecture Overview

## System Architecture

The IT Asset Management System (ITAMS) follows a modern, scalable architecture designed for performance and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │   Browser   │  │   Mobile     │  │   Desktop Apps     │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │   Next.js   │  │  API Routes  │  │  React Components  │ │
│  │  (Frontend) │  │  (Backend)   │  │     (UI Layer)     │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                       Service Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │   Prisma    │  │   Utility    │  │     Business       │ │
│  │     ORM     │  │   Helpers    │  │    Logic           │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Data & Cache Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ PostgreSQL  │  │    Redis     │  │   File Storage     │ │
│  │     17      │  │   Cache      │  │   (Templates)      │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 15** (App Router) - React framework with SSR/CSR capabilities
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable component library built on Radix UI
- **React Query** - Server state management with automatic caching
- **Recharts** - Declarative charting library for data visualization
- **Zod** - Schema validation for form and API data

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database toolkit and ORM
- **PostgreSQL 17** - Relational database with full-text search
- **Redis** - Caching layer for improved performance
- **JSON Web Tokens (JWT)** - Secure authentication

### Development & Deployment
- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager
- **Docker** - Containerization support
- **PM2** - Process manager for production deployment
- **Nginx** - Reverse proxy and load balancing (optional)

## Core Components

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

## Design Patterns

### Generic Base Class Pattern
The project extensively uses generic base classes to provide common functionality that can be specialized for specific use cases.

**Example**: `BaseAssetApiHandler<T>`
- Provides CRUD operations for any asset type
- Uses TypeScript generics for type safety
- Allows asset-specific configuration through the `AssetOperations` interface

### Strategy Pattern
Different asset types implement the same interface but with different configurations.

### Wrapper/Adapter Pattern
The `ApiRouteHandler` wraps the specialized asset handlers to provide a consistent API interface.

### Factory Pattern
Handlers are created with specific configurations, acting as factories for asset-specific operations.

## Multi-Tenancy

The system implements multi-tenancy with complete data isolation:
- Each tenant has its own data space
- Tenant ID is included in all database queries
- Custom fields are tenant-specific
- Permissions are tenant-aware

## Security Architecture

The security architecture implements multiple layers of protection:
- JWT-based authentication with token blacklisting
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting to prevent abuse
- SQL injection prevention
- XSS prevention
- Secure password storage with bcrypt