# ITAMS Application Deployment Guide

## Overview

This document provides instructions for deploying the ITAMS (IT Asset Management System) application in a production environment.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 17 installed and configured
- PM2 installed globally (`npm install -g pm2`)
- Git installed
- Proper environment variables configured

## Deployment Process

### 1. Clone the Repository

```bash
git clone <repository-url>
cd app-infra
```

### 2. Environment Configuration

Create a `.env.production` file with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
JWT_SECRET="your-jwt-secret"
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 3. Automated Deployment

#### For Ubuntu/Linux:

```bash
./scripts/deploy.sh
```

#### For Windows:

```powershell
./scripts/deploy.ps1
```

### 4. Manual Deployment Steps

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Build the application:
   ```bash
   npm run build:production
   ```

3. Start the application with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

## Build Process

The deployment process includes two build steps:

1. **Next.js Build**: Compiles the React/Next.js frontend
   ```bash
   npm run build
   ```

2. **Server Build**: Compiles TypeScript files in the `src/lib` directory to the `dist` directory
   ```bash
   npm run build:server
   ```

The `build:production` script runs both of these steps sequentially.

## Directory Structure in Production

In production, the application expects the following directory structure:

```
/opt/itams/
├── dist/                 # Compiled TypeScript files
│   └── lib/
│       ├── realtime.js
│       └── path-utils.js
├── node_modules/
├── server.js
├── ecosystem.config.js
└── ... (other files)
```

## Troubleshooting

### Module Not Found Errors

If you encounter errors like "Cannot find module '/opt/itams/dist/lib/realtime'", ensure that:

1. The `build:server` script has been run successfully
2. The `dist` directory and its contents exist in the deployment directory
3. The application has proper read permissions for the `dist` directory

### Port Conflicts

If the application fails to start due to port conflicts:

1. Check what's running on port 3000:
   ```bash
   netstat -tulpn | grep :3000
   ```

2. Stop the conflicting process or change the PORT in `.env.production`

## Environment Variables

The following environment variables must be set in production:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Should be set to "production"
- `PORT`: Port number for the application (default: 3000)
- `NEXT_PUBLIC_APP_URL`: Public URL of the application

## Monitoring and Logs

Use PM2 to monitor the application:

```bash
pm2 list          # List all processes
pm2 logs itams    # View application logs
pm2 monit         # Monitor resource usage
```