const { PrismaClient } = require('../src/generated/prisma');

async function testPrisma() {
  const db = new PrismaClient();
  
  try {
    const laptops = await db.laptop.findMany();
    console.log('Success: Found', laptops.length, 'laptops');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await db.$disconnect();
  }
}

testPrisma();