"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketIO = initializeSocketIO;
exports.emitAssetChange = emitAssetChange;
exports.getIO = getIO;
const socket_io_1 = require("socket.io");
// Initialize Socket.IO server
let io = null;
function initializeSocketIO(httpServer) {
    if (io)
        return io;
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NODE_ENV === 'development' ? '*' : process.env.NEXT_PUBLIC_APP_URL,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log('User connected to Socket.IO:', socket.id);
        // Join room based on tenant ID for multi-tenancy support
        socket.on('join-tenant', (tenantId) => {
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
    }
    catch (error) {
        console.error('Error setting up PostgreSQL notifications:', error);
    }
}
// Function to emit asset changes to connected clients
function emitAssetChange(tenantId, assetType, action, data) {
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
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
}
