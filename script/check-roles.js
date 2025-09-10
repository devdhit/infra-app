const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function checkRoles() {
  try {
    logger.info('Checking roles...');
    
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
      logger.info(`Users with this role: ${role.users.length}`);
      
      // Show sample users
      const sampleUsers = role.users.slice(0, 3);
      for (const user of sampleUsers) {
        logger.info(`  - ${user.name} (${user.email})`);
      }
      
      if (role.users.length > 3) {
        logger.info(`  ... and ${role.users.length - 3} more users`);
      }
    }
    
  } catch (error) {
    logger.error('Error checking roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();