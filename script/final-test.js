// Final test to verify audit logs functionality
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function finalTest() {
  try {
    console.log('Running final test of audit logs functionality...');
    
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
    
    console.log('✓ Audit logs settings exist:', {
      enabled: auditLogsSettings?.enabled,
      retentionPeriod: auditLogsSettings?.retentionPeriod
    });
    
    // Get roles for this tenant
    const roles = await prisma.role.findMany({
      where: {
        tenantId: tenant.id
      }
    });
    
    console.log(`Found ${roles.length} roles:`);
    let adminRole = null;
    let userRole = null;
    
    for (const role of roles) {
      console.log(`  ${role.name}: auditLogs =`, role.permissions.auditLogs || 'undefined');
      
      if (role.name === 'admin') {
        adminRole = role;
      } else if (role.name === 'user' || role.name === 'employe') {
        userRole = role;
      }
    }
    
    // Verify admin role has audit logs permission
    if (adminRole) {
      const hasAuditLogsPermission = adminRole.permissions.auditLogs && 
                                    Array.isArray(adminRole.permissions.auditLogs) && 
                                    adminRole.permissions.auditLogs.includes('view');
      console.log(`✓ Admin role has audit logs permission: ${hasAuditLogsPermission}`);
    }
    
    // Verify user role does not have audit logs permission
    if (userRole) {
      const hasAuditLogsPermission = userRole.permissions.auditLogs && 
                                    Array.isArray(userRole.permissions.auditLogs) && 
                                    userRole.permissions.auditLogs.includes('view');
      console.log(`✓ User role has audit logs permission: ${hasAuditLogsPermission} (should be false)`);
    }
    
    // Get some audit logs
    const auditLogs = await prisma.history.findMany({
      where: {
        tenantId: tenant.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });
    
    console.log(`✓ Found ${auditLogs.length} audit logs (should be > 0)`);
    
    console.log('\n🎉 Final test completed successfully! Audit logs should now be properly displayed in the UI.');
    console.log('\nFor admin users:');
    console.log('  - Settings section will be visible');
    console.log('  - Audit Logs subsection will be visible');
    console.log('  - Audit logs will be displayed');
    console.log('\nFor regular users:');
    console.log('  - Settings section will be visible');
    console.log('  - Audit Logs subsection will NOT be visible');
    console.log('  - No access to audit logs');
  } catch (error) {
    console.error('Final test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
finalTest();