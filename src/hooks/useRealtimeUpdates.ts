import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeUpdates(tenantId: string, assetType: string) {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection with proper configuration
    const socket = io({
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server with ID:', socket.id);
      setIsConnected(true);
      
      // Join tenant room
      if (tenantId) {
        socket.emit('join-tenant', tenantId);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
    });

    // Listen for asset changes
    const handleAssetChange = (data: { assetType: string; action: string; data: any }) => {
      // Only process updates for the current asset type
      if (data.assetType === assetType) {
        console.log(`Received real-time update for ${assetType}:`, data);
        
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