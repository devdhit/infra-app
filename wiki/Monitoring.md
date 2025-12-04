# Monitoring Guide

This document provides comprehensive guidance on monitoring the IT Asset Management System (ITAMS) to ensure optimal performance, availability, and security.

## Monitoring Overview

ITAMS implements a comprehensive monitoring strategy that includes:

1. **Application Performance Monitoring (APM)** - Track application performance and user experience
2. **Infrastructure Monitoring** - Monitor servers, databases, and network resources
3. **Log Monitoring** - Centralized log collection and analysis
4. **Security Monitoring** - Detect and respond to security threats
5. **Business Monitoring** - Track key business metrics and user activities

## Application Performance Monitoring

### PM2 Monitoring

ITAMS uses PM2 for process management and built-in monitoring:

```bash
# View application status
pm2 list

# Monitor application in real-time
pm2 monit

# View application logs
pm2 logs itams

# View specific log lines
pm2 logs itams --lines 100

# Flush logs
pm2 flush
```

### Custom Application Metrics

Create a metrics endpoint for application monitoring:

```typescript
// src/app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache } from '@/lib/redis-cache';

export async function GET() {
  try {
    // Application metrics
    const startTime = Date.now();
    
    // Database health check
    const dbStart = Date.now();
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    // Redis health check
    const redisStart = Date.now();
    await redisCache.get('health-check');
    const redisLatency = Date.now() - redisStart;
    
    // Asset counts
    const [pcCount, laptopCount, printerCount] = await Promise.all([
      db.pC.count(),
      db.laptop.count(),
      db.printer.count()
    ]);
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external
      },
      database: {
        latency: dbLatency,
        assets: {
          pc: pcCount,
          laptop: laptopCount,
          printer: printerCount
        }
      },
      cache: {
        latency: redisLatency
      },
      responseTime: Date.now() - startTime
    };
    
    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to collect metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
```

### Health Check Endpoint

Implement a comprehensive health check:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache } from '@/lib/redis-cache';

interface HealthCheckResult {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
    api: 'ok' | 'error';
  };
  details?: {
    database?: string;
    redis?: string;
    api?: string;
  };
}

export async function GET() {
  const result: HealthCheckResult = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      redis: 'ok',
      api: 'ok'
    }
  };
  
  // Database health check
  try {
    await db.$queryRaw`SELECT 1`;
  } catch (error) {
    result.services.database = 'error';
    result.status = 'error';
    result.details = {
      ...result.details,
      database: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
  
  // Redis health check
  try {
    await redisCache.get('health-check');
  } catch (error) {
    result.services.redis = 'error';
    result.status = 'error';
    result.details = {
      ...result.details,
      redis: error instanceof Error ? error.message : 'Redis connection failed'
    };
  }
  
  // API health check (simple endpoint test)
  try {
    // Test a simple API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ping`);
    if (!response.ok) {
      throw new Error('API endpoint not responding');
    }
  } catch (error) {
    result.services.api = 'error';
    result.status = 'error';
    result.details = {
      ...result.details,
      api: error instanceof Error ? error.message : 'API service unavailable'
    };
  }
  
  return NextResponse.json(result, { 
    status: result.status === 'ok' ? 200 : 500 
  });
}
```

## Infrastructure Monitoring

### System Metrics Collection

Create a system metrics collection script:

```bash
#!/bin/bash
# collect-system-metrics.sh

# Configuration
METRICS_DIR="/var/log/itams/metrics"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)

# Create metrics directory
mkdir -p $METRICS_DIR

# Collect system metrics
echo "[$TIMESTAMP] System Metrics:" >> $METRICS_DIR/system_$DATE.log

# CPU usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU Usage: $CPU_USAGE%" >> $METRICS_DIR/system_$DATE.log

# Memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')
echo "Memory Usage: $MEMORY_USAGE" >> $METRICS_DIR/system_$DATE.log

# Disk usage
DISK_USAGE=$(df -h / | awk 'NR==2{print $5}')
echo "Disk Usage: $DISK_USAGE" >> $METRICS_DIR/system_$DATE.log

# Network connections
CONNECTIONS=$(ss -t | wc -l)
echo "Active Connections: $CONNECTIONS" >> $METRICS_DIR/system_$DATE.log

# Process count
PROCESSES=$(ps aux | wc -l)
echo "Running Processes: $PROCESSES" >> $METRICS_DIR/system_$DATE.log

echo "---" >> $METRICS_DIR/system_$DATE.log
```

### Database Monitoring

Monitor PostgreSQL performance:

```sql
-- database-monitoring.sql

-- Monitor active connections
SELECT count(*) as active_connections FROM pg_stat_activity;

-- Monitor database size
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Monitor slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Monitor cache hit ratio
SELECT 
    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio
FROM pg_statio_user_tables;
```

### Redis Monitoring

Monitor Redis performance:

```bash
#!/bin/bash
# monitor-redis.sh

# Redis connection info
REDIS_HOST="localhost"
REDIS_PORT="6379"

echo "=== Redis Monitoring Report ==="
echo "Timestamp: $(date)"
echo

# Basic info
redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO | grep -E "redis_version|uptime_in_seconds|connected_clients|used_memory_human|used_memory_peak_human|mem_fragmentation_ratio"

echo
echo "=== Key Statistics ==="

# Database size
redis-cli -h $REDIS_HOST -p $REDIS_PORT DBSIZE

# Memory usage
redis-cli -h $REDIS_HOST -p $REDIS_PORT MEMORY USAGE

# Hit ratio
redis-cli -h $REDIS_HOST -p $REDIS_PORT INFO stats | grep -E "keyspace_hits|keyspace_misses"

echo
echo "=== Slow Log ==="
redis-cli -h $REDIS_HOST -p $REDIS_PORT SLOWLOG GET 10
```

## Log Monitoring

### Centralized Logging

Configure centralized logging with rsyslog:

```bash
# /etc/rsyslog.d/itams.conf

# Template for ITAMS logs
$template ITAMSLogFormat,"%TIMESTAMP% %HOSTNAME% %syslogtag%%msg%\n"
$template ITAMSFile,"/var/log/itams/%PROGRAMNAME%.log"

# Route ITAMS logs to separate files
:programname, isequal, "itams" {
  ?ITAMSFile
  stop
}

# Forward logs to remote syslog server
*.* @@remote-syslog-server:514
```

### Log Rotation

Configure log rotation:

```bash
# /etc/logrotate.d/itams

/var/log/itams/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 itams itams
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Structured Logging

Implement structured logging in the application:

```typescript
// src/lib/logger.ts
import winston from 'winston';
import path from 'path';

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.LOG_FORMAT === 'json' 
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
          if (stack) {
            logMessage += `\n${stack}`;
          }
          if (Object.keys(meta).length > 0) {
            logMessage += `\n${JSON.stringify(meta, null, 2)}`;
          }
          return logMessage;
        })
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info'
    }),
    
    // File transport for application logs
    new winston.transports.File({
      filename: path.join(logsDir, 'application.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // File transport for error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

export default logger;
```

### Log Analysis

Create log analysis scripts:

```bash
#!/bin/bash
# analyze-logs.sh

LOG_FILE="/var/log/itams/application.log"
DATE=$(date +%Y-%m-%d)

echo "=== ITAMS Log Analysis Report - $DATE ==="
echo

echo "=== Error Summary ==="
grep -i "error" $LOG_FILE | wc -l

echo
echo "=== Warning Summary ==="
grep -i "warning" $LOG_FILE | wc -l

echo
echo "=== Top 10 Error Messages ==="
grep -i "error" $LOG_FILE | tail -10

echo
echo "=== API Request Count ==="
grep "GET\|POST\|PUT\|DELETE" $LOG_FILE | wc -l

echo
echo "=== Slow Requests (>1000ms) ==="
grep "duration" $LOG_FILE | awk '$NF > 1000' | wc -l
```

## Security Monitoring

### Security Event Logging

Implement security event logging:

```typescript
// src/lib/security-logger.ts
import logger from './logger';

interface SecurityEvent {
  eventType: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

export class SecurityLogger {
  static logEvent(event: SecurityEvent): void {
    logger.warn('Security Event', {
      ...event,
      component: 'security'
    });
  }
  
  static logFailedLogin(email: string, ipAddress: string, userAgent?: string): void {
    this.logEvent({
      eventType: 'FAILED_LOGIN',
      details: { email },
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  }
  
  static logSuccessfulLogin(userId: string, tenantId: string, ipAddress: string, userAgent?: string): void {
    this.logEvent({
      eventType: 'SUCCESSFUL_LOGIN',
      userId,
      tenantId,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  }
  
  static logUnauthorizedAccess(userId: string, tenantId: string, resource: string, ipAddress: string): void {
    this.logEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      userId,
      tenantId,
      details: { resource },
      ipAddress,
      timestamp: new Date()
    });
  }
}
```

### Intrusion Detection

Monitor for suspicious activities:

```bash
#!/bin/bash
# intrusion-detection.sh

LOG_FILE="/var/log/itams/security.log"
ALERT_EMAIL="security@your-domain.com"

echo "=== Security Analysis Report ==="
echo "Timestamp: $(date)"
echo

echo "=== Failed Login Attempts (Last Hour) ==="
grep "FAILED_LOGIN" $LOG_FILE | grep "$(date -d '1 hour ago' +%Y-%m-%d)" | wc -l

echo
echo "=== Suspicious IP Addresses ==="
grep "FAILED_LOGIN" $LOG_FILE | awk '{print $NF}' | sort | uniq -c | sort -nr | head -5

echo
echo "=== Unauthorized Access Attempts ==="
grep "UNAUTHORIZED_ACCESS" $LOG_FILE | wc -l

# Alert if threshold exceeded
FAILED_LOGINS=$(grep "FAILED_LOGIN" $LOG_FILE | grep "$(date -d '1 hour ago' +%Y-%m-%d)" | wc -l)
if [ $FAILED_LOGINS -gt 10 ]; then
  echo "ALERT: High number of failed login attempts detected!" | mail -s "Security Alert" $ALERT_EMAIL
fi
```

## Business Monitoring

### User Activity Tracking

Track key business metrics:

```typescript
// src/lib/analytics.ts
import { db } from './db';
import logger from './logger';

interface BusinessMetrics {
  userActivity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
  };
  assetMetrics: {
    totalAssets: number;
    assetsByType: Record<string, number>;
    assetGrowth: number;
  };
  systemMetrics: {
    apiRequests: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

export async function collectBusinessMetrics(): Promise<BusinessMetrics> {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // User activity metrics
    const dailyActiveUsers = await db.user.count({
      where: {
        updatedAt: {
          gte: oneDayAgo
        }
      }
    });
    
    const weeklyActiveUsers = await db.user.count({
      where: {
        updatedAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    const monthlyActiveUsers = await db.user.count({
      where: {
        updatedAt: {
          gte: oneMonthAgo
        }
      }
    });
    
    // Asset metrics
    const [pcCount, laptopCount, printerCount, licenseCount] = await Promise.all([
      db.pC.count(),
      db.laptop.count(),
      db.printer.count(),
      db.license.count()
    ]);
    
    const totalAssets = pcCount + laptopCount + printerCount + licenseCount;
    
    // Calculate asset growth (simplified)
    const assetGrowth = 0; // Would need historical data for accurate calculation
    
    const metrics: BusinessMetrics = {
      userActivity: {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers
      },
      assetMetrics: {
        totalAssets,
        assetsByType: {
          pc: pcCount,
          laptop: laptopCount,
          printer: printerCount,
          license: licenseCount
        },
        assetGrowth
      },
      systemMetrics: {
        apiRequests: 0, // Would need to track in middleware
        averageResponseTime: 0, // Would need to track in middleware
        errorRate: 0 // Would need to track in error handling
      }
    };
    
    logger.info('Business metrics collected', { metrics });
    return metrics;
  } catch (error) {
    logger.error('Failed to collect business metrics', { error });
    throw error;
  }
}
```

### Dashboard Integration

Create a monitoring dashboard endpoint:

```typescript
// src/app/api/dashboard/monitoring/route.ts
import { NextResponse } from 'next/server';
import { collectBusinessMetrics } from '@/lib/analytics';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Collect business metrics
    const businessMetrics = await collectBusinessMetrics();
    
    // Collect system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    // Collect database metrics
    const dbMetrics = {
      connectionCount: 0, // Would need to query PostgreSQL stats
      slowQueries: 0, // Would need to query pg_stat_statements
      cacheHitRatio: 0 // Would need to query PostgreSQL stats
    };
    
    const dashboardData = {
      timestamp: new Date().toISOString(),
      business: businessMetrics,
      system: systemMetrics,
      database: dbMetrics
    };
    
    return NextResponse.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: {
        message: 'Failed to collect monitoring data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}
```

## Alerting System

### Alert Configuration

Create alert configuration:

