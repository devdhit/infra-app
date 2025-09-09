// Script to check current roles and their permissions in the database
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    console.log('Checking roles in the database...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    
    for (const tenant of tenants) {
      console.log(`\nTenant: ${tenant.name} (${tenant.id})`);
      
      // Get all roles for this tenant
      const roles = await prisma.role.findMany({
        where: {
          tenantId: tenant.id
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      console.log(`Found ${roles.length} roles:`);
      
      for (const role of roles) {
        console.log(`\n  Role: ${role.name} (${role.id})`);
        console.log(`  Description: ${role.description}`);
        console.log(`  Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
      }
    }
    
    // Get a sample user to see what role they have
    const users = await prisma.user.findMany({
      include: {
        role: true
      },
      take: 5
    });
    
    console.log('\nSample users:');
    for (const user of users) {
      console.log(`\n  User: ${user.name} (${user.email})`);
      console.log(`  Role: ${user.role?.name || 'No role'} (${user.roleId})`);
    }
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRoles();