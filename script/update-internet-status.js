#!/usr/bin/env node

// Script to update Internet assets status from working/leave/repair to 有異動
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateInternetStatuses() {
  try {
    console.log('Starting Internet asset status update...');
    
    // Find all Internet assets with working, leave, or repair status
    const internetAssets = await prisma.internet.findMany({
      where: {
        status: {
          in: ['working', 'leave', 'repair']
        }
      }
    });
    
    console.log(`Found ${internetAssets.length} Internet assets to update`);
    
    // Update each asset
    let updatedCount = 0;
    for (const asset of internetAssets) {
      await prisma.internet.update({
        where: { id: asset.id },
        data: { status: '有異動' }
      });
      updatedCount++;
      
      // Log progress every 100 updates
      if (updatedCount % 100 === 0) {
        console.log(`Updated ${updatedCount} assets...`);
      }
    }
    
    console.log(`Successfully updated ${updatedCount} Internet assets to 有異動 status`);
    
    // Close the database connection
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error updating Internet asset statuses:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the update function
updateInternetStatuses();