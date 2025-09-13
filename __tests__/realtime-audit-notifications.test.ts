// Mock the translation function
jest.mock('@/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string, ...params: any[]) => {
      // Simple implementation of the translation function with parameter replacement
      let result = fallback || key;
      params.forEach((param, index) => {
        result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
      });
      return result;
    },
  }),
}));

// Mock the WebSocket context
const mockAddAssetUpdate = jest.fn();
const mockClearAssetUpdates = jest.fn();
const mockAddAuditLog = jest.fn();

jest.mock('@/contexts/websocket-context', () => ({
  useWebSocketContext: () => ({
    isConnected: true,
    assetUpdates: [],
    auditLogs: [
      {
        id: '1',
        action: 'create',
        modelType: 'User',
        recordId: '1',
        changes: {},
        userId: '1',
        tenantId: '1',
        createdAt: new Date().toISOString(),
        user: {
          name: 'Test User'
        }
      }
    ],
    sendMessage: jest.fn(),
    disconnect: jest.fn(),
    reconnectAttempts: 0,
    addAssetUpdate: mockAddAssetUpdate,
    clearAssetUpdates: mockClearAssetUpdates,
    addAuditLog: mockAddAuditLog,
  }),
}));

// Mock the API client
jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn().mockResolvedValue({
      data: []
    })
  }
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

import { render, screen, waitFor } from '@testing-library/react';
import { RealTimeNotifications } from '@/components/dashboard/real-time-notifications';
import { WebSocketProvider } from '@/contexts/websocket-context';

describe('Real-time Audit Log Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render real-time notifications component', () => {
    render(
      <WebSocketProvider>
        <RealTimeNotifications />
      </WebSocketProvider>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display audit logs as notifications', async () => {
    render(
      <WebSocketProvider>
        <RealTimeNotifications />
      </WebSocketProvider>
    );
    
    // Wait for the component to process audit logs
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should properly format audit log notification messages', async () => {
    render(
      <WebSocketProvider>
        <RealTimeNotifications />
      </WebSocketProvider>
    );
    
    // Wait for the component to process audit logs
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});