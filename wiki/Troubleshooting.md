# Troubleshooting Guide

This document provides comprehensive guidance for troubleshooting common issues with the IT Asset Management System (ITAMS), including diagnostic procedures, solutions, and preventive measures.

## Common Issues and Solutions

### Database Connection Issues

#### Symptom: Application fails to start or database operations fail with connection errors

**Diagnostic Steps:**
1. Check if PostgreSQL service is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Verify database connection parameters:
   ```bash
   # Test connection with psql
   psql $DATABASE_URL
   
   # Or with individual parameters
   psql -h localhost -p 5432 -U itams_user -d itams_db
   ```

3. Check database logs:
   ```bash
   # Ubuntu/Debian
   sudo tail -f /var/log/postgresql/postgresql-17-main.log
   
   # CentOS/RHEL
   sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
   ```

**Solutions:**
1. Start PostgreSQL service:
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. Verify database credentials in `.env` file:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   ```

3. Check firewall settings:
   ```bash
   # Allow PostgreSQL connections
   sudo ufw allow 5432/tcp
   ```

4. Restart database service:
   ```bash
   sudo systemctl restart postgresql
   ```

#### Symptom: "Connection terminated unexpectedly" or "Client has encountered a connection error"

**Diagnostic Steps:**
1. Check connection pool settings:
   ```bash
   # In your .env file, verify:
   DATABASE_POOL_MIN=2
   DATABASE_POOL_MAX=10
   ```

2. Monitor active connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

**Solutions:**
1. Increase connection pool limits:
   ```env
   DATABASE_POOL_MIN=5
   DATABASE_POOL_MAX=20
   ```

2. Optimize long-running queries:
   ```sql
   -- Check for long-running queries
   SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
   FROM pg_stat_activity 
   WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
   ```

### Redis Connection Issues

#### Symptom: Cache operations fail or application performance is degraded

**Diagnostic Steps:**
1. Check if Redis service is running:
   ```bash
   sudo systemctl status redis
   ```

2. Test Redis connection:
   ```bash
   redis-cli -u $REDIS_URL ping
   # Should return "PONG"
   ```

3. Check Redis logs:
   ```bash
   sudo tail -f /var/log/redis/redis-server.log
   ```

**Solutions:**
1. Start Redis service:
   ```bash
   sudo systemctl start redis
   sudo systemctl enable redis
   ```

2. Verify Redis URL in `.env` file:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```

3. Check Redis memory usage:
   ```bash
   redis-cli info memory
   ```

4. Restart Redis service:
   ```bash
   sudo systemctl restart redis
   ```

#### Symptom: "Redis connection timeout" or "Maximum number of clients reached"

**Diagnostic Steps:**
1. Check Redis client connections:
   ```bash
   redis-cli info clients
   ```

2. Monitor Redis performance:
   ```bash
   redis-cli info stats
   ```

**Solutions:**
1. Increase Redis client limit:
   ```bash
   # In redis.conf
   maxclients 10000
   ```

2. Optimize cache usage:
   ```typescript
   // Implement proper cache expiration
   await redisCache.set('key', 'value', 300); // 5 minutes TTL
   ```

### Authentication Issues

#### Symptom: Users cannot log in or receive "Invalid credentials" errors

**Diagnostic Steps:**
1. Check JWT secret configuration:
   ```bash
   echo $JWT_SECRET
   ```

2. Verify user account status:
   ```bash
   # Check if user exists and is active
   psql $DATABASE_URL -c "SELECT id, email, active FROM \"User\" WHERE email = 'user@example.com';"
   ```

3. Check for account lockouts:
   ```sql
   SELECT id, email, failed_login_attempts, locked_until 
   FROM "User" 
   WHERE email = 'user@example.com';
   ```

**Solutions:**
1. Verify JWT secret in `.env`:
   ```env
   JWT_SECRET="your-very-secure-jwt-secret-here"
   ```

2. Reset user password:
   ```bash
   npm run reset-password -- --email user@example.com
   ```

3. Unlock locked accounts:
   ```sql
   UPDATE "User" 
   SET failed_login_attempts = 0, locked_until = NULL 
   WHERE email = 'user@example.com';
   ```

#### Symptom: "Token expired" or "Invalid token" errors

**Diagnostic Steps:**
1. Check JWT expiration settings:
   ```env
   JWT_EXPIRES_IN=24h
   ```

2. Verify system time synchronization:
   ```bash
   timedatectl status
   ```

**Solutions:**
1. Adjust token expiration:
   ```env
   JWT_EXPIRES_IN=48h
   ```

2. Synchronize system time:
   ```bash
   sudo timedatectl set-ntp true
   ```

### Asset Management Issues

#### Symptom: Assets fail to load or display incorrectly

**Diagnostic Steps:**
1. Check browser console for errors:
   - Open Developer Tools (F12)
   - Check Console and Network tabs

2. Verify API endpoint responses:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/assets/pc
   ```

3. Check database query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM "PC" LIMIT 20;
   ```

**Solutions:**
1. Clear browser cache and cookies:
   - Ctrl+Shift+Delete in most browsers
   - Select "All time" and check "Cookies and other site data" and "Cached images and files"

2. Restart application:
   ```bash
   pm2 restart itams
   ```

3. Optimize database queries:
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX IF NOT EXISTS "PC_status_idx" ON "PC"("status");
   CREATE INDEX IF NOT EXISTS "PC_userName_idx" ON "PC"("userName");
   ```

#### Symptom: Excel import/export fails

**Diagnostic Steps:**
1. Check file upload limits:
   ```bash
   # Check Nginx client max body size
   grep client_max_body_size /etc/nginx/nginx.conf
   ```

2. Verify template files exist:
   ```bash
   ls -la /opt/itams/templates/
   ```

3. Check Excel processing logs:
   ```bash
   pm2 logs itams | grep excel
   ```

**Solutions:**
1. Increase upload limits:
   ```nginx
   # In nginx.conf
   client_max_body_size 50M;
   ```

2. Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

3. Verify template files:
   ```bash
   # Ensure template files exist and have proper permissions
   sudo chown -R itams:itams /opt/itams/templates/
   sudo chmod -R 644 /opt/itams/templates/
   ```

### Performance Issues

#### Symptom: Slow page loads or API responses

**Diagnostic Steps:**
1. Monitor system resources:
   ```bash
   htop
   iotop
   ```

2. Check application logs for slow queries:
   ```bash
   pm2 logs itams | grep duration
   ```

3. Analyze database performance:
   ```sql
   -- Check for slow queries
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC 
   LIMIT 10;
   ```

**Solutions:**
1. Optimize database indexes:
   ```sql
   -- Add composite indexes for common query patterns
   CREATE INDEX IF NOT EXISTS "PC_tenant_status_idx" ON "PC"("tenantId", "status");
   ```

2. Increase application resources:
   ```bash
   # Scale PM2 processes
   pm2 scale itams 4
   ```

3. Implement query caching:
   ```typescript
   // Use Redis for frequently accessed data
   const cachedData = await redisCache.get(cacheKey);
   if (!cachedData) {
     const data = await db.asset.findMany(queryParams);
     await redisCache.set(cacheKey, data, 300); // 5 minutes
     return data;
   }
   return cachedData;
   ```

#### Symptom: High memory usage

**Diagnostic Steps:**
1. Monitor memory usage:
   ```bash
   pm2 monit
   ```

2. Check for memory leaks:
   ```bash
   # Generate heap dump
   pm2 trigger itams gc
   ```

**Solutions:**
1. Restart application to free memory:
   ```bash
   pm2 restart itams
   ```

2. Optimize memory usage:
   ```typescript
   // Process data in chunks instead of loading everything into memory
   const batchSize = 100;
   for (let i = 0; i < totalItems; i += batchSize) {
     const batch = await db.asset.findMany({
       skip: i,
       take: batchSize
     });
     // Process batch
   }
   ```

### Security Issues

#### Symptom: Unauthorized access attempts or security alerts

**Diagnostic Steps:**
1. Check security logs:
   ```bash
   grep -i "security\|unauthorized\|failed" /var/log/itams/security.log
   ```

2. Monitor failed login attempts:
   ```sql
   SELECT email, failed_login_attempts, locked_until 
   FROM "User" 
   WHERE failed_login_attempts > 0 
   ORDER BY failed_login_attempts DESC;
   ```

3. Check firewall logs:
   ```bash
   sudo tail -f /var/log/ufw.log
   ```

**Solutions:**
1. Implement rate limiting:
   ```typescript
   // In API middleware
   const rateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

2. Strengthen password requirements:
   ```env
   PASSWORD_MIN_LENGTH=12
   ```

3. Review user permissions:
   ```sql
   SELECT u.email, r.name as role 
   FROM "User" u 
   JOIN "Role" r ON u."roleId" = r.id;
   ```

### Deployment Issues

#### Symptom: Application fails to start after deployment

**Diagnostic Steps:**
1. Check PM2 logs:
   ```bash
   pm2 logs itams
   ```

2. Verify environment variables:
   ```bash
   printenv | grep ITAMS
   ```

3. Check file permissions:
   ```bash
   ls -la /opt/itams/
   ```

**Solutions:**
1. Check for missing dependencies:
   ```bash
   npm install --production
   ```

2. Verify build process:
   ```bash
   npm run build:production
   ```

3. Check file permissions:
   ```bash
   sudo chown -R itams:itams /opt/itams/
   sudo chmod -R 755 /opt/itams/
   ```

#### Symptom: Environment-specific issues

**Diagnostic Steps:**
1. Verify environment configuration:
   ```bash
   cat .env.production
   ```

2. Check for environment-specific code:
   ```bash
   grep -r "process.env.NODE_ENV" src/
   ```

**Solutions:**
1. Ensure correct environment file is used:
   ```bash
   NODE_ENV=production npm start
   ```

