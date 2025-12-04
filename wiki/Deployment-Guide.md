# Deployment Guide

This guide provides comprehensive instructions for deploying the IT Asset Management System (ITAMS) in production environments.

## Deployment Options

ITAMS supports multiple deployment options to suit different infrastructure requirements:

1. **Manual Deployment** - Direct installation on servers
2. **Docker Deployment** - Containerized deployment using Docker
3. **PM2 Deployment** - Process management with PM2
4. **Cloud Deployment** - Deployment to cloud platforms (AWS, Azure, GCP)

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+, CentOS 7+, Debian 10+, or Windows Server 2019+
- **CPU**: Minimum 2 cores, recommended 4 cores
- **RAM**: Minimum 4GB, recommended 8GB
- **Disk Space**: Minimum 10GB free space, recommended 20GB
- **Network**: Stable internet connection for updates and dependencies

### Software Dependencies
- Node.js 18+
- npm 8+
- PostgreSQL 17
- Redis 6+
- Git 2.20+
- PM2 (for PM2 deployment)

## Environment Configuration

### Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Authentication
JWT_SECRET="your-very-secure-jwt-secret-here-change-in-production"
JWT_EXPIRES_IN="24h"

# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_PREFIX="itams:"

# Application Configuration
NODE_ENV="production"
PORT=3000
HOST="0.0.0.0"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Performance Configuration
ENABLE_CACHE=true
CACHE_TTL_ASSETS=300
CACHE_TTL_PERMISSIONS=300
CACHE_TTL_CUSTOM_FIELDS=600

# Logging Configuration
LOG_LEVEL="info"
LOG_FORMAT="json"

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Manual Deployment

### Step 1: Prepare the Server

1. **Update System Packages**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   ```

2. **Install Required Software**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql postgresql-contrib redis-server git
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs postgresql postgresql-server postgresql-contrib redis git
   ```

### Step 2: Set Up Database

1. **Start Database Services**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   sudo systemctl start redis
   sudo systemctl enable redis
   
   # CentOS/RHEL
   sudo postgresql-setup initdb
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. **Create Database and User**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE itams_db;
   CREATE USER itams_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE itams_db TO itams_user;
   \q
   ```

### Step 3: Deploy Application

1. **Create Application Directory**
   ```bash
   sudo mkdir -p /opt/itams
   sudo chown $USER:$USER /opt/itams
   cd /opt/itams
   ```

2. **Clone Repository**
   ```bash
   git clone <repository-url> .
   ```

3. **Install Dependencies**
   ```bash
   npm ci --production
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env.production
   # Edit .env.production with your configuration
   ```

5. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **Build Application**
   ```bash
   npm run build:production
   ```

### Step 4: Set Up Process Management

1. **Install PM2**
   ```bash
   sudo npm install -g pm2
   ```

2. **Start Application**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

3. **Set Up Auto-start**
   ```bash
   pm2 startup
   # Follow the instructions provided
   ```

### Step 5: Configure Reverse Proxy

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
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
        
        # Timeout Settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Cache Static Assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Docker Deployment

### Step 1: Prepare Docker Environment

1. **Install Docker**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # CentOS/RHEL
   sudo yum install -y yum-utils
   sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
   sudo yum install -y docker-ce docker-ce-cli containerd.io
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -aG docker $USER
   ```

2. **Install Docker Compose**
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

### Step 2: Configure Docker Environment

Create `.env` file:
```env
DATABASE_URL=postgresql://itams_user:secure_password@db:5432/itams_db?schema=public
JWT_SECRET=your-very-secure-jwt-secret-here-change-in-production
REDIS_URL=redis://redis:6379
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 3: Deploy with Docker Compose

1. **Start Services**
   ```bash
   docker-compose up -d
   ```

2. **Run Database Migrations**
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma generate
   ```

3. **Monitor Services**
   ```bash
   docker-compose logs -f
   ```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=${REDIS_URL}
      - NODE_ENV=${NODE_ENV}
      - PORT=${PORT}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    depends_on:
      - db
      - redis
    restart: unless-stopped
    volumes:
      - app_logs:/app/logs

  db:
    image: postgres:17
    environment:
      - POSTGRES_DB=itams_db
      - POSTGRES_USER=itams_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  db_data:
  redis_data:
  app_logs:
```

## Cloud Deployment

### AWS Deployment

1. **Launch EC2 Instance**
   - AMI: Ubuntu 20.04 LTS
   - Instance Type: t3.medium (2 vCPU, 4GB RAM)
   - Storage: 20GB GP2 SSD

2. **Configure Security Groups**
   - HTTP (80) - Allow from 0.0.0.0/0
   - HTTPS (443) - Allow from 0.0.0.0/0
   - SSH (22) - Allow from your IP only

3. **Deploy Application**
   - Follow Manual Deployment steps above

### Azure Deployment

1. **Create Virtual Machine**
   - Image: Ubuntu 20.04 LTS
   - Size: Standard B2s (2 vCPU, 4GB RAM)
   - Disk: 30GB SSD

2. **Configure Network Security**
   - NSG Rules for HTTP, HTTPS, and SSH

3. **Deploy Application**
   - Follow Manual Deployment steps above

### Google Cloud Deployment

1. **Create Compute Engine Instance**
   - Machine Type: e2-medium (2 vCPU, 4GB RAM)
   - Boot Disk: Ubuntu 20.04 LTS, 20GB

2. **Configure Firewall Rules**
   - Allow HTTP, HTTPS, and SSH traffic

3. **Deploy Application**
   - Follow Manual Deployment steps above

## SSL Configuration

### Let's Encrypt with Certbot

1. **Install Certbot**
   ```bash
   # Ubuntu/Debian
   sudo apt install certbot python3-certbot-nginx
   
   # CentOS/RHEL
   sudo yum install certbot python3-certbot-nginx
   ```

2. **Obtain SSL Certificate**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal**
   ```bash
   # Test renewal
   sudo certbot renew --dry-run
   
   # Add to crontab
   sudo crontab -e
   # Add line: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Monitoring and Logging

### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 list
   pm2 logs itams
   ```

2. **System Monitoring**
   ```bash
   # Install monitoring tools
   sudo apt install htop iotop iftop
   
   # Monitor system resources
   htop  # CPU and memory
   iotop # Disk I/O
   iftop # Network usage
   ```

### Log Management

1. **Log Rotation**
   ```bash
   # Create logrotate configuration
   sudo nano /etc/logrotate.d/itams
   
   # Add configuration:
   /opt/itams/.pm2/logs/*.log {
       daily
       missingok
       rotate 52
       compress
       delaycompress
       notifempty
       create 644 pm2 pm2
       postrotate
           pm2 reloadLogs
       endscript
   }
   ```

2. **Centralized Logging**
   ```bash
   # Install Filebeat for ELK stack integration
   curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.8.0-amd64.deb
   sudo dpkg -i filebeat-8.8.0-amd64.deb
   
   # Configure Filebeat
   sudo nano /etc/filebeat/filebeat.yml
   ```

## Backup and Recovery

### Database Backup

1. **Automated Backup Script**
   ```bash
   #!/bin/bash
   # backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backup"
   
   # Create backup directory
   mkdir -p $BACKUP_DIR
   
   # Backup database
   pg_dump -U itams_user -h localhost itams_db > $BACKUP_DIR/itams_db_$DATE.sql
   
   # Compress backup
   gzip $BACKUP_DIR/itams_db_$DATE.sql
   
   # Remove backups older than 30 days
   find $BACKUP_DIR -name "itams_db_*.sql.gz" -mtime +30 -delete
   ```

2. **Schedule Backups**
   ```bash
   # Add to crontab
   crontab -e
   
   # Daily backup at 2 AM
   0 2 * * * /path/to/backup.sh
   ```

### Application Backup

1. **Backup Script**
   ```bash
   #!/bin/bash
   # app-backup.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backup/app"
   
   # Create backup directory
   mkdir -p $BACKUP_DIR
   
   # Backup application files
   tar -czf $BACKUP_DIR/itams_app_$DATE.tar.gz /opt/itams
   
   # Backup environment file
   cp /opt/itams/.env.production $BACKUP_DIR/env_$DATE.backup
   
   # Remove old backups
   find $BACKUP_DIR -name "itams_app_*.tar.gz" -mtime +30 -delete
   ```

## Health Checks

### Application Health Endpoint

ITAMS includes a built-in health check endpoint:

```bash
curl -f http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2023-01-01T00:00:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "api": "ok"
  }
}
```

### Load Balancer Health Check

Configure your load balancer to check the health endpoint:

- **Path**: `/api/health`
- **Method**: GET
- **Expected Response**: HTTP 200 with JSON containing `"status": "ok"`

## Scaling Considerations

### Horizontal Scaling

For high-traffic environments:

1. **Multiple Application Instances**
   ```bash
   pm2 start ecosystem.config.js -i max
   ```

2. **Load Balancer Configuration**
   ```nginx
   upstream itams_app {
       server 127.0.0.1:3001;
       server 127.0.0.1:3002;
       server 127.0.0.1:3003;
   }
   
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://itams_app;
           # ... proxy configuration
       }
   }
   ```

### Database Scaling

1. **Connection Pooling**
   ```env
   # In .env file
   DATABASE_POOL_MIN=5
   DATABASE_POOL_MAX=20
   ```

2. **Read Replicas**
   - Configure PostgreSQL read replicas
   - Update application to use read replicas for SELECT queries

## Security Hardening

### Firewall Configuration

```bash
# Ubuntu/Debian with UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### File Permissions

```bash
# Set proper ownership
sudo chown -R itams:itams /opt/itams

# Set secure permissions
sudo chmod -R 755 /opt/itams
sudo chmod 600 /opt/itams/.env.production
```

### Security Headers

Ensure Nginx configuration includes security headers as shown in the reverse proxy configuration above.

## Troubleshooting

### Common Deployment Issues

#### 1. Database Connection Failed
- Check DATABASE_URL in environment file
- Verify PostgreSQL is running
- Check firewall settings
- Test connection manually:
  ```bash
  psql $DATABASE_URL
  ```

#### 2. Redis Connection Failed
- Check REDIS_URL in environment file
- Verify Redis is running
- Test connection:
  ```bash
  redis-cli -u $REDIS_URL ping
  ```

#### 3. Application Not Starting
- Check PM2 logs: `pm2 logs itams`
- Verify all environment variables are set
- Check file permissions
- Review system resources

#### 4. SSL Certificate Issues
- Verify certificate paths are correct
- Check certificate expiration dates
- Test certificate installation:
  ```bash
  openssl x509 -in /path/to/certificate.crt -text -noout
  ```

### Log Locations

- **Application Logs**: `/opt/itams/.pm2/logs/`
- **Database Logs**: `/var/log/postgresql/`
- **Redis Logs**: `/var/log/redis/`
- **Nginx Logs**: `/var/log/nginx/`
- **System Logs**: `/var/log/syslog`

## Post-Deployment Tasks

### 1. Create Initial Admin User

```bash
# Run the admin user creation script
npm run create-admin
```

### 2. Verify Installation

```bash
# Check application health
curl -f http://localhost:3000/api/health

# Check database connectivity
npx prisma studio

# Verify Redis connectivity
npm run test:redis-connection
```

### 3. Set Up Monitoring Alerts

Configure alerts for:
- Application downtime
- High CPU/memory usage
- Database connection issues
- Redis connectivity problems
- SSL certificate expiration

### 4. Document Deployment

Create deployment documentation including:
- Server specifications
- Environment variables
- Backup procedures
- Recovery procedures
- Contact information for support

## Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies**
   ```bash
   npm outdated
   npm update
   ```

2. **Database Maintenance**
   ```bash
   # Vacuum database
   psql -U itams_user -d itams_db -c "VACUUM ANALYZE;"
   
   # Check for issues
   psql -U itams_user -d itams_db -c "SELECT * FROM pg_stat_user_tables;"
   ```

3. **System Updates**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   ```

4. **Log Rotation**
   Ensure log rotation is working properly and disk space is sufficient.

## Conclusion

This deployment guide provides a comprehensive approach to deploying ITAMS in production environments. By following these instructions and best practices, you can ensure a secure, reliable, and scalable deployment of the IT Asset Management System.

Regular monitoring, backups, and maintenance are essential for long-term success. Always test deployment procedures in a staging environment before applying them to production systems.