const { PrismaClient } = require('../src/generated/prisma');

async function checkRoles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking roles in the database...\n');
    
    // Get all roles
    const roles = await prisma.role.findMany({
      include: {
        users: true
      }
    });
    
    console.log('Roles found:');
    roles.forEach(role => {
      console.log(`- ID: ${role.id}`);
      console.log(`  Name: ${role.name}`);
      console.log(`  Description: ${role.description || 'No description'}`);
      console.log(`  Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
      console.log(`  Tenant ID: ${role.tenantId}`);
      console.log(`  Users with this role: ${role.users.length}`);
      console.log('---');
    });
    
    // Get all users with their roles
    console.log('\nUsers and their roles:');
    const users = await prisma.user.findMany({
      include: {
        role: true,
        tenant: true
      }
    });
    
    users.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role ? user.role.name : 'No role'}`);
      console.log(`  Tenant: ${user.tenant ? user.tenant.name : 'No tenant'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();