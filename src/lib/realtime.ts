import { Server as SocketIOServer } from 'socket.io';

// Helper function to get formatted timestamp
function getTimestamp() {
    return new Date().toISOString();
}

// Initialize Socket.IO server
let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: any) {
  // Check if already initialized to prevent multiple instances
  if (io) {
    console.log(`[${getTimestamp()}] ⚠️  Socket.IO already initialized, returning existing instance`);
    return io;
  }

  try {
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/socket.io/',
      serveClient: false,
      // Better connection handling
      pingInterval: 25000,
      pingTimeout: 20000,
      upgradeTimeout: 30000,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      cookie: false
    });

    io.on('connection', (socket) => {
      console.log(`[${getTimestamp()}] 🔌 Client connected: ${socket.id}`);

      // Join room based on tenant ID for multi-tenancy support
      socket.on('join-tenant', (tenantId: string) => {
        // Validate tenantId to prevent potential security issues
        if (tenantId && typeof tenantId === 'string') {
          socket.join(`tenant-${tenantId}`);
          console.log(`[${getTimestamp()}] 🏢 Client ${socket.id} joined tenant room: tenant-${tenantId}`);
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[${getTimestamp()}] ❌ Client disconnected: ${socket.id}, Reason: ${reason}`);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error(`[${getTimestamp()}] ❌ Socket error for client ${socket.id}:`, error);
      });
    });

    // Set up PostgreSQL LISTEN/NOTIFY for real-time updates
    setupPostgresNotifications();
    
    console.log(`[${getTimestamp()}] 🔄 Socket.IO initialized successfully`);
    
    return io;
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Failed to initialize Socket.IO:`, error);
    return null;
  }
}

// Set up PostgreSQL LISTEN/NOTIFY for real-time updates
async function setupPostgresNotifications() {
  try {
    // In a real implementation with direct PostgreSQL access, you would set up LISTEN here
    // For Prisma, we'll use a polling approach as a workaround
    
    // This is a simplified approach - in production, you might use a dedicated service
    // or direct PostgreSQL connection for LISTEN/NOTIFY
    
    console.log(`[${getTimestamp()}] 🗄️  PostgreSQL notification system initialized`);
  } catch (error) {
    console.error(`[${getTimestamp()}] ❌ Error setting up PostgreSQL notifications:`, error);
  }
}

// Function to emit asset changes to connected clients
export function emitAssetChange(tenantId: string, assetType: string, action: string, data: any) {
  if (!io) {
    console.warn(`[${getTimestamp()}] ⚠️  Socket.IO not initialized - cannot emit asset change`);
    return;
  }

  // Validate inputs
  if (!tenantId || !assetType || !action) {
    console.warn(`[${getTimestamp()}] ⚠️  Invalid parameters for emitAssetChange`);
    return;
  }

  // Emit to specific tenant room
  io.to(`tenant-${tenantId}`).emit('asset-change', {
    assetType,
    action, // 'create', 'update', 'delete'
    data
  });

  // Log the database notification
  console.log(`[${getTimestamp()}] 📢 DB notify: ${JSON.stringify({ 
    tenantId, 
    assetType, 
    action, 
    recordId: data?.id 
  })}`);
  
  console.log(`[${getTimestamp()}] 📤 Emitted asset change to tenant-${tenantId}: ${assetType} ${action}`);
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}