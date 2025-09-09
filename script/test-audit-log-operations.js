// Script to test audit log functionality for bulk delete, import, and export operations
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testAuditLogOperations() {
  try {
    console.log('Testing audit log functionality for bulk delete, import, and export operations...');
    
    // Test tenant ID
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    
    // Create a test tenant first to avoid foreign key constraint errors
    console.log('Creating test tenant...');
    let tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          name: 'Test Tenant',
          description: 'Test tenant for audit log operations'
        }
      });
      console.log('Created test tenant:', tenant);
    } else {
      console.log('Test tenant already exists:', tenant);
    }
    
    // Create a test user
    console.log('Creating test user...');
    let user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: 'test@example.com',
          password: 'testpassword',
          name: 'Test User',
          tenantId: tenantId
        }
      });
      console.log('Created test user:', user);
    } else {
      console.log('Test user already exists:', user);
    }
    
    // Test getting audit logs settings for a tenant
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
    
    // Test creating audit log entries for different operations
    const testOperations = [
      { action: 'bulkDelete', modelType: 'PC', recordId: 'bulk-operation-1' },
      { action: 'import', modelType: 'Laptop', recordId: 'import-operation-1' },
      { action: 'export', modelType: 'Printer', recordId: 'export-operation-1' }
    ];
    
    for (const op of testOperations) {
      console.log(`Creating test audit log entry for ${op.action} operation...`);
      const auditLog = await prisma.history.create({
        data: {
          action: op.action,
          modelType: op.modelType,
          recordId: op.recordId,
          changes: { test: 'data', operation: op.action },
          userId: userId,
          tenantId: tenantId
        }
      });
      
      console.log(`Created ${op.action} audit log entry:`, auditLog);
    }
    
    // Test retrieving audit logs with filters
    console.log('Retrieving audit logs with action filter...');
    const auditLogsWithActionFilter = await prisma.history.findMany({
      where: {
        tenantId,
        action: 'bulkDelete'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`Found ${auditLogsWithActionFilter.length} bulkDelete audit log entries:`);
    auditLogsWithActionFilter.forEach(log => {
      console.log(`- ${log.action} ${log.modelType} (${log.createdAt})`);
    });
    
    console.log('Audit log operations test completed successfully!');
  } catch (error) {
    console.error('Audit log operations test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditLogOperations();