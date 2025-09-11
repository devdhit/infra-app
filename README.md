# IT Asset Management System (ITAMS)

A comprehensive IT asset management solution built with modern web technologies.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Excel Export Functionality](#excel-export-functionality)
- [Role-Based Access Control](#role-based-access-control)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

The IT Asset Management System (ITAMS) is a comprehensive solution for organizations to track, manage, and optimize their IT assets. The system provides multi-tenant support, allowing different organizations to use the same instance while maintaining data isolation.

## Features

### Core Modules

1. **User & Tenant Management**
   - Multi-tenant architecture
   - Role-based access control (RBAC)
   - User authentication and authorization

2. **IT Asset Management**
   - PC Assets: Track desktop computers with detailed specifications
   - Laptop Assets: Manage portable devices with warranty information
   - Printer Assets: Monitor printers and multifunction devices
   - License Assets: Track software licenses and compliance
   - Warehouse IT: Manage inventory in storage

3. **Excel Import/Export**
   - Template-based data import for all asset types
   - Bulk export functionality with department filtering
   - Data validation during import

4. **Custom Fields**
   - Tenant-specific custom fields
   - Support for various data types (text, number, date, boolean, select)
   - JSON storage for flexibility
   - Inline editing in asset lists
   - Automatic integration in asset forms
   - Required field validation
   - CRUD management interface

5. **Dashboard & Statistics**
   - Real-time asset overview
   - Status distribution charts
   - Asset growth trends

6. **History/Logs**
   - Complete audit trail
   - Change tracking for all assets
   - User activity monitoring

### Technical Features

- Full internationalization support (English & Traditional Chinese)
- Responsive design for all device sizes
- Server-side rendering (SSR) and client-side rendering (CSR)
- API-based architecture with RESTful endpoints
- Comprehensive error handling and validation
- Performance optimization techniques

## Tech Stack

### Frontend
- **Next.js 15** (App Router) - React framework with SSR/CSR capabilities
- **TypeScript** - Type-safe JavaScript development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable component library
- **React Query** - Server state management
- **Zod** - Schema validation

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit and ORM
- **PostgreSQL 17** - Relational database
- **Axios** - HTTP client

### Development & Deployment
- **Node.js** - JavaScript runtime
- **npm** - Package manager
- **Docker** - Containerization (optional)
- **Vercel** - Deployment platform (recommended)

## Architecture

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
│                       Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL 17                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 17 installed
- npm or yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd itams
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:Abcd_2025@localhost:5432/infrasys_db?schema=public"
   JWT_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## Database Schema

The database schema is designed with multi-tenancy in mind, featuring the following main entities:

- **Tenant** - Organization/container for all data
- **User** - System users with role-based access
- **PC** - Desktop computer assets
- **Laptop** - Portable computer assets
- **Printer** - Printing device assets
- **License** - Software license assets
- **WarehouseIT** - Storage inventory assets
- **CustomField** - Tenant-specific custom fields
- **History** - Audit trail for all changes

For detailed schema information, refer to `prisma/schema.prisma`.

## API Documentation

All API endpoints are RESTful and follow standard conventions:

### Authentication
- `POST /api/auth/login` - User login
- `DELETE /api/auth/logout` - User logout

### Tenants
- `GET /api/tenants` - List all tenants (admin only)
- `POST /api/tenants` - Create a new tenant (admin only)
- `GET /api/tenants/:id` - Get a specific tenant
- `PUT /api/tenants/:id` - Update a tenant (admin only)
- `DELETE /api/tenants/:id` - Delete a tenant (admin only)

### Users
- `GET /api/users` - List users

## Excel Export Functionality

The ITAMS provides comprehensive Excel export capabilities for all asset types:

### Individual Asset Type Export
- Export any single asset type (PC, Laptop, Printer, License, Warehouse) to a dedicated Excel template
- Available from each asset list page with "Export" button
- Options to export all items, items by department, or only selected items

### Department-Based Export
- Export assets filtered by department (IT, HR, Finance, Operations)
- Available for PC, Laptop, Printer, and License assets
- Provides targeted data exports for specific organizational units

### All Assets Export
- Export all asset types in a single Excel file with multiple sheets
- Available from the main Assets page with "Export All" button
- Each asset type is placed on a separate worksheet

### Technical Implementation
- Uses template-based approach with predefined Excel templates
- Backend API routes handle data fetching and Excel generation
- Frontend dialogs provide user interface for export options
- Supports filtering by selection and department for targeted exports

For detailed technical information, see:
- `docs/excel-export-functionality.md` for general export functionality
- `docs/department-based-export.md` for department-based export details

## Role-Based Access Control

The system implements role-based access control (RBAC) to restrict access to certain features based on the user's role. There are two roles in the system:

### Roles

1. **Admin** - Has full access to all features:
   - View, create, edit, delete, and bulk delete users
   - View, create, edit, delete, and bulk delete tenants
   - View, create, edit, delete, and bulk delete assets
   - View and edit settings

2. **User** - Has limited access to features:
   - View users (only their own profile)
   - View tenants
   - View, create, edit, and delete assets (but not bulk delete)
   - View settings

### Implementation

The RBAC system is implemented through:

- **Permissions Library** (`src/lib/permissions.ts`): Core permission checking functions
- **Navigation Filtering** (`src/components/layout/navigation.tsx`): Filters sidebar menu items based on user role
- **Permission Hook** (`src/hooks/use-permissions.ts`): Provides easy access to permission checks in components
- **Component-Level Access Control**: Pages and components conditionally render actions based on permissions

For detailed implementation information, see `docs/role-based-access-control.md`.

## Deployment

### Production Build

To create a production build:

```bash
npm run build
```

### Running in Production

```bash
npm start
```

### Environment Variables for Production

Ensure the following environment variables are set in production:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-secret"
NODE_ENV="production"
```

### PM2 and Nginx Deployment

For production deployments, you can use PM2 as a process manager with Nginx as a reverse proxy:

1. Install PM2 globally: `npm install -g pm2`
2. Configure the application with PM2 using the provided `ecosystem.config.js`
3. Set up Nginx as a reverse proxy using the provided `nginx.conf`
4. Refer to `PM2_NGINX_DEPLOYMENT.md` for detailed instructions

### Automated Deployment

The system includes an automated deployment mechanism that monitors the GitHub repository for changes and automatically deploys updates:

1. The auto-deployment system checks for changes every 5 minutes
2. When changes are detected in the `deploy` branch, it automatically pulls updates
3. It handles dependency installation, database migrations, and application restarts
4. Refer to `AUTO_DEPLOYMENT.md` for detailed setup and configuration instructions

### Docker Deployment (Optional)

A Dockerfile is included for containerized deployment:

```bash
docker build -t itams .
docker run -p 3000:3000 itams
```

## Roadmap

### Phase 1: Core Features (Completed)
- [x] Multi-tenant architecture
- [x] User authentication and authorization
- [x] Asset management for PCs, laptops, printers, licenses
- [x] Excel import/export functionality
- [x] Custom fields system
- [x] Dashboard and statistics
- [x] History/audit logs

### Phase 2: Advanced Features (In Progress)
- [x] Role-based access control
- [ ] Advanced reporting and analytics
- [ ] API documentation with Swagger
- [ ] Mobile-responsive design enhancements
- [ ] Performance optimization

### Phase 3: Enterprise Features (Planned)
- [ ] SSO integration
- [ ] Advanced workflow automation
- [ ] Notification system
- [ ] Integration with third-party tools
- [ ] Multi-language support expansion

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Migate prima
npx prisma migrate reset --force
npx prisma migrate status
npx prisma migrate dev
npx prisma migrate deploy
npx prisma migrate resolve --rolled-back "20250904080237_add_internet_assets"
npx prisma migrate dev --name add_custom_fields_index --create-only