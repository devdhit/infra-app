const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Check the structure of the Internet table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Internet' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Internet table columns:');
    console.table(result);
    
    // Check if there are any records
    const count = await prisma.internet.count();
    console.log(`Total Internet records: ${count}`);
    
    if (count > 0) {
      const sample = await prisma.internet.findFirst();
      console.log('Sample record:');
      console.log(sample);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();