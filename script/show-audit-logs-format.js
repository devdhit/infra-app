// Script to show the exact format of audit logs as displayed in the UI
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function showAuditLogsFormat() {
  try {
    console.log('=== AUDIT LOGS DISPLAY FORMAT ===\n');
    
    // Get a sample of audit logs with all relevant information
    const auditLogs = await prisma.history.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 5, // Just a few examples
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
        }
      }
    });
    
    console.log('Each audit log entry displays the following information:\n');
    
    auditLogs.forEach((log, index) => {
      console.log(`--- ENTRY ${index + 1} ---`);
      console.log(`Date/Time: ${log.createdAt.toLocaleString()}`);
      console.log(`User: ${log.user ? `${log.user.name} <${log.user.email}>` : 'System'}`);
      console.log(`Role: ${log.user?.role?.name || 'N/A'}`);
      console.log(`Action: ${log.action}`);
      console.log(`Model Type: ${log.modelType}`);
      console.log(`Record ID: ${log.recordId}`);
      
      // Show changes in a readable format
      if (log.changes) {
        if (typeof log.changes === 'object' && Object.keys(log.changes).length > 0) {
          console.log(`Changes: ${JSON.stringify(log.changes, null, 2)}`);
        } else if (typeof log.changes === 'string') {
          console.log(`Changes: ${log.changes}`);
        } else {
          console.log(`Changes: ${JSON.stringify(log.changes)}`);
        }
      } else {
        console.log(`Changes: No changes recorded`);
      }
      
      console.log(''); // Empty line for spacing
    });
    
    console.log('=== UI TABLE COLUMNS ===');
    console.log('The audit logs table in the UI has these columns:');
    console.log('1. Date/Time     - When the action occurred');
    console.log('2. User          - Who performed the action');
    console.log('3. Role          - User\'s role');
    console.log('4. Action        - Type of action (create, update, delete, etc.)');
    console.log('5. Model         - What was affected (User, Role, PC, etc.)');
    console.log('6. Record ID     - Specific record identifier');
    console.log('7. Changes       - Details of what was changed');
    console.log('');
    console.log('You can filter by:');
    console.log('- Model Type (PC, User, Role, etc.)');
    console.log('- Action Type (create, update, delete, etc.)');
    console.log('- Search terms');
    console.log('- Date ranges');
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
showAuditLogsFormat();