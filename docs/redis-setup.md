# Redis Setup and Troubleshooting Guide

## Overview

This document explains how to set up and troubleshoot Redis for the IT Asset Management System (ITAMS).

## Prerequisites

- Ubuntu 20.04 or later
- Node.js 18+
- npm package manager

## Installation

### Automatic Installation (Recommended)

The setup script will automatically install Redis:

```bash
sudo ./scripts/setup-ubuntu.sh
```

### Manual Installation

If you need to install Redis manually:

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server

# Enable Redis to start on boot
sudo systemctl enable redis-server
```

## Configuration

### Environment Variables

The application expects the following environment variables:

- `REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)

These are automatically configured in the `ecosystem.config.js` file.

### Verifying Redis Installation

To verify Redis is running:

```bash
# Check if Redis service is active
sudo systemctl status redis-server

# Test Redis connectivity
redis-cli ping
```

You should see `PONG` as the response.

## Troubleshooting

### Common Issues

1. **Redis not starting**
   ```bash
   # Check Redis service status
   sudo systemctl status redis-server
   
   # Check Redis logs
   sudo journalctl -u redis-server
   
   # Try to start Redis manually
   sudo systemctl start redis-server
   ```

2. **Connection refused errors**
   ```bash
   # Check if Redis is listening on the correct port
   netstat -tlnp | grep 6379
   
   # Check Redis configuration
   sudo nano /etc/redis/redis.conf
   ```

3. **Application not connecting to Redis**
   ```bash
   # Test Redis connection with the application's test script
   npm run test:redis
   
   # Check application logs for Redis-related errors
   pm2 logs itams
   ```

### Testing Redis Connectivity

You can test Redis connectivity with the provided test script:

```bash
npm run test:redis
```

This will:
1. Connect to Redis using the configured URL
2. Set a test key-value pair
3. Retrieve the value
4. Clean up and disconnect

### Debugging Cache Issues

To debug cache issues:

1. **Enable verbose logging**
   ```bash
   # Set NODE_ENV to development for more detailed logs
   export NODE_ENV=development
   pm2 restart itams
   ```

2. **Check PM2 logs**
   ```bash
   pm2 logs itams
   ```

   Look for messages like:
   - "Redis Client Connected"
   - "Redis Client Ready"
   - "Cache hit for key: ..."
   - "Cache miss for key: ..."
   - "Cache set for key: ..."

3. **Manually inspect Redis**
   ```bash
   # Connect to Redis CLI
   redis-cli
   
   # List all keys
   KEYS *
   
   # Get a specific key
   GET "asset_list:PC:tenant-123:1:10:search-term:active"
   
   # Exit
   QUIT
   ```

## Performance Tuning

### Memory Configuration

Edit `/etc/redis/redis.conf` to adjust memory settings:

```bash
# Set maximum memory (example: 256MB)
maxmemory 268435456

# Set eviction policy
maxmemory-policy allkeys-lru
```

### Persistence

For production environments, consider enabling persistence:

```bash
# Enable RDB snapshots
save 900 1
save 300 10
save 60 10000

# Enable AOF
appendonly yes
```

After making changes, restart Redis:
```bash
sudo systemctl restart redis-server
```

## Security

### Password Protection

To secure Redis with a password:

1. Edit `/etc/redis/redis.conf`:
   ```bash
   requirepass your_secure_password
   ```

2. Update the application configuration in `ecosystem.config.js`:
   ```javascript
   env: {
     REDIS_URL: 'redis://:your_secure_password@localhost:6379'
   }
   ```

3. Restart Redis and the application:
   ```bash
   sudo systemctl restart redis-server
   pm2 restart itams
   ```

## Monitoring

### Built-in Monitoring

The application logs Redis connection status and cache operations. Check the logs with:

```bash
pm2 logs itams
```

### External Monitoring

For production environments, consider using:

1. **Redis CLI monitoring**
   ```bash
   redis-cli monitor
   ```

2. **Redis statistics**
   ```bash
   redis-cli info
   ```

3. **Third-party monitoring tools** like RedisInsight or Datadog

## Backup and Recovery

### Backup

To create a backup of Redis data:

```bash
redis-cli BGSAVE
```

The backup will be saved to the Redis data directory (usually `/var/lib/redis/dump.rdb`).

### Recovery

To restore from a backup:

1. Stop Redis:
   ```bash
   sudo systemctl stop redis-server
   ```

2. Replace the dump file:
   ```bash
   sudo cp /path/to/backup/dump.rdb /var/lib/redis/dump.rdb
   ```

3. Set proper permissions:
   ```bash
   sudo chown redis:redis /var/lib/redis/dump.rdb
   ```

4. Start Redis:
   ```bash
   sudo systemctl start redis-server
   ```