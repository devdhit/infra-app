// Script to view audit logs
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function viewAuditLogs() {
  try {
    console.log('Fetching recent audit logs...');
    
    // Get audit logs with user information
    const auditLogs = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 20, // Last 20 actions
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: {
              select: {
                name: true
              }
            }
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log(`\nFound ${auditLogs.length} recent audit logs:\n`);
    
    for (const log of auditLogs) {
      const user = log.user ? `${log.user.name} (${log.user.email})` : 'System';
      const role = log.user?.role?.name || 'N/A';
      const tenant = log.tenant?.name || 'N/A';
      
      console.log(`[${log.createdAt.toISOString()}] ${log.action.toUpperCase()} ${log.modelType}`);
      console.log(`  User: ${user} [${role}]`);
      console.log(`  Tenant: ${tenant}`);
      console.log(`  Record ID: ${log.recordId}`);
      
      // Show some details of changes if available
      if (log.changes && Object.keys(log.changes).length > 0) {
        if (typeof log.changes === 'object') {
          const changeKeys = Object.keys(log.changes);
          if (changeKeys.length <= 5) {
            console.log(`  Changes: ${JSON.stringify(log.changes)}`);
          } else {
            console.log(`  Changes: ${changeKeys.length} fields modified`);
          }
        } else {
          console.log(`  Changes: ${log.changes}`);
        }
      }
      
      console.log('');
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
viewAuditLogs();