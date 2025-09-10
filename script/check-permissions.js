const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    logger.info('Checking permissions...');
    
    // Get all roles
    const roles = await prisma.role.findMany({
      include: {
        users: true
      }
    });
    
    logger.info(`Found ${roles.length} roles`);
    
    for (const role of roles) {
      logger.info(`\nRole: ${role.name}`);
      logger.info(`Description: ${role.description}`);
      logger.info(`Permissions: ${JSON.stringify(role.permissions, null, 2)}`);
      logger.info(`Users with this role: ${role.users.length}`);
    }
    
    // Get a sample user
    const user = await prisma.user.findFirst({
      include: {
        role: true
      }
    });
    
    if (user) {
      logger.info('\nSample user:');
      logger.info(`Name: ${user.name}`);
      logger.info(`Email: ${user.email}`);
      logger.info(`Role: ${user.role.name}`);
    }
    
  } catch (error) {
    logger.error('Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();