const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Test if we can connect to the database
    const pcCount = await prisma.pC.count();
    console.log(`Connected to database. PC table has ${pcCount} records.`);
    
    // Test a simple search query
    console.log('Testing search query...');
    const searchResults = await prisma.$queryRawUnsafe(
      `SELECT id, "cpuBarcode", "pcName" 
       FROM "PC" 
       WHERE "search_vector" @@ websearch_to_tsquery('english', $1)
       LIMIT 5`,
      'working'
    );
    console.log('Search results:', searchResults);
    
    // Test counting with search
    console.log('Testing search count query...');
    const countResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count
       FROM "PC" 
       WHERE "search_vector" @@ websearch_to_tsquery('english', $1)`,
      'working'
    );
    console.log('Search count result:', countResult);
    
  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();