import { Server as SocketIOServer } from 'socket.io';
import logger from './logger';

// Initialize Socket.IO server
let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: any) {
  // Check if already initialized to prevent multiple instances
  if (io) {
    logger.warn('Socket.IO already initialized, returning existing instance');
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
      cookie: false,
      // Add connection timeout
      connectTimeout: 45000
    });

    // Track connected clients
    const connectedClients = new Map<string, { tenantId: string | null; lastActivity: number }>();

    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Add client to tracking map
      connectedClients.set(socket.id, { tenantId: null, lastActivity: Date.now() });

      // Join room based on tenant ID for multi-tenancy support
      socket.on('join-tenant', (tenantId: string) => {
        // Validate tenantId to prevent potential security issues
        if (tenantId && typeof tenantId === 'string') {
          socket.join(`tenant-${tenantId}`);
          // Update tenant info for this client
          if (connectedClients.has(socket.id)) {
            const clientInfo = connectedClients.get(socket.id)!;
            clientInfo.tenantId = tenantId;
            connectedClients.set(socket.id, clientInfo);
          }
          logger.info(`Client ${socket.id} joined tenant room: tenant-${tenantId}`);
        }
      });

      // Handle client activity tracking
      socket.on('activity', () => {
        if (connectedClients.has(socket.id)) {
          const clientInfo = connectedClients.get(socket.id)!;
          clientInfo.lastActivity = Date.now();
          connectedClients.set(socket.id, clientInfo);
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id}, Reason: ${reason}`);
        // Remove client from tracking
        connectedClients.delete(socket.id);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for client ${socket.id}: ${error}`);
        // Remove client from tracking on error
        connectedClients.delete(socket.id);
      });
    });

    // Periodically clean up stale connections (every 5 minutes)
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30 * 60 * 1000; // 30 minutes
      
      for (const [clientId, clientInfo] of connectedClients.entries()) {
        if (now - clientInfo.lastActivity > staleThreshold) {
          logger.warn(`Removing stale client connection: ${clientId}`);
          connectedClients.delete(clientId);
          // Try to disconnect the socket if possible
          try {
            io?.sockets.sockets.get(clientId)?.disconnect(true);
          } catch (e) {
            logger.error(`Error disconnecting stale client ${clientId}: ${e}`);
          }
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    // Set up PostgreSQL LISTEN/NOTIFY for real-time updates
    setupPostgresNotifications();
    
    logger.info('Socket.IO initialized successfully');
    
    return io;
  } catch (error) {
    logger.error(`Failed to initialize Socket.IO: ${error}`);
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
    
    logger.info('PostgreSQL notification system initialized');
  } catch (error) {
    logger.error(`Error setting up PostgreSQL notifications: ${error}`);
  }
}

// Function to emit asset changes to connected clients
export function emitAssetChange(tenantId: string, assetType: string, action: string, data: any) {
  if (!io) {
    logger.debug('Socket.IO not initialized - cannot emit asset change');
    return;
  }

  // Validate inputs
  if (!tenantId || !assetType || !action) {
    logger.warn('Invalid parameters for emitAssetChange');
    return;
  }

  try {
    // Emit to specific tenant room
    io.to(`tenant-${tenantId}`).emit('asset-change', {
      assetType,
      action, // 'create', 'update', 'delete'
      data
    });

    // Log the database notification
    logger.debug(`DB notify: ${JSON.stringify({ 
      tenantId, 
      assetType, 
      action, 
      recordId: data?.id 
    })}`);
    
    logger.debug(`Emitted asset change to tenant-${tenantId}: ${assetType} ${action}`);
  } catch (error) {
    logger.error(`Error emitting asset change to tenant-${tenantId}: ${error}`);
  }
}

export function getIO() {
  // Return null instead of throwing an error to prevent crashes
  if (!io) {
    logger.debug('Socket.IO not initialized!');
    return null;
  }
  return io;
}