2. Validate environment variables:
   ```typescript
   // In application startup
   if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL environment variable is required');
   }
   ```

## Diagnostic Tools

### System Monitoring

```bash
# CPU and memory monitoring
htop

# Disk I/O monitoring
iotop

# Network monitoring
iftop

# Process monitoring
ps aux | grep itams

# System logs
journalctl -u itams -f
```

### Database Diagnostics

```bash
# PostgreSQL connection statistics
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity;"

# Database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Table sizes
psql $DATABASE_URL -c "
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Cache hit ratio
psql $DATABASE_URL -c "
SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;"
```

### Application Diagnostics

```bash
# PM2 process information
pm2 list
pm2 show itams

# Application logs
pm2 logs itams

# Application monitoring
pm2 monit

# Restart application
pm2 restart itams

# Reload application
pm2 reload itams
```

### Network Diagnostics

```bash
# Check port connectivity
netstat -tulpn | grep :3000

# Test HTTP connectivity
curl -v http://localhost:3000/api/health

# Check DNS resolution
nslookup your-domain.com

# Test SSL certificate
openssl s_client -connect your-domain.com:443
```

## Log Analysis

### Common Log Patterns

```bash
# Search for errors
grep -i "error\|exception\|fail" /var/log/itams/application.log

# Search for warnings
grep -i "warn\|warning" /var/log/itams/application.log

# Search for specific components
grep "component:database" /var/log/itams/application.log

# Search for user activities
grep "userId:" /var/log/itams/application.log

# Search for security events
grep -i "security\|unauthorized\|login" /var/log/itams/security.log
```

### Log Rotation Issues

```bash
# Check log rotation configuration
cat /etc/logrotate.d/itams

# Force log rotation
sudo logrotate -f /etc/logrotate.d/itams

# Check disk space
df -h /var/log/
```

## Preventive Measures

### Regular Maintenance

1. **Database Maintenance**
   ```bash
   # Regular vacuum and analyze
   psql $DATABASE_URL -c "VACUUM ANALYZE;"
   
   # Check for table bloat
   psql $DATABASE_URL -c "
   SELECT schemaname, tablename, 
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
   ```

2. **System Updates**
   ```bash
   # Ubuntu/Debian
   sudo apt update && sudo apt upgrade -y
   
   # CentOS/RHEL
   sudo yum update -y
   ```

3. **Security Updates**
   ```bash
   # Check for security vulnerabilities
   npm audit
   
   # Update dependencies
   npm update
   ```

### Monitoring and Alerts

1. **Set up health checks**
   ```bash
   # Create health check script
   #!/bin/bash
   curl -f http://localhost:3000/api/health > /dev/null 2>&1
   if [ $? -ne 0 ]; then
     echo "ITAMS health check failed" | mail -s "ITAMS Alert" admin@your-domain.com
   fi
   ```

2. **Schedule regular checks**
   ```bash
   # Add to crontab
   crontab -e
   # Check every 5 minutes
   */5 * * * * /opt/itams/scripts/health-check.sh
   ```

## Emergency Procedures

### Application Recovery

1. **Immediate Restart**
   ```bash
   pm2 restart itams
   ```

2. **Rollback Deployment**
   ```bash
   # If using deployment scripts
   /opt/itams/scripts/rollback.sh
   ```

3. **Database Recovery**
   ```bash
   # Restore from latest backup
   /opt/itams/scripts/restore-database.sh /backup/database/latest.backup
   ```

### Data Recovery

1. **Restore from Backup**
   ```bash
   # Stop application
   pm2 stop itams
   
   # Restore database
   /opt/itams/scripts/restore-database.sh /backup/database/itams_db_20231201.backup
   
   # Start application
   pm2 start itams
   ```

2. **Point-in-Time Recovery**
   ```bash
   # Configure PostgreSQL for point-in-time recovery
   # This requires WAL archiving to be configured
   ```

## Best Practices

### 1. Proactive Monitoring

- Set up comprehensive monitoring for all system components
- Implement alerting for critical issues
- Regularly review monitoring dashboards
- Test alerting systems periodically

### 2. Regular Maintenance

- Schedule regular database maintenance
- Keep system and application dependencies updated
- Review and rotate logs regularly
- Test backup and recovery procedures

### 3. Documentation

- Document all troubleshooting procedures
- Maintain an incident response plan
- Keep configuration documentation up to date
- Record solutions to recurring issues

### 4. Training

- Train team members on troubleshooting procedures
- Conduct regular incident response drills
- Share knowledge about common issues and solutions
- Stay updated on new troubleshooting techniques

## Conclusion

Effective troubleshooting requires a systematic approach, comprehensive monitoring, and thorough documentation. By following the procedures and best practices outlined in this guide, you can quickly identify and resolve issues with the ITAMS application, minimize downtime, and maintain system reliability.

Regular review and updating of troubleshooting procedures will help ensure their effectiveness as the system evolves and new challenges emerge.