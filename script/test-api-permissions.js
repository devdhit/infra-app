const { PrismaClient } = require('../src/generated/prisma');

async function testApiPermissions() {
  const prisma = new PrismaClient();
  
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });
    
    console.log('API Permission Tests:');
    
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
          console.log(`  Can view users: ${permissions.users?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Can create users: ${permissions.users?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Can edit users: ${permissions.users?.includes('edit') ? 'YES' : 'NO'}`);
          console.log(`  Can delete users: ${permissions.users?.includes('delete') ? 'YES' : 'NO'}`);
          console.log(`  Can bulk delete users: ${permissions.users?.includes('bulkDelete') ? 'YES' : 'NO'}`);
          
          console.log(`  Can view roles: ${permissions.roles?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Can create roles: ${permissions.roles?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Can edit roles: ${permissions.roles?.includes('edit') ? 'YES' : 'NO'}`);
          console.log(`  Can delete roles: ${permissions.roles?.includes('delete') ? 'YES' : 'NO'}`);
          
          console.log(`  Can view tenants: ${permissions.tenants?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Can create tenants: ${permissions.tenants?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Can edit tenants: ${permissions.tenants?.includes('edit') ? 'YES' : 'NO'}`);
          console.log(`  Can delete tenants: ${permissions.tenants?.includes('delete') ? 'YES' : 'NO'}`);
        }
      }
    }
  } catch (error) {
    console.error('Error testing API permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiPermissions();