# IT Asset Management System (ITAMS) Deployment Guide

This guide provides detailed instructions for deploying the IT Asset Management System (ITAMS) on Ubuntu Desktop 22.04 with IP 10.1.32.66.

## Table of Contents

- [System Requirements](#system-requirements)
- [Prerequisites](#prerequisites)
- [Installation Steps](#installation-steps)
  - [1. Update System Packages](#1-update-system-packages)
  - [2. Install Node.js](#2-install-nodejs)
  - [3. Install and Configure PostgreSQL](#3-install-and-configure-postgresql)
  - [4. Clone and Configure Application](#4-clone-and-configure-application)
  - [5. Database Setup](#5-database-setup)
  - [6. Build the Application](#6-build-the-application)
  - [7. Set Up Process Management](#7-set-up-process-management)
  - [8. Set Up Reverse Proxy (Nginx)](#8-set-up-reverse-proxy-nginx)
  - [9. Configure Firewall](#9-configure-firewall)
  - [10. Set Up SSL Certificate (Optional)](#10-set-up-ssl-certificate-optional)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Accessing the Application](#accessing-the-application)
- [Security Considerations](#security-considerations)

## System Requirements

### Hardware Requirements
- CPU: 2 cores minimum
- RAM: 4GB minimum
- Storage: 20GB available space
- Network: Static IP 10.1.32.66

### Software Requirements
- Ubuntu Desktop 22.04
- Node.js 18+
- PostgreSQL 17
- Nginx
- PM2 (Process Manager)

## Prerequisites

Before beginning the deployment, ensure you have:
1. A clean installation of Ubuntu Desktop 22.04
2. Root or sudo access to the server
3. Internet connectivity for package installation
4. The IP address 10.1.32.66 configured on the server

## Installation Steps

### 1. Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Install Node.js

```bash
# Install Node.js 18+ (using NodeSource repository)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify the installation:
```bash
node --version
npm --version
```

### 3. Install and Configure PostgreSQL

```bash
# Install PostgreSQL 17
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user and database
sudo -u postgres psql -c "CREATE USER itams_user WITH PASSWORD 'Abcd_2025';"
sudo -u postgres psql -c "CREATE DATABASE itams_db OWNER itams_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;"
```

### 4. Clone and Configure Application

```bash
# Clone the application (replace with actual repository URL)
git clone <repository-url> /opt/itams
cd /opt/itams

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
DATABASE_URL="postgresql://itams_user:Abcd_2025@localhost:5432/itams_db?schema=public"
JWT_SECRET="your-production-secret-key-here"
NODE_ENV="production"
EOF
```

### 5. Database Setup

```bash
# Run database migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed the database with initial data (optional)
npm run seed
```

### 6. Build the Application

```bash
# Create production build
npm run build
```

### 7. Set Up Process Management

For production deployment, we'll use PM2 to manage the Node.js process:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create PM2 configuration file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'itams',
    script: 'node_modules/next/dist/bin/next',
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
EOF

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
sudo pm2 startup systemd -u $USER --hp /home/$USER
```

### 8. Set Up Reverse Proxy (Nginx)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/itams << EOF
server {
    listen 80;
    server_name 10.1.32.66;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/itams /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. Configure Firewall

```bash
# Enable and configure UFW firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### 10. Set Up SSL Certificate (Optional)

For production environments, it's recommended to set up SSL:

```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (requires domain name)
# sudo certbot --nginx -d your-domain.com

# Set up auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### Application Monitoring

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Monitor resource usage
pm2 monit
```

### Database Backup

Create a backup script:

```bash
# Create backup script
cat > /opt/itams/scripts/backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
pg_dump -U itams_user -h localhost itams_db > /opt/itams/backups/itams_backup_\$DATE.sql
EOF

# Make it executable
chmod +x /opt/itams/scripts/backup.sh

# Schedule daily backups
crontab -e
# Add this line:
# 0 2 * * * /opt/itams/scripts/backup.sh
```

### Application Updates

To update the application:

```bash
# Stop the application
pm2 stop itams

# Pull the latest code
cd /opt/itams
git pull

# Install any new dependencies
npm install

# Run database migrations if needed
npx prisma migrate deploy

# Rebuild the application
npm run build

# Start the application
pm2 start itams
```

## Accessing the Application

After deployment, the ITAMS application will be accessible at:
- URL: http://10.1.32.66
- Default Admin User: admin@demo.com / password
- Default Regular User: user@demo.com / password

## Security Considerations

1. **Change Default Passwords**: Immediately change default passwords after first login
2. **Secure JWT Secret**: Use a strong, randomly generated JWT secret in production
3. **Firewall Configuration**: Configure proper firewall rules to restrict access
4. **SSL Certificate**: Set up SSL certificate for encrypted connections
5. **System Updates**: Regularly update Ubuntu system packages for security patches
6. **Database Backups**: Implement regular database backups and test restoration procedures
7. **Log Monitoring**: Monitor application and system logs for suspicious activities
8. **Access Control**: Limit SSH access to trusted IP addresses
9. **File Permissions**: Ensure proper file permissions for application files and directories
10. **Resource Limits**: Configure system resource limits to prevent DoS attacks

## Troubleshooting

### Common Issues

1. **Application Not Starting**:
   - Check PM2 logs: `pm2 logs itams`
   - Verify environment variables in `.env` file
   - Ensure database is accessible and credentials are correct

2. **Database Connection Issues**:
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env` file
   - Ensure database user has proper permissions

3. **Nginx Configuration Issues**:
   - Test configuration: `sudo nginx -t`
   - Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

4. **Port Conflicts**:
   - Check if port 3000 is already in use: `lsof -i :3000`
   - Check if port 80 is already in use: `lsof -i :80`

### Useful Commands

```bash
# Check system resources
htop

# Check disk space
df -h

# Check network connections
netstat -tulpn

# Restart services
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart itams
```

This deployment guide provides a complete solution for running the IT Asset Management System in a production environment on Ubuntu Desktop 22.04 with IP 10.1.32.66.