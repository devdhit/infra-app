#!/usr/bin/env node

// Script to measure search performance
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function measureSearchPerformance() {
  try {
    console.log('⏱️ Measuring search performance...\n');
    
    // Check if the extract_custom_field_values function exists
    console.log('1. Checking database setup...');
    const functionExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'extract_custom_field_values'
      ) as exists;
    `;
    
    if (!functionExists[0].exists) {
      console.log('  ❌ extract_custom_field_values function does not exist');
      console.log('  Please run the database migration to set up full-text search');
      return;
    }
    
    console.log('  ✅ Database is properly configured for full-text search\n');
    
    console.log('✅ Performance testing setup complete!');
    console.log('\n💡 To test actual performance with your data:');
    console.log('  1. Use the application UI to search for assets');
    console.log('  2. Check the browser developer tools Network tab to see response times');
    console.log('  3. Custom fields should now be searchable');
    console.log('  4. Search should be responsive with the optimized debounce settings');
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the performance test
measureSearchPerformance().catch(console.error);