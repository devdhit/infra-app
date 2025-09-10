import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import logger from '@/lib/logger';

export function useRealtimeUpdates(tenantId: string, assetType: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
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
      
      // Join tenant room
      if (tenantId) {
        socket.emit('join-tenant', tenantId);
      }
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
        
        // Invalidate and refetch queries for this asset type
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
      }
    };

    socket.on('asset-change', handleAssetChange);

    // Cleanup function
    return () => {
      socket.off('asset-change', handleAssetChange);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.close();
    };
  }, [tenantId, assetType, queryClient]);
  
  return { isConnected };
}