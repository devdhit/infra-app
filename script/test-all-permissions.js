const { PrismaClient } = require('../src/generated/prisma');

async function testAllPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing all permissions...\n');
    
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
          console.log(`  Users create permission: ${role.permissions.users?.includes('create') ? 'YES' : 'NO'}`);
          console.log(`  Roles view permission: ${role.permissions.roles?.includes('view') ? 'YES' : 'NO'}`);
          
          // Test asset-specific permissions
          console.log(`  PC view permission: ${role.permissions.pc?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Laptop view permission: ${role.permissions.laptop?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Printer view permission: ${role.permissions.printer?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  License view permission: ${role.permissions.license?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Warehouse view permission: ${role.permissions.warehouse?.includes('view') ? 'YES' : 'NO'}`);
          console.log(`  Internet view permission: ${role.permissions.internet?.includes('view') ? 'YES' : 'NO'}`);
        }
      }
      console.log('');
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing all permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllPermissions();