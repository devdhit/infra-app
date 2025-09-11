#!/usr/bin/env node

// Test script to verify search performance improvements
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function testSearchPerformance() {
  try {
    console.log('Testing search performance improvements...');
    
    // Test tenant ID (use the first tenant in the database)
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      console.log('No tenant found in database');
      return;
    }
    
    console.log(`Testing with tenant: ${tenant.name} (${tenant.id})`);
    
    // Test search performance on PC table
    console.log('\n=== Testing PC Search Performance ===');
    
    // Test with full-text search
    console.time('Full-text search (PC)');
    const pcResults = await prisma.pC.findMany({
      where: {
        tenantId: tenant.id,
        search_vector: {
          search: 'working'
        }
      },
      take: 10
    });
    console.timeEnd('Full-text search (PC)');
    console.log(`Found ${pcResults.length} PC results`);
    
    // Test with traditional search
    console.time('Traditional search (PC)');
    const pcTraditionalResults = await prisma.pC.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { dept: { contains: 'working', mode: 'insensitive' } },
          { pcName: { contains: 'working', mode: 'insensitive' } },
          { userName: { contains: 'working', mode: 'insensitive' } },
          { status: { contains: 'working', mode: 'insensitive' } },
          { note: { contains: 'working', mode: 'insensitive' } }
        ]
      },
      take: 10
    });
    console.timeEnd('Traditional search (PC)');
    console.log(`Found ${pcTraditionalResults.length} PC results (traditional)`);
    
    // Test search performance on Laptop table
    console.log('\n=== Testing Laptop Search Performance ===');
    
    // Test with full-text search
    console.time('Full-text search (Laptop)');
    const laptopResults = await prisma.laptop.findMany({
      where: {
        tenantId: tenant.id,
        search_vector: {
          search: 'laptop'
        }
      },
      take: 10
    });
    console.timeEnd('Full-text search (Laptop)');
    console.log(`Found ${laptopResults.length} Laptop results`);
    
    // Test with traditional search
    console.time('Traditional search (Laptop)');
    const laptopTraditionalResults = await prisma.laptop.findMany({
      where: {
        tenantId: tenant.id,
        OR: [
          { dept: { contains: 'laptop', mode: 'insensitive' } },
          { barcode: { contains: 'laptop', mode: 'insensitive' } },
          { userName: { contains: 'laptop', mode: 'insensitive' } },
          { model: { contains: 'laptop', mode: 'insensitive' } },
          { status: { contains: 'laptop', mode: 'insensitive' } }
        ]
      },
      take: 10
    });
    console.timeEnd('Traditional search (Laptop)');
    console.log(`Found ${laptopTraditionalResults.length} Laptop results (traditional)`);
    
    console.log('\n=== Performance Test Complete ===');
    console.log('Full-text search should be significantly faster than traditional search for large datasets.');
    
  } catch (error) {
    console.error('Error during search performance test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSearchPerformance().catch(console.error);