```typescript
// src/lib/alerting.ts
import logger from './logger';

interface AlertConfig {
  name: string;
  condition: () => Promise<boolean>;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  channels: string[];
}

interface Alert {
  id: string;
  config: AlertConfig;
  triggered: boolean;
  lastChecked: Date;
  triggerCount: number;
}

class AlertingSystem {
  private alerts: Alert[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  
  addAlert(config: AlertConfig): void {
    this.alerts.push({
      id: Math.random().toString(36).substr(2, 9),
      config,
      triggered: false,
      lastChecked: new Date(0),
      triggerCount: 0
    });
  }
  
  async checkAlerts(): Promise<void> {
    for (const alert of this.alerts) {
      try {
        const conditionMet = await alert.config.condition();
        const now = new Date();
        
        if (conditionMet) {
          if (!alert.triggered) {
            alert.triggered = true;
            alert.triggerCount++;
            
            // Send alert
            await this.sendAlert(alert, now);
            
            logger.warn('Alert triggered', {
              alert: alert.config.name,
              severity: alert.config.severity,
              message: alert.config.message
            });
          }
        } else {
          if (alert.triggered) {
            alert.triggered = false;
            logger.info('Alert resolved', {
              alert: alert.config.name
            });
          }
        }
        
        alert.lastChecked = now;
      } catch (error) {
        logger.error('Error checking alert', {
          alert: alert.config.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
  
  private async sendAlert(alert: Alert, timestamp: Date): Promise<void> {
    // Send to configured channels (email, Slack, etc.)
    for (const channel of alert.config.channels) {
      switch (channel) {
        case 'email':
          await this.sendEmailAlert(alert, timestamp);
          break;
        case 'slack':
          await this.sendSlackAlert(alert, timestamp);
          break;
        case 'webhook':
          await this.sendWebhookAlert(alert, timestamp);
          break;
      }
    }
  }
  
  private async sendEmailAlert(alert: Alert, timestamp: Date): Promise<void> {
    // Implementation for sending email alerts
    console.log(`Sending email alert: ${alert.config.message}`);
  }
  
  private async sendSlackAlert(alert: Alert, timestamp: Date): Promise<void> {
    // Implementation for sending Slack alerts
    console.log(`Sending Slack alert: ${alert.config.message}`);
  }
  
  private async sendWebhookAlert(alert: Alert, timestamp: Date): Promise<void> {
    // Implementation for sending webhook alerts
    console.log(`Sending webhook alert: ${alert.config.message}`);
  }
  
  start(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
    
    logger.info('Alerting system started', { interval: intervalMs });
  }
  
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('Alerting system stopped');
    }
  }
}

export const alertingSystem = new AlertingSystem();
```

### Predefined Alerts

Configure common alerts:

```typescript
// src/lib/alerts.ts
import { alertingSystem } from './alerting';
import { db } from './db';
import { redisCache } from './redis-cache';

// High CPU usage alert
alertingSystem.addAlert({
  name: 'High CPU Usage',
  condition: async () => {
    // This would need to be implemented with a system monitoring library
    return false; // Placeholder
  },
  threshold: 80,
  severity: 'high',
  message: 'CPU usage exceeded 80%',
  channels: ['email', 'slack']
});

// Database connection pool alert
alertingSystem.addAlert({
  name: 'Database Connection Pool',
  condition: async () => {
    // This would need to query PostgreSQL connection stats
    return false; // Placeholder
  },
  threshold: 90,
  severity: 'critical',
  message: 'Database connection pool usage exceeded 90%',
  channels: ['email', 'slack']
});

// Redis memory usage alert
alertingSystem.addAlert({
  name: 'Redis Memory Usage',
  condition: async () => {
    try {
      const info = await redisCache.info();
      const usedMemory = parseInt(info.used_memory || '0');
      const maxMemory = parseInt(info.maxmemory || '0');
      
      if (maxMemory > 0) {
        const usagePercent = (usedMemory / maxMemory) * 100;
        return usagePercent > 85;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  },
  threshold: 85,
  severity: 'high',
  message: 'Redis memory usage exceeded 85%',
  channels: ['email']
});

// Application error rate alert
alertingSystem.addAlert({
  name: 'High Error Rate',
  condition: async () => {
    // This would need to track error rates from logs or metrics
    return false; // Placeholder
  },
  threshold: 5,
  severity: 'medium',
  message: 'Application error rate exceeded 5%',
  channels: ['email']
});

// Start alerting system
alertingSystem.start(60000); // Check every minute
```

## Monitoring Dashboard

### Grafana Integration

Create a Grafana dashboard configuration:

```json
{
  "dashboard": {
    "id": null,
    "title": "ITAMS Monitoring",
    "tags": ["itams", "monitoring"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Application Uptime",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "process_uptime_seconds{job=\"itams\"}",
            "legendFormat": "Uptime (seconds)"
          }
        ]
      },
      {
        "id": 2,
        "title": "Memory Usage",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"itams\"}",
            "legendFormat": "Resident Memory"
          }
        ]
      },
      {
        "id": 3,
        "title": "CPU Usage",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total{job=\"itams\"}[5m])",
            "legendFormat": "CPU Usage"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "stat",
        "datasource": "PostgreSQL",
        "targets": [
          {
            "rawSql": "SELECT count(*) FROM pg_stat_activity;",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## Performance Monitoring

### Response Time Monitoring

Implement response time tracking middleware:

```typescript
// src/lib/middleware/performance-monitoring.ts
import { NextRequest, NextFetchEvent } from 'next/server';
import logger from '@/lib/logger';

interface PerformanceMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxSize: number = 1000;
  
  trackRequest(path: string, method: string, statusCode: number, duration: number): void {
    const metric: PerformanceMetrics = {
      path,
      method,
      statusCode,
      duration,
      timestamp: new Date()
    };
    
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
    
    // Log slow requests
    if (duration > 1000) { // 1 second
      logger.warn('Slow request detected', {
        path,
        method,
        statusCode,
        duration,
        component: 'performance'
      });
    }
  }
  
  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / this.metrics.length;
  }
  
  getSlowRequests(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }
  
  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    
    const errorCount = this.metrics.filter(metric => metric.statusCode >= 500).length;
    return (errorCount / this.metrics.length) * 100;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Middleware function
export async function performanceMonitoringMiddleware(
  request: NextRequest,
  event: NextFetchEvent
) {
  const startTime = Date.now();
  
  // Create a response promise
  const responsePromise = Promise.resolve(); // This would be your actual handler
  
  try {
    // Wait for the response
    await responsePromise;
    
    const duration = Date.now() - startTime;
    const statusCode = 200; // This would come from the actual response
    
    performanceMonitor.trackRequest(
      request.nextUrl.pathname,
      request.method,
      statusCode,
      duration
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const statusCode = 500;
    
    performanceMonitor.trackRequest(
      request.nextUrl.pathname,
      request.method,
      statusCode,
      duration
    );
    
    throw error;
  }
}
```

## Monitoring Best Practices

### 1. Comprehensive Coverage

Monitor all critical components:
- Application performance
- Database performance
- Cache performance
- Network connectivity
- System resources
- Security events
- Business metrics

### 2. Proactive Alerting

Set up alerts for:
- Performance degradation
- System resource exhaustion
- Security incidents
- Business metric anomalies
- System availability issues

### 3. Historical Analysis

- Retain monitoring data for trend analysis
- Compare current performance with historical baselines
- Identify performance patterns and seasonal variations

### 4. Dashboard Visualization

Create dashboards for:
- Real-time system status
- Performance trends
- Error rates
- User activity
- Business metrics

### 5. Regular Review

- Review monitoring configurations regularly
- Update alerts based on changing requirements
- Analyze monitoring data for optimization opportunities
- Test alerting systems periodically

## Troubleshooting Monitoring Issues

### Common Issues

#### 1. Missing Metrics
```bash
# Check if monitoring services are running
sudo systemctl status prometheus
sudo systemctl status grafana-server

# Verify metric endpoints
curl http://localhost:3000/api/metrics
```

#### 2. Alert Fatigue
```bash
# Review alert configurations
# Adjust thresholds and notification channels
# Implement alert deduplication
```

#### 3. Performance Impact
```bash
# Monitor monitoring system performance
# Optimize metric collection frequency
# Use sampling for high-volume metrics
```

### Monitoring Debugging

Create a monitoring health check:

```bash
#!/bin/bash
# monitoring-health-check.sh

echo "=== Monitoring System Health Check ==="
echo "Timestamp: $(date)"
echo

echo "=== PM2 Status ==="
pm2 list

echo
echo "=== Log File Sizes ==="
ls -lh /var/log/itams/

echo
echo "=== Disk Space ==="
df -h /

echo
echo "=== Memory Usage ==="
free -h

echo
echo "=== Running Monitoring Processes ==="
ps aux | grep -E "(prometheus|grafana|collectd)"
```

## Conclusion

A comprehensive monitoring strategy is essential for maintaining the health, performance, and security of the ITAMS application. By implementing the monitoring solutions and best practices outlined in this guide, you can ensure proactive issue detection, rapid incident response, and continuous system optimization.

Regular review and refinement of monitoring configurations will help maintain their effectiveness as the system evolves and grows.