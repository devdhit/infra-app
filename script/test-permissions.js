const { PrismaClient } = require('../src/generated/prisma');

async function testPermissions() {
  const prisma = new PrismaClient();
  
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });
    
    console.log('Users and their roles:');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role?.name || 'No role'} (ID: ${user.role?.id || 'No role ID'})`);
    });
    
    // Test permissions for each user
    console.log('\nPermission tests:');
    for (const user of users) {
      if (user.role) {
        console.log(`\nTesting permissions for ${user.email} (${user.role.name}):`);
        
        // Test view users permission
        const role = await prisma.role.findUnique({
          where: {
            id: user.role.id,
            tenantId: user.tenantId
          }
        });
        
        if (role) {
          const permissions = role.permissions;
          console.log(`  Users view permission: ${permissions.users?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Users create permission: ${permissions.users?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Roles view permission: ${permissions.roles?.includes('view') ? 'YES' : 'NO'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error testing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissions();