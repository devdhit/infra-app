// Script to test audit log functionality
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testAuditLogs() {
  try {
    console.log('Testing audit log functionality...');
    
    // Test getting audit logs settings for a tenant
    const tenantId = 'test-tenant-id'; // Replace with actual tenant ID for testing
    
    console.log('Checking audit log settings...');
    let auditLogsSettings = await prisma.auditLogsSettings.findUnique({
      where: {
        tenantId
      }
    });
    
    if (!auditLogsSettings) {
      console.log('Creating default audit log settings...');
      auditLogsSettings = await prisma.auditLogsSettings.create({
        data: {
          tenantId,
          enabled: true,
          retentionPeriod: 90,
          logAssetCreation: true,
          logAssetUpdates: true,
          logAssetDeletion: true,
          logUserLogin: true,
          logUserLogout: true,
          logPermissionChanges: true,
          notifyOnCriticalEvents: true,
          emailNotifications: true,
          slackNotifications: false,
          notificationEmail: 'admin@example.com',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log('Audit log settings:', auditLogsSettings);
    
    // Test creating an audit log entry
    console.log('Creating test audit log entry...');
    const auditLog = await prisma.history.create({
      data: {
        action: 'test',
        modelType: 'TestModel',
        recordId: 'test-record-id',
        changes: { test: 'data' },
        userId: 'test-user-id',
        tenantId
      }
    });
    
    console.log('Created audit log entry:', auditLog);
    
    // Test retrieving audit logs
    console.log('Retrieving audit logs...');
    const auditLogs = await prisma.history.findMany({
      where: {
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`Found ${auditLogs.length} audit log entries:`);
    auditLogs.forEach(log => {
      console.log(`- ${log.action} ${log.modelType} (${log.createdAt})`);
    });
    
    console.log('Audit log test completed successfully!');
  } catch (error) {
    console.error('Audit log test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditLogs();