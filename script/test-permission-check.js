const { PrismaClient } = require('./../src/generated/prisma');

async function testPermissionCheck() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing permission check for admin user...\n');
    
    // Find the admin user
    const user = await prisma.user.findUnique({
      where: {
        email: 'adminit@localhost.com'
      },
      include: {
        role: true,
        tenant: true
      }
    });
    
    if (!user) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('User data:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.name}`);
    console.log(`- Tenant ID: ${user.tenantId}`);
    console.log(`- Role ID: ${user.roleId}`);
    console.log(`- Tenant: ${user.tenant ? user.tenant.name : 'No tenant'}`);
    
    if (user.role) {
      console.log('\nRole data:');
      console.log(`- Role ID: ${user.role.id}`);
      console.log(`- Role Name: ${user.role.name}`);
      console.log(`- Role Permissions: ${JSON.stringify(user.role.permissions, null, 2)}`);
      
      // Test the hasPermission function directly
      // We'll implement a simplified version here since we can't easily import the function
      console.log('\nTesting permission checks (simplified):');
      
      const permissions = user.role.permissions;
      const testPermissions = [
        { resource: 'users', action: 'view' },
        { resource: 'users', action: 'create' },
        { resource: 'tenants', action: 'view' },
        { resource: 'roles', action: 'view' }
      ];
      
      for (const { resource, action } of testPermissions) {
        const hasPerm = permissions[resource] && permissions[resource].includes(action);
        console.log(`- ${resource}.${action}: ${hasPerm}`);
      }
    } else {
      console.log('User has no role assigned!');
    }
    
  } catch (error) {
    console.error('Error testing permission check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionCheck();