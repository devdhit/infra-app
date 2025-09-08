const { PrismaClient } = require('@prisma/client');

async function testRolePermissionsFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing role permissions fix...\n');
    
    // Get all users with their roles
    const users = await prisma.user.findMany({
      include: {
        role: true
      }
    });
    
    console.log('Users and their roles:');
    for (const user of users) {
      console.log(`- ${user.email} (${user.name})`);
      console.log(`  Role: ${user.role ? `${user.role.name} (ID: ${user.role.id})` : 'No role'}`);
      
      if (user.role) {
        // Test permission checking logic
        const role = await prisma.role.findUnique({
          where: {
            id: user.role.id,
            tenantId: user.tenantId
          }
        });
        
        if (role) {
          console.log(`  Users view permission: ${role.permissions.users?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Roles view permission: ${role.permissions.roles?.includes('view') ? 'YES' : 'NO'}`);
        }
      }
      console.log('');
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing role permissions fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRolePermissionsFix();