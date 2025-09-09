// Script to initialize audit logs settings for all tenants that don't have them
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function initAuditLogsSettings() {
  try {
    console.log('Initializing audit logs settings for all tenants...');
    
    // Get all tenants
    const tenants = await prisma.tenant.findMany();
    console.log(`Found ${tenants.length} tenants`);
    
    let initializedCount = 0;
    
    for (const tenant of tenants) {
      console.log(`\nChecking tenant: ${tenant.name} (${tenant.id})`);
      
      // Check if audit logs settings exist for this tenant
      let auditLogsSettings = await prisma.auditLogsSettings.findUnique({
        where: {
          tenantId: tenant.id
        }
      });
      
      if (!auditLogsSettings) {
        console.log('  No audit logs settings found, creating default settings...');
        
        // Create default audit logs settings
        auditLogsSettings = await prisma.auditLogsSettings.create({
          data: {
            tenantId: tenant.id,
            enabled: true,
            retentionPeriod: 90,
            logAssetCreation: true,
            logAssetUpdates: true,
            logAssetDeletion: true,
            logUserLogin: true,
            logUserLogout: true,
            logPermissionChanges: true,
            notifyOnCriticalEvents: true,
            emailNotifications: true,
            slackNotifications: false,
            notificationEmail: null, // Will be set when user accesses the settings
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log('  Created audit logs settings:', {
          enabled: auditLogsSettings.enabled,
          retentionPeriod: auditLogsSettings.retentionPeriod
        });
        
        initializedCount++;
      } else {
        console.log('  Audit logs settings already exist');
      }
    }
    
    console.log(`\nInitialized audit logs settings for ${initializedCount} tenants`);
    console.log('Audit logs settings initialization completed successfully!');
  } catch (error) {
    console.error('Audit logs settings initialization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initAuditLogsSettings();