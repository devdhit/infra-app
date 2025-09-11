import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssetList } from '@/components/assets/asset-list';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCurrentUser, useCustomFields, useAssets } from '@/hooks/useApi';
import { useTranslation } from '@/hooks/use-translation';
import { ToastProvider } from 'sonner';

// Mock the hooks and components
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn().mockReturnValue({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/hooks/useApi', () => {
  const mockRefetch = jest.fn();
  return {
    useCurrentUser: jest.fn(),
    useCustomFields: jest.fn(),
    useAssets: jest.fn().mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    }),
    useDeleteAsset: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
    useBulkDeleteAssets: jest.fn().mockReturnValue({
      mutateAsync: jest.fn(),
    }),
  };
});

jest.mock('@/hooks/use-translation', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string, fallback: string) => fallback || key,
  }),
}));

jest.mock('@/hooks/useRealtimeUpdates', () => ({
  useRealtimeUpdates: jest.fn(),
}));

// Mock the components
jest.mock('@/components/ui/data-table', () => ({
  DataTable: () => <div data-testid="data-table">DataTable</div>,
}));

jest.mock('@/components/assets/asset-form', () => ({
  AssetFormDialog: () => <div>AssetFormDialog</div>,
}));

jest.mock('@/components/assets/asset-detail-dialog', () => ({
  AssetDetailDialog: () => <div>AssetDetailDialog</div>,
}));

jest.mock('@/components/assets/delete-confirm-dialog', () => ({
  DeleteConfirmDialog: () => <div>DeleteConfirmDialog</div>,
}));

jest.mock('@/components/assets/bulk-delete-dialog', () => ({
  BulkDeleteDialog: () => <div>BulkDeleteDialog</div>,
}));

jest.mock('@/components/assets/excel-import-dialog', () => ({
  ExcelImportDialog: () => <div>ExcelImportDialog</div>,
}));

jest.mock('@/components/assets/excel-export-dialog', () => ({
  ExcelExportDialog: () => <div>ExcelExportDialog</div>,
}));

jest.mock('@/components/ui/inline-edit-cell', () => ({
  InlineEditCell: () => <div>InlineEditCell</div>,
}));

const queryClient = new QueryClient();

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        {component}
      </ToastProvider>
    </QueryClientProvider>
  );
};

describe('AssetList Search Optimization', () => {
  const mockRefetch = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      replace: jest.fn(),
    });
    
    (useCurrentUser as jest.Mock).mockReturnValue({
      data: { tenantId: 'test-tenant' },
    });
    
    (useCustomFields as jest.Mock).mockReturnValue({
      data: [],
      refetch: jest.fn(),
    });
    
    (useAssets as jest.Mock).mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should debounce search input and only trigger after user stops typing', async () => {
    jest.useFakeTimers();
    
    const mockColumns = [
      { key: 'cpuBarcode', label: 'CPU Barcode' },
      { key: 'pcName', label: 'PC Name' },
    ];
    
    const mockFormFields = [
      { name: 'cpuBarcode', label: 'CPU Barcode', type: 'text', required: true },
      { name: 'pcName', label: 'PC Name', type: 'text', required: true },
    ];

    renderWithProviders(
      <AssetList
        assetType="pc"
        title="PC"
        columns={mockColumns}
        formFields={mockFormFields}
        canView={true}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        canBulkDelete={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search assets...');
    
    // Simulate user typing quickly
    fireEvent.change(searchInput, { target: { value: 'a' } });
    fireEvent.change(searchInput, { target: { value: 'ab' } });
    fireEvent.change(searchInput, { target: { value: 'abc' } });
    
    // Advance timers by 300ms - should not have triggered search yet
    jest.advanceTimersByTime(300);
    
    // Advance timers by another 300ms (total 600ms) - should have triggered search now
    jest.advanceTimersByTime(300);
    
    // Wait for the component to update
    await waitFor(() => {
      // The refetch should have been called once after the debounce period
      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });
    
    jest.useRealTimers();
  });

  it('should trigger search immediately for empty input', async () => {
    jest.useFakeTimers();
    
    const mockColumns = [
      { key: 'cpuBarcode', label: 'CPU Barcode' },
      { key: 'pcName', label: 'PC Name' },
    ];
    
    const mockFormFields = [
      { name: 'cpuBarcode', label: 'CPU Barcode', type: 'text', required: true },
      { name: 'pcName', label: 'PC Name', type: 'text', required: true },
    ];

    renderWithProviders(
      <AssetList
        assetType="pc"
        title="PC"
        columns={mockColumns}
        formFields={mockFormFields}
        canView={true}
        canCreate={true}
        canEdit={true}
        canDelete={true}
        canBulkDelete={true}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search assets...');
    
    // Set initial value
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Advance timers to trigger the search
    jest.advanceTimersByTime(600);
    
    // Clear the input (should trigger immediately)
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // The refetch should be called immediately for empty input
    expect(mockRefetch).toHaveBeenCalledTimes(1);
    
    jest.useRealTimers();
  });
});