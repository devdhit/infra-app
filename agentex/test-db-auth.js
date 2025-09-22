const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('Testing database connection and authentication...');
    
    // Check if we can connect to the database
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'adminit@localhost.com' }
    });
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:', user.email);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('password', user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('The password in the database might be different');
      console.log('First 20 characters of hash:', user.password.substring(0, 20));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testAuth();
}