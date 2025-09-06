const { PrismaClient } = require('../src/generated/prisma');

async function testUserData() {
  const prisma = new PrismaClient();
  
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true,
        tenant: true
      }
    });
    
    console.log('User Data Tests:');
    
    for (const user of users) {
      console.log(`\nUser: ${user.email} (${user.name})`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      console.log(`  Role ID: ${user.roleId}`);
      console.log(`  Tenant Name: ${user.tenant?.name || 'No tenant'}`);
      
      if (user.role) {
        console.log(`  Role Name: ${user.role.name}`);
        console.log(`  Role Permissions:`, JSON.stringify(user.role.permissions, null, 2));
      } else {
        console.log(`  No role assigned`);
      }
    }
  } catch (error) {
    console.error('Error testing user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserData();