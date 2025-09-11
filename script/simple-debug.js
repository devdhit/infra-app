#!/usr/bin/env node

// Simple debug script to check search functionality
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function simpleDebug() {
  console.log('🔍 Simple Search Debug...\n');
  
  try {
    // Test if search vectors are working
    console.log('1. Testing search for "windows" (should find custom field values)...');
    const windowsResults = await prisma.$queryRawUnsafe(`
      SELECT 
        "pcName",
        "customFields",
        ts_rank("search_vector", websearch_to_tsquery('english', $1)) AS rank
      FROM "PC"
      WHERE "search_vector" @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 3
    `, 'windows');
    
    console.log(`Found ${windowsResults.length} results for "windows":`);
    windowsResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.pcName} (Rank: ${result.rank})`);
    });
    
    // Test search for "ssd"
    console.log('\n2. Testing search for "ssd" (should find custom field values)...');
    const ssdResults = await prisma.$queryRawUnsafe(`
      SELECT 
        "pcName",
        "customFields",
        ts_rank("search_vector", websearch_to_tsquery('english', $1)) AS rank
      FROM "PC"
      WHERE "search_vector" @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 3
    `, 'ssd');
    
    console.log(`Found ${ssdResults.length} results for "ssd":`);
    ssdResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.pcName} (Rank: ${result.rank})`);
    });
    
    // Test search for user name
    console.log('\n3. Testing search for "nguyen" (should find user names)...');
    const nguyenResults = await prisma.$queryRawUnsafe(`
      SELECT 
        "pcName",
        "userName",
        ts_rank("search_vector", websearch_to_tsquery('english', $1)) AS rank
      FROM "PC"
      WHERE "search_vector" @@ websearch_to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 3
    `, 'nguyen');
    
    console.log(`Found ${nguyenResults.length} results for "nguyen":`);
    nguyenResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.pcName} - ${result.userName} (Rank: ${result.rank})`);
    });
    
    console.log('\n✅ Simple debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleDebug();