const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminPermissions() {
  try {
    // Find an admin role
    const adminRole = await prisma.role.findFirst({
      where: {
        name: 'admin'
      }
    });

    if (!adminRole) {
      console.log('No admin role found');
      return;
    }

    console.log('Admin Role:', adminRole);

    // Check the permissions object
    console.log('Permissions:', JSON.stringify(adminRole.permissions, null, 2));

    // Check if auditLogs permission is present
    if (adminRole.permissions && adminRole.permissions.auditLogs) {
      console.log('Audit Logs permissions:', adminRole.permissions.auditLogs);
    } else {
      console.log('No auditLogs permissions found');
    }

    // Find a user with admin role
    const adminUser = await prisma.user.findFirst({
      where: {
        roleId: adminRole.id
      },
      include: {
        role: true
      }
    });

    if (!adminUser) {
      console.log('No admin user found');
      return;
    }

    console.log('Admin User:', adminUser);
    console.log('User Role Permissions:', JSON.stringify(adminUser.role.permissions, null, 2));

  } catch (error) {
    console.error('Error checking admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();