const { PrismaClient } = require('./../src/generated/prisma');

async function debugPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Debugging permissions for admin user...\n');
    
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
      
      // Test specific permission that's failing
      console.log('\nTesting specific permission checks:');
      const permissions = user.role.permissions;
      
      // Test users.view permission
      const hasUsersView = permissions['users'] && permissions['users'].includes('view');
      console.log(`- users.view: ${hasUsersView}`);
      
      // Test other key permissions
      const testPermissions = [
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
    
    // Also check if there are any users with null roleId
    console.log('\nChecking for users with null roleId:');
    const usersWithNullRole = await prisma.user.findMany({
      where: {
        roleId: null
      }
    });
    
    if (usersWithNullRole.length > 0) {
      console.log(`Found ${usersWithNullRole.length} users with null roleId:`);
      usersWithNullRole.forEach(u => {
        console.log(`- ${u.email} (${u.name})`);
      });
    } else {
      console.log('No users with null roleId found.');
    }
    
  } catch (error) {
    console.error('Error debugging permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPermissions();