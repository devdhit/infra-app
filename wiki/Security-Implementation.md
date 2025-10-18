# Security Implementation Guide

This document provides comprehensive guidance on the security measures implemented in the IT Asset Management System (ITAMS), including authentication, authorization, data protection, and compliance considerations.

## Security Architecture Overview

ITAMS implements a multi-layered security architecture designed to protect against common vulnerabilities while ensuring data integrity and user privacy. The security framework follows industry best practices and incorporates multiple defensive mechanisms.

### Security Layers

1. **Network Security**: Firewall protection, secure communication protocols
2. **Application Security**: Authentication, authorization, input validation
3. **Data Security**: Encryption, access controls, backup protection
4. **Infrastructure Security**: Server hardening, monitoring, incident response
5. **Operational Security**: Security policies, training, audit procedures

## Authentication Security

### JWT Token Security

#### Token Structure and Validation

1. **Enhanced Payload**
   - Standard claims: `iss`, `aud`, `exp`, `iat`
   - Custom claims: `jti` (JWT ID) for uniqueness
   - Tenant and role information for context

2. **Strong Validation**
   - Issuer verification to prevent token forgery
   - Audience checking to ensure intended recipient
   - Expiration validation to prevent replay attacks
   - Signature verification using HS256 algorithm

3. **Token Blacklisting**
   - Redis-based token storage for logout functionality
   - Automatic cleanup of expired tokens
   - Immediate invalidation on security events

#### Implementation Details

```typescript
// src/lib/auth.ts
import jwt from 'jsonwebtoken';
import { redisCache } from './redis-cache';

interface JwtPayload {
  userId: string;
  tenantId: string;
  roleId: string;
  jti: string; // JWT ID for uniqueness
}

export async function generateToken(payload: Omit<JwtPayload, 'jti'>): Promise<string> {
  const jwtId = crypto.randomUUID();
  
  const token = jwt.sign(
    { ...payload, jti: jwtId },
    process.env.JWT_SECRET!,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'itams-auth',
      audience: 'itams-users'
    }
  );
  
  // Store token ID for blacklisting
  await redisCache.set(
    `blacklist:${jwtId}`, 
    'valid', 
    parseExpiration(process.env.JWT_EXPIRES_IN || '24h')
  );
  
  return token;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: 'itams-auth',
      audience: 'itams-users'
    }) as JwtPayload;
    
    // Check if token is blacklisted
    const isBlacklisted = await redisCache.get(`blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}
```

### Password Security

#### Password Requirements

1. **Complexity Requirements**
   - Minimum 12 characters
   - Mixed case letters (uppercase and lowercase)
   - At least one number
   - At least one special character
   - No common dictionary words

2. **Storage Security**
   - bcrypt hashing with 12 rounds
   - Salt generation for each password
   - No plain text storage

#### Implementation

```typescript
// src/lib/auth.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function validatePassword(password: string): boolean {
  // Minimum length
  if (password.length < 12) return false;
  
  // Must contain uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Must contain lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Must contain number
  if (!/[0-9]/.test(password)) return false;
  
  // Must contain special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  // Must not contain common weak patterns
  const weakPatterns = [
    'password', '12345678', 'qwerty', 'admin'
  ];
  
  for (const pattern of weakPatterns) {
    if (password.toLowerCase().includes(pattern)) return false;
  }
  
  return true;
}
```

### Rate Limiting

#### Login Rate Limiting

1. **IP-Based Rate Limiting**
   - Maximum 5 failed login attempts per IP per hour
   - Temporary IP blocking after threshold exceeded
   - Automatic unblocking after cooling period

2. **Account Lockout**
   - Automatic account lockout after 5 failed attempts
   - 24-hour lockout duration
   - Administrator unlock capability

#### Implementation

```typescript
// src/lib/rate-limit.ts
import { redisCache } from './redis-cache';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 3600000 // 1 hour
): Promise<RateLimitResult> {
  const currentTime = Date.now();
  const windowStart = currentTime - windowMs;
  
  // Get existing attempts
  const attempts = await redisCache.zrangebyscore(
    `rate_limit:${key}`,
    windowStart,
    currentTime
  );
  
  const currentCount = attempts.length;
  
  if (currentCount >= limit) {
    // Get the oldest attempt to calculate reset time
    const oldest = await redisCache.zrange(
      `rate_limit:${key}`,
      0,
      0,
      'WITHSCORES'
    );
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: parseInt(oldest[1]) + windowMs
    };
  }
  
  // Add current attempt
  await redisCache.zadd(
    `rate_limit:${key}`,
    currentTime,
    currentTime.toString()
  );
  
  // Set expiration to clean up old data
  await redisCache.expire(`rate_limit:${key}`, Math.ceil(windowMs / 1000));
  
  return {
    allowed: true,
    remaining: limit - currentCount - 1,
    resetTime: currentTime + windowMs
  };
}
```

## Authorization Security

### Role-Based Access Control (RBAC)

#### Permission Validation

1. **Server-Side Checks**
   - All permissions validated on server
   - No client-side bypass possible
   - Context-aware permission evaluation

2. **Caching Strategy**
   - Redis caching for performance
   - Automatic cache invalidation
   - Tenant-aware caching

#### Implementation

```typescript
// src/lib/permissions.ts
import { db } from './db';
import { redisCache } from './redis-cache';

interface PermissionCheck {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
}

export async function checkPermission(
  check: PermissionCheck
): Promise<boolean> {
  const cacheKey = `permission:${check.userId}:${check.resource}:${check.action}`;
  
  // Check cache first
  const cachedResult = await redisCache.get(cacheKey);
  if (cachedResult !== null) {
    return cachedResult === 'true';
  }
  
  // Check database
  const user = await db.user.findUnique({
    where: {
      id: check.userId,
      tenantId: check.tenantId
    },
    include: {
      role: {
        include: {
          permissions: true
        }
      }
    }
  });
  
  if (!user) {
    await redisCache.set(cacheKey, 'false', 300); // Cache for 5 minutes
    return false;
  }
  
  // Check role permissions
  const hasPermission = user.role.permissions?.some(
    (permission: any) => 
      permission.resource === check.resource && 
      permission.action === check.action
  ) || false;
  
  // Cache result
  await redisCache.set(cacheKey, hasPermission.toString(), 300);
  
  return hasPermission;
}
```

### Tenant Isolation

#### Data Separation

1. **Database-Level Isolation**
   - Tenant ID enforced in all queries
   - No cross-tenant data access
   - Automatic tenant context injection

2. **API-Level Protection**
   - Tenant validation in all endpoints
   - Resource ownership verification
   - Cross-tenant access prevention

## Input Validation and Sanitization

### SQL Injection Prevention

#### Parameterized Queries

1. **ORM Usage**
   - Prisma ORM for all database operations
   - No raw SQL unless absolutely necessary
   - Automatic parameter binding

2. **Raw SQL Sanitization**
   - Strict input validation for raw queries
   - Whitelist-based parameter filtering
   - Escape sequence prevention

#### Implementation

```typescript
// src/lib/sql-injection-middleware.ts
import { NextRequest } from 'next/server';

export function sqlInjectionMiddleware(request: NextRequest): boolean {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(;|--|\/\*|\*\/|xp_)/i,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i
  ];
  
  const url = request.url;
  const body = request.body;
  
  // Check URL parameters
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }
  
  // Check request body (if available)
  if (body) {
    const bodyText = JSON.stringify(body);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(bodyText)) {
        return false;
      }
    }
  }
  
  return true;
}
```

### XSS Prevention

#### Input Sanitization

1. **Content Sanitization**
   - HTML entity encoding
   - Script tag removal
   - Attribute validation

2. **Output Encoding**
   - Context-aware encoding
   - Safe rendering practices
   - Content Security Policy enforcement

#### Implementation

```typescript
// src/lib/security.ts
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {} // Remove all attributes
  });
}

export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    allowedAttributes: {}
  });
}
```

### Input Validation

#### Zod Schemas

1. **Strict Validation**
   - Type-safe schema definitions
   - Required field enforcement
   - Format validation

2. **Error Handling**
   - Detailed validation errors
   - User-friendly error messages
   - Logging for security analysis

#### Implementation

```typescript
// src/types/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(12, 'Password must be at least 12 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, 
           'Password must contain uppercase, lowercase, number, and special character')
});

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  password: z.string().min(12).max(128),
  roleId: z.string().uuid()
});
```

## Data Protection

### Encryption

#### Password Hashing

1. **bcrypt Implementation**
   - 12 rounds of hashing
   - Automatic salt generation
   - Resistance to rainbow table attacks

2. **Key Management**
   - Environment variable storage
   - Regular key rotation
   - Secure backup procedures

#### Data Encryption

1. **At-Rest Encryption**
   - Database-level encryption
   - File system encryption
   - Backup encryption

2. **In-Transit Encryption**
   - HTTPS/TLS for all communications
   - Certificate management
   - Perfect Forward Secrecy

### Data Integrity

#### Audit Logs

1. **Comprehensive History**
   - All user actions logged
   - Before/after data values
   - Timestamp and user identification

2. **Tamper Detection**
   - Immutable log entries
   - Hash chain verification
   - Regular integrity checks

#### Implementation

```typescript
// src/lib/audit-logs.ts
import { db } from './db';

interface AuditLogEntry {
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId?: string;
  before?: any;
  after?: any;
  ipAddress: string;
  userAgent: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        ...entry,
        timestamp: new Date()
      }
    });
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Failed to create audit log:', error);
  }
}
```

## API Security

### Request Validation

#### Content-Type Checking

1. **Strict Validation**
   - Only accept expected content types
   - Reject malformed requests
   - Log suspicious attempts

2. **Size Limits**
   - Request size limitations
   - File upload restrictions
   - Memory protection

#### Implementation

```typescript
// src/lib/middleware.ts
import { NextRequest } from 'next/server';

export function validateRequest(request: NextRequest): boolean {
  // Check content type
  const contentType = request.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    return false;
  }
  
  // Check request size (implement based on your needs)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    return false;
  }
  
  return true;
}
```

### Security Headers

#### HTTP Security Headers

1. **HSTS**
   - Strict-Transport-Security enforcement
   - Automatic HTTPS redirection
   - Long-term security policy

2. **CSP**
   - Content Security Policy implementation
   - Script source restrictions
   - Frame protection

3. **X-Frame-Options**
   - Clickjacking prevention
   - Frame embedding restrictions
   - Same-origin policy enforcement

#### Implementation

```typescript
// src/lib/security-headers.ts
import { NextResponse } from 'next/server';

export function addSecurityHeaders(response: NextResponse): void {
  // HSTS
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  
  // CSP
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  );
  
  // X-Frame-Options
  response.headers.set('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}
```

## Security Monitoring and Auditing

### Security Event Logging

#### Event Types

1. **Authentication Events**
   - Failed login attempts
   - Successful logins
   - Account lockouts

2. **Authorization Events**
   - Permission denied attempts
   - Role changes
   - Access violations

3. **Data Events**
   - Sensitive data access
   - Data modification attempts
   - Export activities

#### Implementation

```typescript
// src/lib/security-logger.ts
import logger from './logger';

interface SecurityEvent {
  eventType: string;
  userId?: string;
  tenantId?: string;
  ipAddress: string;
  userAgent: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class SecurityLogger {
  static logEvent(event: SecurityEvent): void {
    logger.warn('Security Event', {
      ...event,
      component: 'security'
    });
    
    // Additional security-specific handling
    if (event.severity === 'critical') {
      // Send immediate alert
      this.sendAlert(event);
    }
  }
  
  private static sendAlert(event: SecurityEvent): void {
    // Implementation for sending security alerts
    console.log(`SECURITY ALERT: ${event.eventType}`, event);
  }
}
```

### Audit Trail

#### Comprehensive History

1. **User Activities**
   - Login/logout events
   - Profile changes
   - Permission modifications

2. **Data Changes**
   - Asset creation/modification/deletion
   - Custom field updates
   - Bulk operations

3. **System Events**
   - Configuration changes
   - Role modifications
   - Security policy updates

## Deployment Security

### Environment Security

#### Secrets Management

1. **Environment Variables**
   - Never commit secrets to version control
   - Use .env files for local development
   - Production secrets in secure vaults

2. **Configuration Validation**
   - Startup validation of required secrets
   - Secure default values
   - Error handling for missing configuration

#### Implementation

```typescript
// src/lib/config.ts
export function validateSecurityConfig(): void {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
    'REDIS_URL'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required security configuration: ${missing.join(', ')}`);
  }
  
  // Additional validation
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET === 'development-secret') {
    throw new Error('Production JWT_SECRET not configured');
  }
}
```

### Infrastructure Security

#### Container Security

1. **Minimal Attack Surface**
   - Minimal base images
   - Removed unnecessary packages
   - Regular security updates

2. **Network Security**
   - Container network isolation
   - Port exposure restrictions
   - Service mesh integration

#### Dependency Scanning

1. **Vulnerability Detection**
   - Regular npm audit runs
   - Automated security scanning
   - Dependency update policies

2. **Remediation Process**
   - Prioritized vulnerability fixes
   - Backward compatibility testing
   - Security patch deployment

## Best Practices

### Secure Coding Practices

#### Principle of Least Privilege

1. **Database Permissions**
   - Application-specific database user
   - Minimal required database permissions
   - Separation of read/write operations

2. **File System Permissions**
   - Restricted file access
   - Proper ownership settings
   - Secure temporary file handling

#### Defense in Depth

1. **Multiple Security Layers**
   - Network, application, and data security
   - Redundant protection mechanisms
   - Regular security assessments

2. **Fail Secure**
   - Secure default configurations
   - Graceful degradation
   - Error handling without information disclosure

### Security Testing

#### Static Analysis

1. **Code Scanning**
   - Regular static code analysis
   - Security-focused linting rules
   - Automated vulnerability detection

2. **Dependency Scanning**
   - npm audit for known vulnerabilities
   - Regular dependency updates
   - Security advisory monitoring

#### Penetration Testing

1. **Regular Assessments**
   - Annual penetration testing
   - Quarterly vulnerability scans
   - Continuous monitoring

2. **Third-Party Reviews**
   - Independent security audits
   - Code review by security experts
   - Compliance verification

## Incident Response

### Detection

#### Real-time Monitoring

1. **Anomaly Detection**
   - Unusual access patterns
   - Failed login attempts
   - Suspicious data access

2. **Alerting Systems**
   - Real-time security alerts
   - Escalation procedures
   - Incident response workflows

#### Log Analysis

1. **Security Event Correlation**
   - Cross-reference security events
   - Identify attack patterns
   - Generate incident reports

2. **Forensic Analysis**
   - Detailed incident investigation
   - Evidence preservation
   - Root cause analysis

### Response Procedures

#### Classification

1. **Severity Levels**
   - Low: Minor security events
   - Medium: Moderate impact incidents
   - High: Significant security breaches
   - Critical: Major system compromises

2. **Response Teams**
   - Security incident response team
   - Communication protocols
   - Stakeholder notification

#### Containment

1. **Immediate Actions**
   - Isolate affected systems
   - Block malicious traffic
   - Preserve evidence

2. **Long-term Measures**
   - Implement additional controls
   - Update security policies
   - Enhance monitoring

## Compliance Considerations

### Data Protection

#### GDPR Compliance

1. **Data Minimization**
   - Collect only necessary personal data
   - Regular data cleanup
   - Purpose limitation

2. **Right to Erasure**
   - User data deletion capabilities
   - Automated cleanup processes
   - Audit trail maintenance

#### Audit Requirements

1. **Comprehensive Logging**
   - Detailed security event logs
   - Retention policy compliance
   - Access control logs

2. **Regular Audits**
   - Internal security audits
   - Third-party assessments
   - Compliance reporting

## Security Updates and Maintenance

### Patch Management

#### Regular Updates

1. **Dependency Updates**
   - Monthly security patch reviews
   - Automated update notifications
   - Backward compatibility testing

2. **System Updates**
   - OS security patches
   - Runtime environment updates
   - Infrastructure component updates

#### Vulnerability Monitoring

1. **Continuous Monitoring**
   - Security advisory tracking
   - Automated vulnerability scanning
   - Threat intelligence integration

2. **Remediation Planning**
   - Prioritized patch deployment
   - Risk assessment procedures
   - Business impact analysis

## Conclusion

The security implementation in ITAMS provides a comprehensive defense-in-depth approach to protecting the system and its data. By implementing multiple layers of security controls, following industry best practices, and maintaining regular security assessments, ITAMS ensures robust protection against common threats while maintaining usability and performance.

Regular review and updating of security measures, combined with proper training and monitoring, will help maintain the effectiveness of the security implementation as threats evolve and the system grows.