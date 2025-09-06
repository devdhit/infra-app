const { PrismaClient } = require('../src/generated/prisma');

async function testPermissionsApi() {
  const prisma = new PrismaClient();
  
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });
    
    console.log('Direct API Permission Tests:');
    
    // Test the hasPermission function logic directly
    for (const user of users) {
      if (user.role) {
        console.log(`\nTesting API permissions for ${user.email} (${user.role.name}):`);
        
        // Simulate the hasPermission function logic
        const role = await prisma.role.findUnique({
          where: {
            id: user.role.id,
            tenantId: user.tenantId
          }
        });
        
        if (role) {
          const permissions = role.permissions;
          
          // Test various permissions
          console.log(`  Users view permission: ${permissions.users?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Users create permission: ${permissions.users?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Roles view permission: ${permissions.roles?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Roles create permission: ${permissions.roles?.includes('create') ? 'YES' : 'NO'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error testing API permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionsApi();