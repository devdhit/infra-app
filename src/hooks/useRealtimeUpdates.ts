import { useState, useCallback } from 'react';
import io from 'socket.io-client';
import logger from '@/lib/logger';

export function useRealtimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);

  // Return a subscribe function that components can use to listen for updates
  const subscribeToUpdates = useCallback((
    assetType: string, 
    callback: (action: string, data: any) => void
  ) => {
    // Initialize socket connection with proper configuration
    // Use the full URL in production, relative path in development
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      : '';
      
    const socket = io(socketUrl, {
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: false,
      timeout: 20000,
    });

    socket.on('connect', () => {
      logger.info('Connected to Socket.IO server with ID:', socket.id);
      setIsConnected(true);
      
      // Join tenant room (this would need to be passed in or obtained from context)
      // For now, we'll assume tenantId is handled elsewhere
    });
    
    socket.on('disconnect', (reason) => {
      logger.info('Disconnected from Socket.IO server. Reason:', reason);
      setIsConnected(false);
      
      // Handle specific disconnection reasons
      if (reason === 'io server disconnect') {
        // The disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      logger.error('Socket.IO connection error:', error);
      
      // Handle specific connection errors
      if (error.message.includes('xhr poll error')) {
        logger.info('XHR poll error detected. Will attempt to reconnect...');
        // Socket.IO will automatically try to reconnect based on our reconnection settings
      }
    });

    // Listen for asset changes
    const handleAssetChange = (data: { assetType: string; action: string; data: any }) => {
      // Only process updates for the current asset type
      if (data.assetType === assetType) {
        logger.info(`Received real-time update for ${assetType}:`, data);
        
        // Call the provided callback to notify the component
        callback(data.action, data.data);
      }
    };

    socket.on('asset-change', handleAssetChange);

    // Return unsubscribe function
    return () => {
      socket.off('asset-change', handleAssetChange);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.close();
    };
  }, []);

  return { isConnected, subscribeToUpdates };
}