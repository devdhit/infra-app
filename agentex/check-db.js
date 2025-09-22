const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('Checking if user adminit@localhost.com exists...');
    
    const user = await prisma.user.findUnique({
      where: {
        email: 'adminit@localhost.com'
      },
      include: {
        role: true
      }
    });
    
    if (user) {
      console.log('User found:');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role?.name || 'No role');
      console.log('Password hash:', user.password.substring(0, 20) + '...');
    } else {
      console.log('User not found');
      
      // Let's check what users exist
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          role: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log('All users in database:');
      users.forEach(u => {
        console.log(`- ${u.email} (${u.name}) - Role: ${u.role?.name || 'No role'}`);
      });
    }
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkUser();
}