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
   - Bulk export functionality
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
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Assets
Each asset type (pc, laptop, printer, license, warehouse) has the following endpoints:
- `GET /api/assets/:type` - List assets
- `POST /api/assets/:type` - Create a new asset
- `GET /api/assets/:type/:id` - Get a specific asset
- `PUT /api/assets/:type/:id` - Update an asset
- `DELETE /api/assets/:type/:id` - Delete an asset

### Excel Operations
- `GET /api/assets/excel/export?assetType=:type` - Export assets to Excel
- `POST /api/assets/excel/import` - Import assets from Excel

### Dashboard
- `GET /api/dashboard` - Get dashboard statistics

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment (Optional)
Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment (Recommended)
1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

## Roadmap

### Phase 1: Core Implementation (Completed)
- ✅ Multi-tenant architecture
- ✅ User authentication and authorization
- ✅ Asset management modules
- ✅ Excel import/export functionality
- ✅ Dashboard and statistics
- ✅ Audit trail and history tracking
- ✅ Internationalization support

### Phase 2: Advanced Features (In Progress)
- ✅ Custom fields system
- ⏳ Advanced reporting and analytics
- ⏳ Notification system
- ⏳ API documentation with Swagger
- ⏳ Performance optimization
- ⏳ Security enhancements

### Phase 3: Enterprise Features (Planned)
- 🔲 Role-based dashboard customization
- 🔲 Asset lifecycle management
- 🔲 Integration with external systems
- 🔲 Mobile application
- 🔲 Advanced search and filtering
- 🔲 Data backup and recovery

## Contributing

We welcome contributions to the IT Asset Management System! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the existing style and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**IT Asset Management System** - Streamline your IT asset management processes with this comprehensive solution.