// Script to test permissions for audit logs
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testPermissions() {
  try {
    console.log('Testing audit logs permissions...');
    
    // Get a tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found');
      return;
    }
    
    console.log(`Testing tenant: ${tenant.name} (${tenant.id})`);
    
    // Get roles for this tenant
    const roles = await prisma.role.findMany({
      where: {
        tenantId: tenant.id
      }
    });
    
    console.log(`Found ${roles.length} roles:`);
    
    for (const role of roles) {
      console.log(`  Role: ${role.name}`);
      console.log(`  Permissions:`, role.permissions);
      
      // Check if this role has audit logs view permission
      const hasAuditLogsPermission = role.permissions.auditLogs && 
                                    Array.isArray(role.permissions.auditLogs) && 
                                    role.permissions.auditLogs.includes('view');
      
      console.log(`  Has audit logs view permission: ${hasAuditLogsPermission}`);
    }
    
    console.log('\nPermissions test completed successfully!');
  } catch (error) {
    console.error('Permissions test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPermissions();