# Codebase Overview

## Project Summary
The IT Asset Management System (ITAMS) is a comprehensive web application built with Next.js, TypeScript, and Prisma ORM. It provides functionality for managing various types of IT assets including PCs, Laptops, Printers, Licenses, Warehouse items, and Internet connections.

## Technology Stack
- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt.js
- **Caching**: Redis
- **Excel Processing**: xlsx-populate
- **UI Components**: Radix UI, Tailwind CSS
- **State Management**: React Query
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **Testing**: Jest, Testing Library

## Core Features

### 1. Asset Management
- CRUD operations for 6 asset types (PC, Laptop, Printer, License, Warehouse, Internet)
- Bulk operations (bulk delete)
- Search and filtering capabilities
- Custom fields support
- Status tracking

### 2. User Management
- Role-based access control
- Multi-tenancy support
- Authentication and authorization
- User profiles and settings

### 3. Data Import/Export
- Excel template-based import/export
- Asset-specific templates
- Data validation during import
- Batch processing capabilities

### 4. Reporting and Analytics
- Dashboard with summary statistics
- Asset status reports
- Department-wise asset distribution
- Historical data tracking

### 5. Audit and Compliance
- Audit logging for all operations
- Change tracking
- Permission-based access control
- Data integrity checks

## Architecture Overview

### Directory Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── assets/            # Asset management pages
│   ├── auth/              # Authentication pages
│   └── ...                # Other pages
├── components/            # React UI components
├── lib/                   # Business logic and utilities
├── types/                 # TypeScript interfaces and types
└── templates/             # Excel templates
```

### Key Architectural Components

#### 1. API Layer
- RESTful API endpoints organized by resource
- Standardized response format
- Consistent error handling
- Authentication middleware

#### 2. Business Logic Layer
- Generic `BaseAssetApiHandler` for common CRUD operations
- Specialized handlers for each asset type
- Permission checking and validation
- Cache management

#### 3. Data Access Layer
- Prisma ORM for database operations
- Tenant-aware queries
- Connection pooling
- Query optimization

#### 4. Utility Layer
- Authentication services
- Permission management
- Caching utilities
- Excel processing
- Logging services

## Modularization Strategy

### Asset-Specific Modules
Each asset type has its own:
- Handler implementing business logic
- API routes for CRUD operations
- Type definitions
- Excel import/export configurations

### Shared Components
- Generic base classes for reuse
- Utility functions for common operations
- Standardized error handling
- Consistent response formatting

### Type Safety
- Strict TypeScript configuration
- Dedicated interface files
- Generic types for flexibility
- Comprehensive type checking

## Security Features

### Authentication
- JWT-based token authentication
- Password hashing with bcrypt
- Token expiration and refresh
- Blacklisting for security

### Authorization
- Role-based access control
- Resource-action permission model
- Tenant isolation
- Permission caching

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- Rate limiting
- Audit logging

## Performance Optimizations

### Database
- Query optimization with selective field selection
- Connection pooling
- Indexing strategies
- Batch operations

### Caching
- Redis-based caching
- Selective cache invalidation
- TTL-based expiration
- Composite cache keys

### Frontend
- React Query for data fetching
- Component-level caching
- Lazy loading
- Code splitting

## Development Practices

### Code Quality
- Strict TypeScript configuration
- ESLint for code linting
- Prettier for code formatting
- Comprehensive type checking

### Testing
- Unit tests with Jest
- Integration tests for API endpoints
- Component tests with Testing Library
- Test coverage monitoring

### Documentation
- JSDoc comments for functions
- Type definitions for interfaces
- README files for modules
- API documentation

## Deployment Considerations

### Environment Configuration
- Environment-specific configuration
- Secure secret management
- Database connection pooling
- Cache configuration

### Scaling
- Horizontal scaling support
- Load balancing compatibility
- Database read replicas
- CDN integration

### Monitoring
- Structured logging
- Error tracking
- Performance monitoring
- Health checks

## Maintenance and Extensibility

### Adding New Asset Types
1. Create type interface in `types/asset-interfaces.ts`
2. Create specialized handler in `lib/asset-api/`
3. Create API routes in `app/api/assets/`
4. Add Excel templates and handlers

### Extending Functionality
1. Add methods to `BaseAssetApiHandler` for common functionality
2. Update specialized handlers as needed
3. Add new API endpoints
4. Update frontend components

## Conclusion

The IT Asset Management System demonstrates a well-architected, maintainable codebase that follows modern web development best practices. The modular design, strict type safety, comprehensive error handling, and performance optimizations make it a robust foundation for an enterprise application. The clear separation of concerns and consistent patterns throughout the codebase facilitate both maintenance and future enhancements.