#!/usr/bin/env node

// Verification script for trigram indexes
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function verifyTrigramIndexes() {
  console.log('🔍 Verifying Trigram Indexes...\n');
  
  try {
    // Check if pg_trgm extension is available
    console.log('1. Checking pg_trgm extension...');
    const extensions = await prisma.$queryRaw`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'pg_trgm'
    `;
    
    if (extensions.length > 0) {
      console.log(`  ✅ pg_trgm extension is installed (version: ${extensions[0].extversion})`);
    } else {
      console.log('  ❌ pg_trgm extension is not installed');
      return;
    }
    
    // Check if trigram operators are available
    console.log('\n2. Checking trigram operators...');
    try {
      const operatorCheck = await prisma.$queryRaw`
        SELECT oprname 
        FROM pg_operator 
        WHERE oprname = '%'
        LIMIT 1
      `;
      
      if (operatorCheck.length > 0) {
        console.log('  ✅ Trigram similarity operator (%) is available');
      } else {
        console.log('  ⚠️  Trigram similarity operator (%) not found');
      }
    } catch (error) {
      console.log('  ⚠️  Could not check trigram operators:', error.message);
    }
    
    // Try to create a simple trigram index to test
    console.log('\n3. Testing trigram index creation...');
    try {
      // Create a temporary table for testing
      await prisma.$queryRaw`CREATE TEMP TABLE test_trigram (name TEXT)`;
      await prisma.$queryRaw`CREATE INDEX test_trigram_idx ON test_trigram USING GIN (name gin_trgm_ops)`;
      await prisma.$queryRaw`DROP TABLE test_trigram`;
      console.log('  ✅ Trigram index creation test successful');
    } catch (error) {
      console.log('  ❌ Trigram index creation test failed:', error.message);
    }
    
    console.log('\n📋 Trigram index verification completed!');
    
  } catch (error) {
    console.error('❌ Trigram index verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTrigramIndexes();