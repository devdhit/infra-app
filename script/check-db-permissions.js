const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

const prisma = new PrismaClient();

async function checkDbPermissions() {
  logger.info('Checking database permissions...');
  
  // Check DATABASE_URL environment variable
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    logger.error('DATABASE_URL not found in environment');
    return;
  }
  
  // Validate DATABASE_URL format
  const urlPattern = /^postgresql:\/\/[^:]+:[^@]+@[^:]+:\d+\/.+$/;
  if (!urlPattern.test(databaseUrl)) {
    logger.error('Invalid DATABASE_URL format');
    return;
  }
  
  try {
    logger.info('Checking admin role permissions...');
    
    // Try to find admin role
    const adminRole = await prisma.role.findFirst({
      where: {
        name: 'admin'
      }
    });
    
    if (adminRole) {
      logger.info('Admin role found with permissions:', adminRole.permissions);
    } else {
      logger.warn('No admin role found in database');
    }
    
    // Try to find any user with admin role
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          name: 'admin'
        }
      },
      include: {
        role: true
      }
    });
    
    if (adminUser) {
      logger.info('Admin user found:', {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role.name
      });
    } else {
      logger.warn('No admin user found in database');
    }
    
  } catch (error) {
    logger.error('Database permission check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbPermissions();