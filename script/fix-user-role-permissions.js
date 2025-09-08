const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing user role permissions...');
  
  // Find the user role
  const userRole = await prisma.role.findFirst({
    where: {
      name: 'user'
    }
  });
  
  if (!userRole) {
    console.log('User role not found');
    return;
  }
  
  console.log('Current user role permissions:', JSON.stringify(userRole.permissions, null, 2));
  
  // Update the user role permissions to include roles view permission
  const updatedPermissions = {
    ...userRole.permissions,
    roles: ['view'] // Add view permission for roles
  };
  
  console.log('Updated permissions:', JSON.stringify(updatedPermissions, null, 2));
  
  // Update the role in the database
  const updatedRole = await prisma.role.update({
    where: {
      id: userRole.id
    },
    data: {
      permissions: updatedPermissions
    }
  });
  
  console.log('Successfully updated user role permissions');
  console.log('New permissions:', JSON.stringify(updatedRole.permissions, null, 2));
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});