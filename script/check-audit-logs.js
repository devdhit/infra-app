const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    logger.info('Checking audit log functionality...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    logger.info(`Found ${tenants.length} tenants`);
    
    // Check audit logs for each tenant
    for (const tenant of tenants) {
      logger.info(`\nChecking tenant: ${tenant.name} (${tenant.id})`);
      
      // Check if audit logs settings exist
      const auditLogSettings = await prisma.auditLogSettings.findUnique({
        where: { tenantId: tenant.id }
      });
      
      if (!auditLogSettings) {
        logger.info('  No audit logs settings found for this tenant');
      } else {
        logger.info('  Audit logs settings:', {
          enabled: auditLogSettings.enabled,
          retentionDays: auditLogSettings.retentionDays
        });
      }
      
      // Get audit log count for this tenant
      const auditLogCount = await prisma.auditLog.count({
        where: { tenantId: tenant.id }
      });
      
      logger.info(`  Found ${auditLogCount} audit log entries for this tenant`);
      
      // Show some sample audit logs if they exist
      if (auditLogCount > 0) {
        const sampleLogs = await prisma.auditLog.findMany({
          where: { tenantId: tenant.id },
          take: 3,
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        });
        
        logger.info('  Sample audit logs:');
        for (const log of sampleLogs) {
          logger.info(`    - ${log.action} ${log.modelType} by ${log.user?.name || 'System'} at ${log.createdAt}`);
        }
      }
    }
  } catch (error) {
    logger.error('Audit log check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();