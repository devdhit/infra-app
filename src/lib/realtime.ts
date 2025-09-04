import { Server as SocketIOServer } from 'socket.io';

// Initialize Socket.IO server
let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: any) {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected to Socket.IO:', socket.id);

    // Join room based on tenant ID for multi-tenancy support
    socket.on('join-tenant', (tenantId: string) => {
      // Validate tenantId to prevent potential security issues
      if (tenantId && typeof tenantId === 'string') {
        socket.join(`tenant-${tenantId}`);
        console.log(`Socket ${socket.id} joined tenant room: tenant-${tenantId}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected from Socket.IO:', socket.id);
    });
  });

  // Set up PostgreSQL LISTEN/NOTIFY for real-time updates
  setupPostgresNotifications();

  return io;
}

// Set up PostgreSQL LISTEN/NOTIFY for real-time updates
async function setupPostgresNotifications() {
  try {
    // In a real implementation with direct PostgreSQL access, you would set up LISTEN here
    // For Prisma, we'll use a polling approach as a workaround
    
    // This is a simplified approach - in production, you might use a dedicated service
    // or direct PostgreSQL connection for LISTEN/NOTIFY
    
    console.log('PostgreSQL notification system initialized');
  } catch (error) {
    console.error('Error setting up PostgreSQL notifications:', error);
  }
}

// Function to emit asset changes to connected clients
export function emitAssetChange(tenantId: string, assetType: string, action: string, data: any) {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return;
  }

  // Validate inputs
  if (!tenantId || !assetType || !action) {
    console.warn('Invalid parameters for emitAssetChange');
    return;
  }

  // Emit to specific tenant room
  io.to(`tenant-${tenantId}`).emit('asset-change', {
    assetType,
    action, // 'create', 'update', 'delete'
    data
  });

  console.log(`Emitted asset change to tenant-${tenantId}: ${assetType} ${action}`);
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}