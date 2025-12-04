# Installation Guide

This guide provides step-by-step instructions for installing the IT Asset Management System (ITAMS) in a production environment.

## System Requirements

### Supported Operating Systems
- Ubuntu 20.04 LTS or later
- CentOS 7 or later
- Debian 10 or later
- Windows Server 2019 or later

### Hardware Requirements
- **Minimum**:
  - CPU: 2 cores
  - RAM: 4GB
  - Disk Space: 10GB free space
- **Recommended**:
  - CPU: 4 cores
  - RAM: 8GB or more
  - Disk Space: 20GB free space

### Software Dependencies
- Node.js 18+
- PostgreSQL 17
- Redis 6+
- npm 8+
- Git

## Installation Methods

### Method 1: Manual Installation (Recommended)

#### Step 1: Install System Dependencies

**Ubuntu/Debian:**
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Git
sudo apt install -y git
```

**CentOS/RHEL:**
```bash
# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install -y postgresql postgresql-server postgresql-contrib

# Install Redis
sudo yum install -y redis

# Install Git
sudo yum install -y git
```

#### Step 2: Set Up Database

1. Start PostgreSQL service:
   ```bash
   # Ubuntu/Debian
   sudo systemctl start postgresql
   sudo systemctl enable postgresql

   # CentOS/RHEL
   sudo postgresql-setup initdb
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. Create database and user:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE itams_db;
   CREATE USER itams_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;
   \q
   ```

#### Step 3: Set Up Redis

1. Start Redis service:
   ```bash
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. Test Redis connection:
   ```bash
   redis-cli ping
   # Should return "PONG"
   ```

#### Step 4: Clone and Configure Application

1. Create application directory:
   ```bash
   sudo mkdir -p /opt/itams
   sudo chown $USER:$USER /opt/itams
   ```

2. Clone the repository:
   ```bash
   cd /opt/itams
   git clone <repository-url> .
   ```

3. Install dependencies:
   ```bash
   npm ci --production
   ```

4. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

5. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://itams_user:secure_password@localhost:5432/itams_db?schema=public"
   JWT_SECRET="your-very-secure-jwt-secret-here"
   REDIS_URL="redis://localhost:6379"
   NODE_ENV="production"
   PORT=3000
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   ```

#### Step 5: Set Up Database Schema

1. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

#### Step 6: Build Application

```bash
npm run build:production
```

#### Step 7: Set Up Process Manager

1. Install PM2 globally:
   ```bash
   sudo npm install -g pm2
   ```

2. Start application with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```

3. Set up PM2 to start on boot:
   ```bash
   pm2 startup
   # Follow the instructions provided by the command
   ```

#### Step 8: Set Up Reverse Proxy (Optional but Recommended)

**Nginx Configuration:**
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

### Method 2: Docker Installation

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 1.29+

#### Step 1: Clone Repository
```bash
git clone <repository-url>
cd infra-app
```

#### Step 2: Configure Environment
Create `.env` file:
```env
DATABASE_URL="postgresql://itams_user:secure_password@db:5432/itams_db?schema=public"
JWT_SECRET="your-very-secure-jwt-secret-here"
REDIS_URL="redis://redis:6379"
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

#### Step 3: Start Services
```bash
docker-compose up -d
```

#### Step 4: Run Database Migrations
```bash
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma generate
```

### Method 3: Automated Installation Script

The project includes automated installation scripts for Ubuntu:

```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/your-org/itams/main/scripts/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
sudo ./setup-ubuntu.sh
```

## Post-Installation Configuration

### 1. Verify Installation

Check if services are running:
```bash
# Check application status
pm2 list

# Check logs
pm2 logs itams

# Test application
curl http://localhost:3000/api/health
```

### 2. Create Initial Admin User

```bash
# Run the admin user creation script
npm run create-admin
```

### 3. Configure SSL (Recommended)

If using Nginx, obtain SSL certificate with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 4. Set Up Backup Strategy

Create a backup script:
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U itams_user -h localhost itams_db > /backup/itams_db_$DATE.sql
```

Set up cron job:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## Environment Variables

### Required Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `REDIS_URL`: Redis connection string
- `NODE_ENV`: Should be "production"
- `PORT`: Port number for the application

### Optional Variables
- `NEXT_PUBLIC_APP_URL`: Public URL of the application
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `ENABLE_CACHE`: Enable/disable caching (true/false)
- `CACHE_TTL_ASSETS`: Cache TTL for assets in seconds
- `CACHE_TTL_PERMISSIONS`: Cache TTL for permissions in seconds

## Security Considerations

### 1. File Permissions
```bash
# Set proper permissions
sudo chown -R itams:itams /opt/itams
sudo chmod -R 755 /opt/itams
```

### 2. Firewall Configuration
```bash
# Ubuntu/Debian with UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 3. Database Security
- Use strong database passwords
- Restrict database access to localhost only
- Regularly update PostgreSQL

### 4. Application Security
- Use HTTPS in production
- Regular security updates
- Monitor logs for suspicious activity
- Implement proper backup strategy

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is running
- Check database credentials
- Ensure PostgreSQL accepts connections

#### 2. Redis Connection Failed
- Check REDIS_URL in `.env`
- Verify Redis is running
- Check firewall settings

#### 3. Application Not Starting
- Check PM2 logs: `pm2 logs itams`
- Verify all environment variables are set
- Check file permissions

#### 4. Port Already in Use
- Change PORT in `.env`
- Check for processes using the port:
  ```bash
  netstat -tulpn | grep :3000
  ```

### Log Locations

- **Application Logs**: `/opt/itams/.pm2/logs/`
- **Database Logs**: `/var/log/postgresql/`
- **Redis Logs**: `/var/log/redis/`
- **Nginx Logs**: `/var/log/nginx/`

## Verification

After installation, verify that all components are working:

1. **Database**: `psql -U itams_user -d itams_db -c "SELECT version();"`
2. **Redis**: `redis-cli ping` should return "PONG"
3. **Application**: `curl http://localhost:3000/api/health` should return success
4. **Web Interface**: Open browser to `http://your-server-ip:3000`

## Next Steps

After successful installation:

1. [Configure the application](Configuration.md)
2. [Set up your first tenant](User-Guide.md#tenant-setup)
3. [Add users and assign roles](Role-Based-Access-Control.md)
4. [Start managing assets](Asset-Management.md)
5. [Set up monitoring](Monitoring.md)