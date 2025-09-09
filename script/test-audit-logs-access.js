// Script to test audit logs access for different user roles
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testAuditLogsAccess() {
  try {
    console.log('=== AUDIT LOGS ACCESS TEST ===\n');
    
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
    
    console.log(`Testing tenant: ${tenant.name}\n`);
    
    // Get roles for this tenant
    const roles = await prisma.role.findMany({
      where: {
        tenantId: tenant.id
      }
    });
    
    for (const role of roles) {
      console.log(`Role: ${role.name}`);
      console.log(`Permissions:`, role.permissions);
      
      // Check audit logs permission
      const hasAuditLogsPermission = role.permissions.auditLogs && 
                                   Array.isArray(role.permissions.auditLogs) && 
                                   role.permissions.auditLogs.includes('view');
      
      console.log(`Can view audit logs: ${hasAuditLogsPermission ? 'YES' : 'NO'}`);
      console.log('---');
    }
    
    // Check if audit logs settings exist
    const auditLogsSettings = await prisma.auditLogsSettings.findUnique({
      where: {
        tenantId: tenant.id
      }
    });
    
    console.log('\nAudit Logs Settings:');
    if (auditLogsSettings) {
      console.log(`  Enabled: ${auditLogsSettings.enabled}`);
      console.log(`  Retention Period: ${auditLogsSettings.retentionPeriod} days`);
    } else {
      console.log('  No settings found');
    }
    
    // Count audit logs
    const auditLogCount = await prisma.history.count({
      where: {
        tenantId: tenant.id
      }
    });
    
    console.log(`\nTotal Audit Logs: ${auditLogCount}`);
    
    console.log('\n=== ACCESS SUMMARY ===');
    console.log('Admin users SHOULD be able to view audit logs');
    console.log('Regular users should NOT be able to view audit logs');
    console.log('Navigate to: Settings → Audit Logs');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditLogsAccess();