# Backup and Recovery Guide

This document provides comprehensive guidance on backing up and recovering the IT Asset Management System (ITAMS), ensuring data protection and business continuity.

## Backup Strategy

ITAMS implements a comprehensive backup strategy that includes:

1. **Database Backups** - Complete database snapshots
2. **Application Backups** - Application code and configuration
3. **File Backups** - Uploaded files and templates
4. **Configuration Backups** - Environment and system configuration

## Database Backup

### PostgreSQL Backup

#### Automated Backup Script

Create a comprehensive backup script:

```bash
#!/bin/bash
# backup-database.sh

# Configuration
BACKUP_DIR="/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="itams_db"
DB_USER="itams_user"
DB_PASSWORD="secure_password"

# Export password for pg_dump
export PGPASSWORD=$DB_PASSWORD

# Create backup
echo "Creating database backup..."
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  --file=$BACKUP_DIR/itams_db_$DATE.backup

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Database backup created successfully: $BACKUP_DIR/itams_db_$DATE.backup"
  
  # Compress the backup
  gzip $BACKUP_DIR/itams_db_$DATE.backup
  
  # Remove backups older than retention period
  echo "Cleaning up old backups..."
  find $BACKUP_DIR -name "itams_db_*.backup.gz" -mtime +$RETENTION_DAYS -delete
  
  # Log success
  echo "$(date): Database backup completed successfully" >> /var/log/itams/backup.log
else
  echo "Database backup failed!"
  echo "$(date): Database backup failed" >> /var/log/itams/backup.log
  exit 1
fi

# Unset password
unset PGPASSWORD
```

#### Incremental Backup Script

For large databases, implement incremental backups:

```bash
#!/bin/bash
# incremental-backup.sh

# Configuration
BACKUP_DIR="/backup/database"
DATE=$(date +%Y%m%d_%H%M%S)
WAL_ARCHIVE_DIR="/backup/wal"

# Create backup directory
mkdir -p $BACKUP_DIR
mkdir -p $WAL_ARCHIVE_DIR

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="itams_db"
DB_USER="itams_user"
DB_PASSWORD="secure_password"

# Export password
export PGPASSWORD=$DB_PASSWORD

# Create base backup
echo "Creating base backup..."
pg_basebackup -h $DB_HOST -p $DB_PORT -U $DB_USER \
  --progress \
  --verbose \
  --checkpoint=fast \
  --wal-method=stream \
  --compress \
  --target-dir=$BACKUP_DIR/base_$DATE

if [ $? -eq 0 ]; then
  echo "Base backup created successfully"
  echo "$(date): Base backup completed successfully" >> /var/log/itams/backup.log
else
  echo "Base backup failed!"
  echo "$(date): Base backup failed" >> /var/log/itams/backup.log
  exit 1
fi

# Unset password
unset PGPASSWORD
```

### Backup Verification

Create a script to verify backup integrity:

```bash
#!/bin/bash
# verify-backup.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Verify backup file
pg_restore --list $BACKUP_FILE > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Backup file is valid: $BACKUP_FILE"
else
  echo "Backup file is corrupted: $BACKUP_FILE"
  exit 1
fi
```

## Application Backup

### Code and Configuration Backup

Create an application backup script:

```bash
#!/bin/bash
# backup-application.sh

# Configuration
APP_DIR="/opt/itams"
BACKUP_DIR="/backup/application"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Create application backup
echo "Creating application backup..."
tar -czf $BACKUP_DIR/itams_app_$DATE.tar.gz \
  -C $APP_DIR \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='logs' \
  .

if [ $? -eq 0 ]; then
  echo "Application backup created successfully: $BACKUP_DIR/itams_app_$DATE.tar.gz"
  
  # Remove old backups
  find $BACKUP_DIR -name "itams_app_*.tar.gz" -mtime +$RETENTION_DAYS -delete
  
  # Log success
  echo "$(date): Application backup completed successfully" >> /var/log/itams/backup.log
else
  echo "Application backup failed!"
  echo "$(date): Application backup failed" >> /var/log/itams/backup.log
  exit 1
fi
```

### Configuration Backup

Backup environment and configuration files:

```bash
#!/bin/bash
# backup-config.sh

# Configuration
APP_DIR="/opt/itams"
BACKUP_DIR="/backup/config"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=90

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration files
echo "Backing up configuration files..."
cp $APP_DIR/.env.production $BACKUP_DIR/env_$DATE.backup 2>/dev/null || true
cp $APP_DIR/ecosystem.config.js $BACKUP_DIR/ecosystem_$DATE.backup 2>/dev/null || true
cp $APP_DIR/nginx.conf $BACKUP_DIR/nginx_$DATE.backup 2>/dev/null || true

# Backup package.json for version tracking
cp $APP_DIR/package.json $BACKUP_DIR/package_$DATE.json

if [ $? -eq 0 ]; then
  echo "Configuration backup created successfully"
  
  # Remove old backups
  find $BACKUP_DIR -name "env_*.backup" -mtime +$RETENTION_DAYS -delete
  find $BACKUP_DIR -name "ecosystem_*.backup" -mtime +$RETENTION_DAYS -delete
  find $BACKUP_DIR -name "nginx_*.backup" -mtime +$RETENTION_DAYS -delete
  find $BACKUP_DIR -name "package_*.json" -mtime +$RETENTION_DAYS -delete
  
  # Log success
  echo "$(date): Configuration backup completed successfully" >> /var/log/itams/backup.log
else
  echo "Configuration backup failed!"
  echo "$(date): Configuration backup failed" >> /var/log/itams/backup.log
  exit 1
fi
```

## File Backup

### Uploaded Files Backup

Backup user-uploaded files and templates:

```bash
#!/bin/bash
# backup-files.sh

# Configuration
APP_DIR="/opt/itams"
BACKUP_DIR="/backup/files"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploaded files
echo "Backing up uploaded files..."
if [ -d "$APP_DIR/public/uploads" ]; then
  tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR/public uploads
fi

# Backup templates
echo "Backing up templates..."
if [ -d "$APP_DIR/templates" ]; then
  tar -czf $BACKUP_DIR/templates_$DATE.tar.gz -C $APP_DIR templates
fi

if [ $? -eq 0 ]; then
  echo "File backup created successfully"
  
  # Remove old backups
  find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete
  find $BACKUP_DIR -name "templates_*.tar.gz" -mtime +$RETENTION_DAYS -delete
  
  # Log success
  echo "$(date): File backup completed successfully" >> /var/log/itams/backup.log
else
  echo "File backup failed!"
  echo "$(date): File backup failed" >> /var/log/itams/backup.log
  exit 1
fi
```

## Backup Scheduling

### Cron Job Configuration

Set up automated backup scheduling:

```bash
# Edit crontab
crontab -e

# Add backup schedules
# Daily database backup at 2 AM
0 2 * * * /opt/itams/scripts/backup-database.sh

# Weekly application backup on Sundays at 3 AM
0 3 * * 0 /opt/itams/scripts/backup-application.sh

# Daily configuration backup at 1 AM
0 1 * * * /opt/itams/scripts/backup-config.sh

# Daily file backup at 4 AM
0 4 * * * /opt/itams/scripts/backup-files.sh

# Weekly backup verification on Saturdays at 5 AM
0 5 * * 6 /opt/itams/scripts/verify-backup.sh /backup/database/itams_db_$(date +\%Y\%m\%d).backup.gz
```

### Systemd Timer (Alternative)

For systems using systemd:

```ini
# /etc/systemd/system/itams-backup.service
[Unit]
Description=ITAMS Database Backup
Wants=itams-backup.timer

[Service]
Type=oneshot
ExecStart=/opt/itams/scripts/backup-database.sh
User=itams
Group=itams

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/itams-backup.timer
[Unit]
Description=Run ITAMS backup daily
Requires=itams-backup.service

[Timer]
Unit=itams-backup.service
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable the timer:
```bash
sudo systemctl enable itams-backup.timer
sudo systemctl start itams-backup.timer
```

## Offsite Backup

### Cloud Storage Backup

Backup to cloud storage (AWS S3 example):

```bash
#!/bin/bash
# backup-to-s3.sh

# Configuration
BACKUP_DIR="/backup"
S3_BUCKET="itams-backups"
AWS_PROFILE="itams-backup"

# Sync backups to S3
echo "Syncing backups to S3..."
aws s3 sync $BACKUP_DIR s3://$S3_BUCKET --profile $AWS_PROFILE

if [ $? -eq 0 ]; then
  echo "Backups synced to S3 successfully"
  echo "$(date): S3 sync completed successfully" >> /var/log/itams/backup.log
else
  echo "S3 sync failed!"
  echo "$(date): S3 sync failed" >> /var/log/itams/backup.log
  exit 1
fi
```

### Encrypted Backup

Encrypt backups for security:

```bash
#!/bin/bash
# encrypted-backup.sh

# Configuration
BACKUP_DIR="/backup"
ENCRYPTED_DIR="/backup/encrypted"
DATE=$(date +%Y%m%d_%H%M%S)
ENCRYPTION_KEY="your-encryption-key"

# Create encrypted backup directory
mkdir -p $ENCRYPTED_DIR

# Encrypt database backup
echo "Encrypting database backup..."
gpg --batch --yes --passphrase $ENCRYPTION_KEY \
  --cipher-algo AES256 \
  --compress-algo 2 \
  --symmetric \
  --output $ENCRYPTED_DIR/itams_db_$DATE.backup.gpg \
  $BACKUP_DIR/database/itams_db_$DATE.backup

if [ $? -eq 0 ]; then
  echo "Backup encrypted successfully"
  echo "$(date): Backup encryption completed successfully" >> /var/log/itams/backup.log
else
  echo "Backup encryption failed!"
  echo "$(date): Backup encryption failed" >> /var/log/itams/backup.log
  exit 1
fi
```

## Recovery Procedures

### Database Recovery

#### Full Database Recovery

```bash
#!/bin/bash
# restore-database.sh

# Configuration
BACKUP_FILE=$1
DB_NAME="itams_db"
DB_USER="itams_user"
DB_PASSWORD="secure_password"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Export password
export PGPASSWORD=$DB_PASSWORD

# Drop and recreate database
echo "Dropping existing database..."
dropdb -U $DB_USER $DB_NAME

echo "Creating new database..."
createdb -U $DB_USER $DB_NAME

# Restore database
echo "Restoring database from backup..."
pg_restore -U $DB_USER -d $DB_NAME --verbose $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Database restore completed successfully"
  
  # Run database migrations
  echo "Running database migrations..."
  cd /opt/itams
  npx prisma migrate deploy
  
  echo "$(date): Database restore completed successfully" >> /var/log/itams/restore.log
else
  echo "Database restore failed!"
  echo "$(date): Database restore failed" >> /var/log/itams/restore.log
  exit 1
fi

# Unset password
unset PGPASSWORD
```

#### Point-in-Time Recovery

For PostgreSQL point-in-time recovery:

1. **Configure WAL Archiving**
```postgresql
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backup/wal/%f'
```

2. **Recovery Configuration**
```bash
# Create recovery.conf
echo "restore_command = 'cp /backup/wal/%f %p'" > /var/lib/postgresql/data/recovery.conf
echo "recovery_target_time = '2023-01-01 12:00:00'" >> /var/lib/postgresql/data/recovery.conf
```

### Application Recovery

#### Complete Application Recovery

```bash
#!/bin/bash
# restore-application.sh

# Configuration
BACKUP_FILE=$1
APP_DIR="/opt/itams"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Stop application
echo "Stopping application..."
pm2 stop itams

# Restore application files
echo "Restoring application files..."
tar -xzf $BACKUP_FILE -C /

# Install dependencies
echo "Installing dependencies..."
cd $APP_DIR
npm ci --production

# Build application
echo "Building application..."
npm run build:production

# Start application
echo "Starting application..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
  echo "Application restore completed successfully"
  echo "$(date): Application restore completed successfully" >> /var/log/itams/restore.log
else
  echo "Application restore failed!"
  echo "$(date): Application restore failed" >> /var/log/itams/restore.log
  exit 1
fi
```

### File Recovery

#### Uploaded Files Recovery

```bash
#!/bin/bash
# restore-files.sh

# Configuration
BACKUP_FILE=$1
APP_DIR="/opt/itams"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Stop application
echo "Stopping application..."
pm2 stop itams

# Restore files
echo "Restoring files..."
tar -xzf $BACKUP_FILE -C $APP_DIR/public

# Set proper permissions
chown -R itams:itams $APP_DIR/public/uploads

# Start application
echo "Starting application..."
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
  echo "File restore completed successfully"
  echo "$(date): File restore completed successfully" >> /var/log/itams/restore.log
else
  echo "File restore failed!"
  echo "$(date): File restore failed" >> /var/log/itams/restore.log
  exit 1
fi
```

## Disaster Recovery Plan

### Recovery Time Objective (RTO)

- **Database**: 4 hours
- **Application**: 2 hours
- **Files**: 1 hour

### Recovery Point Objective (RPO)

- **Database**: 24 hours
- **Application**: 7 days
- **Files**: 24 hours

### Recovery Steps

1. **Assessment**
   - Identify the cause and extent of data loss
   - Determine which backups are available and valid
   - Assess system availability

2. **Preparation**
   - Set up recovery environment
   - Verify backup integrity
   - Gather necessary credentials and keys

3. **Execution**
   - Restore database from most recent backup
   - Restore application code and configuration
   - Restore user files and templates
   - Verify system functionality

4. **Validation**
   - Test application functionality
   - Verify data integrity
   - Confirm user access

5. **Communication**
   - Notify stakeholders of recovery status
   - Document the incident and recovery process
   - Update backup procedures if needed

## Backup Monitoring

### Health Checks

Create backup health check script:

```bash
#!/bin/bash
# backup-health-check.sh

# Configuration
BACKUP_DIR="/backup"
HEALTH_LOG="/var/log/itams/backup-health.log"

# Check if backups exist
echo "Checking backup health..."

# Database backup check
DB_BACKUP_COUNT=$(find $BACKUP_DIR/database -name "itams_db_*.backup.gz" -mtime -1 | wc -l)
if [ $DB_BACKUP_COUNT -eq 0 ]; then
  echo "ERROR: No recent database backups found!" | tee -a $HEALTH_LOG
  # Send alert
else
  echo "OK: Recent database backups found ($DB_BACKUP_COUNT)" | tee -a $HEALTH_LOG
fi

# Application backup check
APP_BACKUP_COUNT=$(find $BACKUP_DIR/application -name "itams_app_*.tar.gz" -mtime -7 | wc -l)
if [ $APP_BACKUP_COUNT -eq 0 ]; then
  echo "ERROR: No recent application backups found!" | tee -a $HEALTH_LOG
else
  echo "OK: Recent application backups found ($APP_BACKUP_COUNT)" | tee -a $HEALTH_LOG
fi

# File backup check
FILE_BACKUP_COUNT=$(find $BACKUP_DIR/files -name "uploads_*.tar.gz" -mtime -1 | wc -l)
if [ $FILE_BACKUP_COUNT -eq 0 ]; then
  echo "ERROR: No recent file backups found!" | tee -a $HEALTH_LOG
else
  echo "OK: Recent file backups found ($FILE_BACKUP_COUNT)" | tee -a $HEALTH_LOG
fi
```

### Alerting

Set up backup failure alerts:

```bash
#!/bin/bash
# backup-alert.sh

ALERT_EMAIL="admin@your-domain.com"
LOG_FILE="/var/log/itams/backup.log"

# Check for backup failures in the last hour
grep -i "failed" $LOG_FILE | tail -1 > /tmp/backup-alert.txt

if [ -s /tmp/backup-alert.txt ]; then
  # Send alert email
  mail -s "ITAMS Backup Failure Alert" $ALERT_EMAIL < /tmp/backup-alert.txt
  echo "Alert sent for backup failure"
fi
```

## Testing Recovery Procedures

### Regular Recovery Testing

Schedule monthly recovery tests:

```bash
#!/bin/bash
# test-recovery.sh

# Configuration
TEST_DIR="/tmp/itams-recovery-test"
BACKUP_DIR="/backup"

echo "Starting recovery test..."

# Create test environment
mkdir -p $TEST_DIR

# Test database recovery
echo "Testing database recovery..."
cp $(ls -t $BACKUP_DIR/database/itams_db_*.backup.gz | head -1) $TEST_DIR/
gunzip $TEST_DIR/itams_db_*.backup.gz

# Verify backup can be restored (without actually restoring)
pg_restore --list $TEST_DIR/itams_db_*.backup > /dev/null

if [ $? -eq 0 ]; then
  echo "Database recovery test PASSED"
else
  echo "Database recovery test FAILED"
fi

# Clean up
rm -rf $TEST_DIR

echo "Recovery test completed"
```

## Backup Security

### Access Control

- Restrict backup directory access to authorized personnel only
- Use encrypted backups for sensitive data
- Implement role-based access for backup systems

### Encryption

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup-file.tar.gz

# Decrypt backup
gpg --decrypt backup-file.tar.gz.gpg > backup-file.tar.gz
```

### Audit Trail

Log all backup and recovery operations:

```bash
# Log backup operations
echo "$(date): User $USER performed database backup" >> /var/log/itams/backup-audit.log

# Log recovery operations
echo "$(date): User $USER performed database recovery" >> /var/log/itams/recovery-audit.log
```

## Compliance Considerations

### Data Retention

- Database backups: 30 days
- Application backups: 90 days
- Configuration backups: 180 days
- File backups: 30 days

### Audit Requirements

- Maintain backup logs for compliance audits
- Document all recovery procedures
- Track backup success/failure rates
- Report on backup coverage

## Troubleshooting

### Common Backup Issues

#### 1. Insufficient Disk Space
```bash
# Check disk space
df -h /backup

# Clean up old backups
find /backup -name "*.backup" -mtime +30 -delete
```

#### 2. Database Connection Issues
```bash
# Test database connection
psql -U itams_user -d itams_db -c "SELECT version();"

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### 3. Permission Issues
```bash
# Check backup directory permissions
ls -la /backup

# Set proper permissions
sudo chown -R itams:itams /backup
sudo chmod -R 755 /backup
```

### Recovery Issues

#### 1. Corrupted Backup Files
```bash
# Verify backup integrity
pg_restore --list backup-file.backup

# Check file integrity
md5sum backup-file.backup
```

#### 2. Incompatible Database Versions
```bash
# Check PostgreSQL versions
psql --version
pg_dump --version
```

## Best Practices

### Backup Best Practices

1. **Regular Testing**: Test backups regularly to ensure they can be restored
2. **Multiple Copies**: Keep multiple copies of backups in different locations
3. **Encryption**: Encrypt sensitive backup data
4. **Monitoring**: Monitor backup processes and alert on failures
5. **Documentation**: Document all backup and recovery procedures
6. **Retention**: Implement proper backup retention policies
7. **Security**: Secure backup storage and access controls
8. **Automation**: Automate backup processes to reduce human error

### Recovery Best Practices

1. **Prioritize Critical Data**: Restore critical systems first
2. **Validate Before Production**: Test restored data before going live
3. **Communicate**: Keep stakeholders informed during recovery
4. **Document**: Document the recovery process for future reference
5. **Learn**: Analyze recovery incidents to improve procedures
6. **Practice**: Regularly practice recovery procedures
7. **Plan**: Maintain an up-to-date disaster recovery plan
8. **Train**: Train staff on recovery procedures

## Conclusion

A comprehensive backup and recovery strategy is essential for protecting ITAMS data and ensuring business continuity. By implementing the procedures and best practices outlined in this guide, you can minimize the risk of data loss and ensure rapid recovery in the event of system failures or disasters.

Regular testing, monitoring, and updating of backup procedures will help maintain their effectiveness and reliability over time.