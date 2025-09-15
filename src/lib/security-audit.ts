import { db } from '@/lib/db'
import logger from '@/lib/logger'

// Security event types
export type SecurityEventType = 
  | 'FAILED_LOGIN_ATTEMPT'
  | 'SUCCESSFUL_LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'USER_LOCKOUT'
  | 'SECURITY_VIOLATION'
  | 'DATA_ACCESS'
  | 'DATA_MODIFICATION'

// Security event severity levels
export type SecurityEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Security event interface
export interface SecurityEvent {
  eventType: SecurityEventType
  severity: SecurityEventSeverity
  userId?: string
  tenantId: string
  ipAddress?: string
  userAgent?: string
  description: string
  details?: any
}

// Create a security audit log entry
export async function createSecurityAuditLog(event: SecurityEvent): Promise<void> {
  try {
    // Log to application logs
    logger.info('Security event', {
      eventType: event.eventType,
      severity: event.severity,
      userId: event.userId,
      tenantId: event.tenantId,
      ipAddress: event.ipAddress,
      description: event.description,
      details: event.details
    })
    
    // Store in database if audit logging is enabled for the tenant
    const auditLogsSettings = await db.auditLogsSettings.findUnique({
      where: {
        tenantId: event.tenantId
      }
    })
    
    if (auditLogsSettings?.enabled) {
      await db.history.create({
        data: {
          action: `SECURITY_${event.eventType}`,
          modelType: 'SecurityEvent',
          recordId: generateEventId(),
          changes: {
            eventType: event.eventType,
            severity: event.severity,
            userId: event.userId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            description: event.description,
            details: event.details
          },
          userId: event.userId,
          tenantId: event.tenantId
        }
      })
    }
  } catch (error) {
    logger.error('Failed to create security audit log:', error)
    // Don't throw error as audit logging failure shouldn't break the main functionality
  }
}

// Generate a unique event ID
function generateEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Log a failed login attempt
export async function logFailedLoginAttempt(
  email: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityAuditLog({
    eventType: 'FAILED_LOGIN_ATTEMPT',
    severity: 'MEDIUM',
    tenantId,
    ipAddress,
    userAgent,
    description: `Failed login attempt for email: ${email}`,
    details: { email }
  })
}

// Log a successful login
export async function logSuccessfulLogin(
  userId: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityAuditLog({
    eventType: 'SUCCESSFUL_LOGIN',
    severity: 'LOW',
    userId,
    tenantId,
    ipAddress,
    userAgent,
    description: `Successful login for user: ${userId}`,
    details: { userId }
  })
}

// Log a user lockout
export async function logUserLockout(
  userId: string,
  tenantId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityAuditLog({
    eventType: 'USER_LOCKOUT',
    severity: 'HIGH',
    userId,
    tenantId,
    ipAddress,
    userAgent,
    description: `User account locked: ${userId}`,
    details: { userId }
  })
}

// Log a security violation
export async function logSecurityViolation(
  tenantId: string,
  violationType: string,
  ipAddress?: string,
  userAgent?: string,
  details?: any
): Promise<void> {
  await createSecurityAuditLog({
    eventType: 'SECURITY_VIOLATION',
    severity: 'CRITICAL',
    tenantId,
    ipAddress,
    userAgent,
    description: `Security violation detected: ${violationType}`,
    details
  })
}

// Get security events for a tenant
export async function getSecurityEvents(
  tenantId: string,
  eventType?: SecurityEventType,
  limit: number = 50
): Promise<any[]> {
  try {
    const whereClause: any = {
      tenantId,
      modelType: 'SecurityEvent'
    }
    
    if (eventType) {
      whereClause.action = `SECURITY_${eventType}`
    }
    
    const events = await db.history.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
    
    return events
  } catch (error) {
    logger.error('Failed to fetch security events:', error)
    throw error
  }
}