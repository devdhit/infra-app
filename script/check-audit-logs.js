// Script to check audit log functionality and settings
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    console.log('Checking audit log functionality...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenants`);
    
    for (const tenant of tenants) {
      console.log(`\nChecking tenant: ${tenant.name} (${tenant.id})`);
      
      // Check if audit logs settings exist for this tenant
      let auditLogsSettings = await prisma.auditLogsSettings.findUnique({
        where: {
          tenantId: tenant.id
        }
      });
      
      if (!auditLogsSettings) {
        console.log('  No audit logs settings found for this tenant');
      } else {
        console.log('  Audit logs settings:', {
          enabled: auditLogsSettings.enabled,
          retentionPeriod: auditLogsSettings.retentionPeriod,
          logAssetCreation: auditLogsSettings.logAssetCreation,
          logAssetUpdates: auditLogsSettings.logAssetUpdates,
          logAssetDeletion: auditLogsSettings.logAssetDeletion,
          logUserLogin: auditLogsSettings.logUserLogin,
          logUserLogout: auditLogsSettings.logUserLogout,
          logPermissionChanges: auditLogsSettings.logPermissionChanges
        });
      }
      
      // Check if there are any audit logs for this tenant
      const auditLogCount = await prisma.history.count({
        where: {
          tenantId: tenant.id
        }
      });
      
      console.log(`  Found ${auditLogCount} audit log entries for this tenant`);
      
      if (auditLogCount > 0) {
        // Get a few sample audit logs
        const sampleLogs = await prisma.history.findMany({
          where: {
            tenantId: tenant.id
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3,
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        });
        
        console.log('  Sample audit logs:');
        for (const log of sampleLogs) {
          console.log(`    - ${log.action} ${log.modelType} by ${log.user?.name || 'System'} at ${log.createdAt}`);
        }
      }
    }
  } catch (error) {
    console.error('Audit log check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAuditLogs();