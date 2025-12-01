# IT Asset Management System (ITAMS)

A comprehensive IT asset management solution built with modern web technologies.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Agent API](#agent-api)
- [Excel Import/Export](#excel-importexport)
- [Role-Based Access Control](#role-based-access-control)
- [Caching with Redis](#caching-with-redis)
- [Internationalization](#internationalization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

The IT Asset Management System (ITAMS) is a comprehensive solution for organizations to track, manage, and optimize their IT assets. The system provides multi-tenant support, allowing different organizations to use the same instance while maintaining data isolation.

Built with modern technologies like Next.js 15, TypeScript, and Prisma ORM, ITAMS offers a responsive, performant interface with real-time data visualization and comprehensive asset tracking capabilities.

## Key Features

### Core Modules

1. **User & Tenant Management**
   - Multi-tenant architecture with data isolation
   - Role-based access control (RBAC)
   - User authentication and authorization
   - Profile management

2. **IT Asset Management**
   - **PC Assets**: Track desktop computers with detailed specifications (CPU, RAM, storage, etc.)
   - **Laptop Assets**: Manage portable devices with warranty and purchase information
   - **Printer Assets**: Monitor printers and multifunction devices with network details
   - **License Assets**: Track software licenses and compliance with expiration dates
   - **Warehouse IT**: Manage inventory in storage with barcode tracking
   - **Internet Assets**: Track internet connections and access permissions

3. **Excel Import/Export**
   - Template-based data import for all asset types
   - Bulk export functionality with department filtering
   - Data validation during import
   - Support for custom fields in exports

4. **Custom Fields**
   - Tenant-specific custom fields
   - Support for various data types (text, textarea, number, date, boolean, select)
   - JSON storage for flexibility
   - Inline editing in asset lists
   - Automatic integration in asset forms
   - Required field validation
   - CRUD management interface

5. **Dashboard & Analytics**
   - Real-time asset overview with key metrics
   - Interactive charts for asset distribution by type, status, department
   - Custom field statistics visualization
   - Asset growth trends over time
   - Component breakdown for PCs (CPUs, monitors, UPS devices)

6. **Audit Trail & History**
   - Complete audit trail for all changes
   - Change tracking for all assets with before/after values
   - User activity monitoring
   - Configurable retention policies

7. **Agent Integration**
   - Automated computer configuration data submission
   - MAC address-based duplicate detection
   - Real-time synchronization with client agents

### Technical Features

- Full internationalization support (English & Traditional Chinese)
- Responsive design for all device sizes
- Server-side rendering (SSR) with client-side enhancements
- RESTful API architecture with comprehensive endpoints
- Comprehensive error handling and validation
- Performance optimization with Redis caching
- Security headers and best practices implementation
- Dark/light theme support

## Tech Stack

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
│                    Data & Cache Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ PostgreSQL  │  │    Redis     │  │   File Storage     │ │
│  │     17      │  │   Cache      │  │   (Templates)      │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Node.js 18+ installed
- PostgreSQL 17 installed
- Redis server installed
- npm or yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd itams
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:Abcd_2025@localhost:5432/infrasys_db?schema=public"
   JWT_SECRET="your-secret-key"
   REDIS_URL="redis://localhost:6379"
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```
4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start Redis server**
   ```bash
   redis-server
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   Open your browser and navigate to `http://localhost:3001`

## Database Schema

The database schema is designed with multi-tenancy in mind, featuring the following main entities:

- **Tenant** - Organization/container for all data with complete isolation
- **User** - System users with role-based access and authentication
- **Role** - User roles with configurable permissions
- **PC** - Desktop computer assets with component tracking
- **Laptop** - Portable computer assets with warranty information
- **Printer** - Printing device assets with network details
- **License** - Software license assets with expiration tracking
- **WarehouseIT** - Storage inventory assets with barcode management
- **Internet** - Internet connection assets with access control
- **CustomField** - Tenant-specific custom fields for extensibility
- **History** - Audit trail for all changes with detailed logging

Each asset type supports custom fields stored as JSON, allowing tenants to extend the data model without schema changes.

For detailed schema information, refer to `prisma/schema.prisma`.

## API Documentation

All API endpoints follow RESTful conventions and are organized by resource:

### Authentication
- `POST /api/auth/login` - User login with email and password
- `DELETE /api/auth/logout` - User logout and session cleanup

### Tenants
- `GET /api/tenants` - List all tenants (admin only)
- `POST /api/tenants` - Create a new tenant (admin only)
- `GET /api/tenants/:id` - Get a specific tenant
- `PUT /api/tenants/:id` - Update a tenant (admin only)
- `DELETE /api/tenants/:id` - Delete a tenant (admin only)

### Users
- `GET /api/users` - List users in the current tenant
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get a specific user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user

### Assets
Each asset type has a complete CRUD API:
- `GET /api/assets/pc` - List PC assets with pagination and search
- `POST /api/assets/pc` - Create a new PC asset
- `GET /api/assets/pc/:id` - Get a specific PC asset
- `PUT /api/assets/pc/:id` - Update a PC asset
- `DELETE /api/assets/pc/:id` - Delete a PC asset

Similar endpoints exist for `laptop`, `printer`, `license`, `warehouse`, and `internet` asset types.

### Agent API
- `POST /api/agent` - Submit computer configuration data from agent software
- `GET /api/agent` - Health check endpoint

### Custom Fields
- `GET /api/custom-fields` - List custom fields for the current tenant
- `POST /api/custom-fields` - Create a new custom field
- `PUT /api/custom-fields/:id` - Update a custom field
- `DELETE /api/custom-fields/:id` - Delete a custom field

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary data

## Agent API

The Agent API allows computer agent software to automatically submit computer configuration data to the ITAMS system. The agent software should send updated information every 5-10 minutes to keep the system synchronized with actual computer configurations.

### Endpoint
`POST /api/agent`

### Request Body
The request body should be a JSON object containing computer configuration data:

```json
{
  "pcName": "SGDH-IT-DTHIEN",
  "userName": "thien.dinh",
  "ipAddress": "10.1.1.10",
  "cpu": "Intel Core i5-10400",
  "ram": "32GB DDR4",
  "os": "Windows 10 Pro 21H2",
  "harddisk": "1TB NVMe SSD",
  "motherboard": "ASUS Prime B460M-A",
  "graphics": "Intel UHD Graphics 630",
  "macAddress": "00:1A:2B:3C:4D:5E",
  "office": "Microsoft Office 2021"
}
```

### MAC Address Identification

The system supports identifying existing computers by MAC address to prevent duplicate entries when a computer's name or other details change. To enable this functionality:

1. Create a custom field named "MAC" for the PC asset type
2. Include the `macAddress` field in agent data submissions
3. The system will automatically check for existing PCs with the same MAC address and update them instead of creating new records

### Field Mapping
The agent fields are mapped to database custom fields as follows:
- `cpu` → `CPU`
- `ram` → `RAM`
- `os` → `OS`
- `ipAddress` → `IP`
- `harddisk` → `HARDISK`
- `motherboard` → `MOTHERBOARD`
- `graphics` → `GRAPHICS`
- `macAddress` → `MAC`
- `office` → `OFFICE`

### Response
- `201 Created` - Data successfully processed
- `400 Bad Request` - Missing required fields or invalid data
- `500 Internal Server Error` - Server error

### Example Usage
```javascript
const agentData = {
  pcName: 'SGDH-IT-DTHIEN',
  userName: 'thien.dinh',
  ipAddress: '10.1.1.10',
  cpu: 'Intel Core i5-10400',
  ram: '32GB DDR4',
  os: 'Windows 10 Pro 21H2',
  harddisk: '1TB NVMe SSD',
  motherboard: 'ASUS Prime B460M-A',
  graphics: 'Intel UHD Graphics 630',
  macAddress: '00:1A:2B:3C:4D:5E',
  office: 'Microsoft Office 2021'
};

fetch('/api/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(agentData)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Excel Import/Export

The ITAMS provides comprehensive Excel import/export capabilities for all asset types with template-based workflows.

### Export Features

1. **Individual Asset Type Export**
   - Export any single asset type (PC, Laptop, Printer, License, Warehouse, Internet) to a dedicated Excel template
   - Available from each asset list page with "Export" button
   - Options to export all items, items by department, or only selected items

2. **Department-Based Export**
   - Export assets filtered by department (IT, HR, Finance, Operations)
   - Available for all asset types
   - Provides targeted data exports for specific organizational units

3. **Custom Fields Support**
   - All custom fields are automatically included in exports
   - Template columns are dynamically generated based on configured custom fields

### Import Features

1. **Template-Based Import**
   - Download pre-formatted templates for each asset type
   - Column mapping interface for flexible data import
   - Automatic field type validation

2. **Data Validation**
   - Real-time validation during import process
   - Detailed error reporting with row-by-row feedback
   - Support for partial imports with error skipping

3. **Batch Processing**
   - Handle large datasets with progress tracking
   - Estimated time remaining calculations
   - Resume capability for interrupted imports

### Technical Implementation

- Uses `xlsx-populate` library for robust Excel template handling
- Backend API routes handle data fetching, validation, and Excel generation
- Frontend dialogs provide user interface for export/import options
- Supports filtering by selection and department for targeted operations

## Role-Based Access Control

The system implements role-based access control (RBAC) to restrict access to certain features based on the user's role. There are two default roles in the system with configurable permissions:

### Roles

1. **Admin** - Has full access to all features:
   - View, create, edit, delete, and bulk delete all resources
   - Manage tenant settings and configurations
   - View and edit audit logs
   - Full access to agent API

2. **User** - Has limited access to features:
   - View and manage their own profile
   - View tenants (read-only)
   - View, create, edit, and delete assets
   - Limited access to settings (read-only)

### Implementation

The RBAC system is implemented through:

- **Permissions Library** (`src/lib/permissions.ts`): Core permission checking functions with caching
- **Navigation Filtering** (`src/components/layout/navigation.tsx`): Filters sidebar menu items based on user role
- **Permission Hook** (`src/hooks/use-permissions.ts`): Provides easy access to permission checks in components
- **Component-Level Access Control**: Pages and components conditionally render actions based on permissions
- **API-Level Authorization**: All API endpoints check permissions before processing requests

Permissions are cached in Redis for improved performance and automatically invalidated when roles are updated.

## Caching with Redis

The ITAMS uses Redis as a caching layer to improve performance and reduce database load.

### Cache Implementation

- **Asset Lists**: Cached with 2-minute TTL for frequently accessed asset lists
- **Individual Assets**: Cached with 5-minute TTL for detailed asset views
- **Permissions**: Cached with 5-minute TTL for role-based access control
- **Custom Fields**: Cached with 10-minute TTL for tenant-specific configurations
- **Dashboard Data**: Cached with 2-minute TTL for real-time metrics

### Cache Invalidation

The system automatically invalidates cache entries when:
- Assets are created, updated, or deleted
- Permissions are modified
- Custom fields are updated
- User roles change

### Redis Setup

1. Install Redis server:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   ```

2. Start Redis server:
   ```bash
   redis-server
   ```

3. Configure Redis URL in `.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

### Testing Redis Connectivity

You can test Redis connectivity with the provided test script:

```bash
npm run test:redis-connection
```

## Internationalization

The application supports full internationalization with English (default) and Traditional Chinese language packs.

### Implementation

- **Language Detection**: Automatic detection based on browser settings with manual override
- **Translation Files**: JSON-based translation files in `src/locales/`
- **Dynamic Loading**: Language files loaded on-demand for optimal performance
- **Component Integration**: `useTranslation` hook for easy translation in components
- **Server/Client Support**: Works in both server-side rendering and client-side contexts

### Adding New Languages

1. Create a new translation file in `src/locales/` (e.g., `fr.json`)
2. Add the language to `supportedLanguages` in `src/lib/i18n.ts`
3. Update the language switcher in the UI

### Translation Usage

```typescript
import { useTranslation } from '@/hooks/use-translation';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

## Deployment

### Production Build

To create a production build:

```bash
npm run build:production
```

This command builds both the Next.js frontend and compiles the server-side TypeScript files.

### Running in Production

```bash
npm start
```

This starts the application using the custom server implementation in `server.js`.

### Environment Variables for Production

Ensure the following environment variables are set in production:

```env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-secret"
REDIS_URL="redis://your-redis-host:6379"
NODE_ENV="production"
PORT=3000
```

### PM2 Deployment

For production deployments, you can use PM2 as a process manager:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

### Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
# Build the Docker image
docker build -t itams .

# Run the container
docker run -p 3000:3000 itams
```

### Nginx Reverse Proxy

For production deployments with Nginx, configure a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

Please ensure your code follows the existing style and includes appropriate tests.

### Development Guidelines

1. **TypeScript**: All code should be written in TypeScript with strict type checking
2. **Testing**: Add unit tests for new functionality
3. **Documentation**: Update README.md and code comments as needed
4. **Commit Messages**: Use clear, descriptive commit messages
5. **Code Style**: Follow the existing code style and conventions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Migate prima
npx prisma migrate npx prisma migrate reset --force npx prisma migrate status npx prisma migrate dev npx prisma migrate deploy npx prisma migrate resolve --rolled-back "20250904080237_add_internet_assets" npx prisma migrate dev --name add_custom_fields_index --create-only