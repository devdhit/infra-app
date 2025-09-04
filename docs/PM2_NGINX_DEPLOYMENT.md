# IT Asset Management System (ITAMS) - PM2 and Nginx Deployment Guide

This guide provides detailed instructions for deploying the IT Asset Management System (ITAMS) using PM2 as a process manager and Nginx as a reverse proxy.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [PM2 Configuration](#pm2-configuration)
- [Nginx Configuration](#nginx-configuration)
- [Deployment Process](#deployment-process)
- [Management and Monitoring](#management-and-monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

This deployment approach uses:
- **PM2**: Advanced Node.js process manager for production environments
- **Nginx**: High-performance web server and reverse proxy

The architecture:
```
Internet → Nginx (port 80) → PM2 → Next.js Application (port 3000)
```

## Prerequisites

1. Ubuntu Server 22.04 (recommended)
2. Node.js 18+
3. npm package manager
4. PM2 installed globally (`npm install -g pm2`)
5. Nginx installed (`sudo apt install nginx`)
6. PostgreSQL 17 database

## PM2 Configuration

The project includes an `ecosystem.config.js` file that defines the PM2 configuration:

```javascript
module.exports = {
  apps: [{
    name: 'itams',
    script: '/opt/itams/node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/opt/itams',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### Configuration Details:

- **name**: Application name in PM2
- **script**: Path to the Next.js start script
- **args**: Arguments passed to the script (start command)
- **cwd**: Current working directory (/opt/itams as specified in deployment docs)
- **instances**: Number of application instances ('max' uses all CPU cores)
- **exec_mode**: Execution mode (cluster mode for load balancing)
- **env**: Environment variables

## Nginx Configuration

The project includes an `nginx.conf` file for reverse proxy setup:

```nginx
server {
    listen 80;
    server_name 10.1.32.66;

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
        proxy_buffering off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
}
```

## Deployment Process

### 1. Prepare the Environment

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL (if not already installed)
sudo apt install -y postgresql postgresql-contrib
```

### 2. Database Setup

```bash
# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql -c "CREATE USER itams_user WITH PASSWORD 'Abcd_2025';"
sudo -u postgres psql -c "CREATE DATABASE itams_db OWNER itams_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;"
```

### 3. Application Setup

```bash
# Clone the application (replace with actual repository URL)
git clone <repository-url> /opt/itams
cd /opt/itams

# Install dependencies
npm install --production

# Create environment file
cat > .env << EOF
DATABASE_URL="postgresql://itams_user:Abcd_2025@localhost:5432/itams_db?schema=public"
JWT_SECRET="your-production-secret-key-here"
NODE_ENV="production"
PORT=3000
EOF
```

### 4. Database Migration

```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 5. Build the Application

```bash
# Create production build
npm run build
```

If you encounter a Turbopack build error, try these solutions:

1. **Use Webpack instead of Turbopack**:
   - Ensure the `next.config.ts` file doesn't have Turbopack-specific configurations
   - Remove `--turbopack` flags from package.json scripts

2. **Clear build cache**:
   ```bash
   # Remove Next.js build directory
   rm -rf .next
   
   # Regenerate Prisma client
   npx prisma generate
   
   # Try building again
   npm run build
   ```

3. **Use the provided clear-build-cache script**:
   ```bash
   # On Linux/Unix systems
   ./scripts/clear-build-cache.sh
   
   # On Windows systems
   ./scripts/clear-build-cache.ps1
   ```

### 6. Start Application with PM2

```bash
# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
sudo pm2 startup systemd -u $USER --hp /home/$USER
```

### 7. Configure Nginx Reverse Proxy

```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/itams

# Enable the site
sudo ln -s /etc/nginx/sites-available/itams /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Management and Monitoring

### PM2 Management Commands

```bash
# Check application status
pm2 status

# View application logs
pm2 logs

# Monitor resource usage
pm2 monit

# Restart application
pm2 restart itams

# Stop application
pm2 stop itams

# Delete application from PM2
pm2 delete itams
```

### Nginx Management Commands

```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Reload Nginx configuration
sudo systemctl reload nginx

# Test Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

## Troubleshooting

### Common PM2 Issues

1. **Application fails to start**:
   ```bash
   # Check PM2 logs for detailed error information
   pm2 logs itams
   
   # Check if all environment variables are set correctly
   pm2 show itams
   ```

2. **Port conflicts**:
   ```bash
   # Check if port 3000 is already in use
   lsof -i :3000
   
   # If needed, change the port in ecosystem.config.js and .env file
   ```

### Common Nginx Issues

1. **502 Bad Gateway Error**:
   ```bash
   # Check if the application is running on port 3000
   curl http://localhost:3000
   
   # Check PM2 status
   pm2 status itams
   
   # Check Nginx error logs
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Nginx configuration test fails**:
   ```bash
   # Test configuration
   sudo nginx -t
   
   # Check for syntax errors in nginx.conf
   ```

### Build Issues

1. **Turbopack Build Errors**:
   - Ensure Turbopack-specific flags are removed from package.json scripts
   - Check that next.config.ts doesn't contain Turbopack-specific configurations
   - Clear the build cache with `rm -rf .next` and try again
   - Regenerate the Prisma client with `npx prisma generate`

2. **CSS Processing Issues**:
   - Check for syntax errors in CSS files
   - Ensure all imported CSS files exist and are properly formatted
   - Verify PostCSS configuration in postcss.config.mjs

### Useful Debugging Commands

```bash
# Check system resources
htop

# Check disk space
df -h

# Check network connections
netstat -tulpn

# Check application process
ps aux | grep node

# Check environment variables
printenv
```

This deployment guide provides a complete solution for running the IT Asset Management System in a production environment using PM2 and Nginx reverse proxy.