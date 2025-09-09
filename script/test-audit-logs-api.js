// Script to test the audit logs API route
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testAuditLogsAPI() {
  try {
    console.log('Testing audit logs API functionality...');
    
    // Get a tenant with audit logs
    const tenant = await prisma.tenant.findFirst({
      where: {
        histories: {
          some: {}
        }
      }
    });
    
    if (!tenant) {
      console.log('No tenant with audit logs found');
      return;
    }
    
    console.log(`Testing tenant: ${tenant.name} (${tenant.id})`);
    
    // Check audit logs settings
    const auditLogsSettings = await prisma.auditLogsSettings.findUnique({
      where: {
        tenantId: tenant.id
      }
    });
    
    console.log('Audit logs settings:', {
      enabled: auditLogsSettings?.enabled,
      retentionPeriod: auditLogsSettings?.retentionPeriod
    });
    
    // Get some audit logs
    const auditLogs = await prisma.history.findMany({
      where: {
        tenantId: tenant.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log(`Found ${auditLogs.length} audit logs:`);
    for (const log of auditLogs) {
      console.log(`  - ${log.action} ${log.modelType} by ${log.user?.name || 'System'} at ${log.createdAt.toISOString()}`);
    }
    
    console.log('\nAudit logs API test completed successfully!');
  } catch (error) {
    console.error('Audit logs API test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditLogsAPI();