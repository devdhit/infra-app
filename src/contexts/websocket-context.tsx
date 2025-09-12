'use client'

import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'
// Use Socket.IO client instead of raw WebSocket
import { io, Socket } from 'socket.io-client'

interface WebSocketContextType {
  isConnected: boolean
  sendMessage: (message: any) => void
  disconnect: () => void
  reconnectAttempts: number
  assetUpdates: any[]
  addAssetUpdate: (update: any) => void
  clearAssetUpdates: () => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { t } = useTranslation()
  const [assetUpdates, setAssetUpdates] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [socket, setSocket] = useState<Socket | null>(null)
  
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type || message.action) {
      case 'ASSET_CREATED':
      case 'ASSET_UPDATED':
      case 'ASSET_DELETED':
      case 'create':
      case 'update':
      case 'delete':
        // Add to asset updates list
        setAssetUpdates(prev => [message.payload || message.data, ...prev.slice(0, 9)])
        
        // Show toast notification
        const action = message.type || message.action
        const actionMap: Record<string, string> = {
          ASSET_CREATED: t('assets.create.success', 'Asset created successfully') || 'Asset created',
          ASSET_UPDATED: t('assets.update.success', 'Asset updated successfully') || 'Asset updated',
          ASSET_DELETED: t('assets.delete.success', 'Asset deleted successfully') || 'Asset deleted',
          create: t('assets.create.success', 'Asset created successfully') || 'Asset created',
          update: t('assets.update.success', 'Asset updated successfully') || 'Asset updated',
          delete: t('assets.delete.success', 'Asset deleted successfully') || 'Asset deleted'
        }
        
        const payload = message.payload || message.data
        toast.info(
          actionMap[action] || t('common.update') || 'Asset updated',
          {
            description: payload?.name || payload?.id,
            duration: 5000
          }
        )
        break
        
      case 'LICENSE_EXPIRING':
        toast.warning(
          t('dashboard.licensesExpiring') || 'License expiring',
          {
            description: message.payload?.name,
            duration: 10000
          }
        )
        break
        
      case 'MAINTENANCE_DUE':
        toast.warning(
          t('assets.status.repair') || 'Maintenance due',
          {
            description: message.payload?.name,
            duration: 10000
          }
        )
        break
        
      default:
        console.log('Unknown Socket.IO message type:', message.type || message.action)
    }
  }, [t])

  // Initialize Socket.IO client
  useEffect(() => {
    // Create Socket.IO client instance
    const newSocket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    setSocket(newSocket)

    // Set up event listeners
    newSocket.on('connect', () => {
      console.log('Socket.IO connected')
      setIsConnected(true)
      setReconnectAttempts(0)
      toast.success(t('common.success') || 'Connected to real-time updates')
    })

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason)
      setIsConnected(false)
      toast.info(t('common.info') || 'Disconnected from real-time updates')
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
      setIsConnected(false)
      toast.error(t('common.error') || 'Connection error with real-time updates')
    })

    newSocket.on('asset-change', (message) => {
      console.log('Socket.IO message received:', message)
      handleWebSocketMessage(message)
    })

    // Clean up on unmount
    return () => {
      newSocket.close()
    }
  }, [t, handleWebSocketMessage])

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.emit('message', message)
    } else {
      console.warn('Socket.IO is not connected. Message not sent:', message)
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.close()
    }
  }

  const addAssetUpdate = (update: any) => {
    setAssetUpdates(prev => [update, ...prev.slice(0, 9)])
  }

  const clearAssetUpdates = () => {
    setAssetUpdates([])
  }

  // Simulate periodic updates for demonstration (only in development)
  useEffect(() => {
    if (!isConnected || process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      // Simulate random asset updates
      if (Math.random() > 0.8) {
        const actions = ['ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_DELETED']
        const randomAction = actions[Math.floor(Math.random() * actions.length)]
        
        const mockUpdate = {
          type: randomAction,
          payload: {
            id: Math.random().toString(36).substr(2, 9),
            name: `Asset ${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString()
          }
        }
        
        handleWebSocketMessage(mockUpdate)
      }
    }, 30000) // Check for updates every 30 seconds

    return () => clearInterval(interval)
  }, [isConnected, t, handleWebSocketMessage])

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        disconnect,
        reconnectAttempts,
        assetUpdates,
        addAssetUpdate,
        clearAssetUpdates
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider')
  }
  return context
}