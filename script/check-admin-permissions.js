const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

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
      logger.info('No admin role found');
      return;
    }

    logger.info('Admin Role:', adminRole);

    // Check the permissions object
    logger.info('Permissions:', JSON.stringify(adminRole.permissions, null, 2));

    // Check if auditLogs permission is present
    if (adminRole.permissions && adminRole.permissions.auditLogs) {
      logger.info('Audit Logs permissions:', adminRole.permissions.auditLogs);
    } else {
      logger.info('No auditLogs permissions found');
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
      logger.info('No admin user found');
      return;
    }

    logger.info('Admin User:', adminUser);
    logger.info('User Role Permissions:', JSON.stringify(adminUser.role.permissions, null, 2));

  } catch (error) {
    logger.error('Error checking admin permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();