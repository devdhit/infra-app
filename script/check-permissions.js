// Simple script to check permissions without importing modules

const { PrismaClient } = require('@prisma/client');

async function checkPermissions() {
  const prisma = new PrismaClient();
  
  try {
    // Find an admin role
    const adminRoles = await prisma.role.findMany({
      where: {
        name: 'admin'
      }
    });

    console.log(`Found ${adminRoles.length} admin roles`);
    
    for (const role of adminRoles) {
      console.log('\n--- Role Details ---');
      console.log('ID:', role.id);
      console.log('Name:', role.name);
      console.log('Tenant ID:', role.tenantId);
      
      // Check permissions
      if (role.permissions) {
        console.log('Permissions:', JSON.stringify(role.permissions, null, 2));
        
        // Check specific permissions
        if (role.permissions.settings) {
          console.log('Settings permissions:', role.permissions.settings);
        } else {
          console.log('No settings permissions found');
        }
        
        if (role.permissions.auditLogs) {
          console.log('Audit logs permissions:', role.permissions.auditLogs);
        } else {
          console.log('No audit logs permissions found');
        }
      }
    }
    
    if (adminRoles.length === 0) {
      console.log('Checking for any roles with audit logs permissions...');
      
      const allRoles = await prisma.role.findMany();
      for (const role of allRoles) {
        if (role.permissions && role.permissions.auditLogs && role.permissions.auditLogs.length > 0) {
          console.log(`Role "${role.name}" has audit logs permissions:`, role.permissions.auditLogs);
        }
      }
    }

  } catch (error) {
    console.error('Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();