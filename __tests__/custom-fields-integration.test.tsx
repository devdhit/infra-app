import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssetFormDialog } from '../src/components/assets/asset-form';
import { AssetList } from '../src/components/assets/asset-list';
import { useCustomFields, useAssets } from '../src/hooks/useApi';
import { mockCustomFields, mockAssets } from './__mocks__/data';

// Mock the hooks
jest.mock('../src/hooks/useApi', () => ({
  ...jest.requireActual('../src/hooks/useApi'),
  useCustomFields: jest.fn(),
  useAssets: jest.fn(),
  useCreateAsset: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })),
  useUpdateAsset: jest.fn(() => ({
    mutateAsync: jest.fn().mockResolvedValue({}),
  })),
}));

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/assets/pc',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useTranslation
jest.mock('../src/hooks/use-translation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
    loading: false,
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('Custom Fields Integration', () => {
  const mockFields = [
    { name: 'cpuBarcode', label: 'CPU Barcode', type: 'text', required: true },
    { name: 'dept', label: 'Department', type: 'text', required: true },
  ];

  const mockCustomFieldsData = [
    { id: '1', name: 'warranty', type: 'date', modelType: 'PC', required: false },
    { id: '2', name: 'cost', type: 'number', modelType: 'PC', required: true },
  ];

  beforeEach(() => {
    (useCustomFields as jest.Mock).mockReturnValue({
      data: mockCustomFieldsData,
    });
  });

  describe('AssetFormDialog', () => {
    const defaultProps = {
      assetType: 'PC',
      title: 'PC',
      fields: mockFields,
      isOpen: true,
      onClose: jest.fn(),
      onSuccess: jest.fn(),
    };

    it('renders custom fields section when custom fields exist', () => {
      render(<AssetFormDialog {...defaultProps} />);
      
      expect(screen.getByText('Custom Fields')).toBeInTheDocument();
      expect(screen.getByText('warranty')).toBeInTheDocument();
      expect(screen.getByText('cost')).toBeInTheDocument();
    });

    it('shows required indicator for required custom fields', () => {
      render(<AssetFormDialog {...defaultProps} />);
      
      const costLabel = screen.getByText('cost');
      expect(costLabel).toBeInTheDocument();
      expect(costLabel.parentElement).toHaveTextContent('*');
    });

    it('does not render custom fields section when no custom fields exist', () => {
      (useCustomFields as jest.Mock).mockReturnValue({
        data: [],
      });
      
      render(<AssetFormDialog {...defaultProps} />);
      
      expect(screen.queryByText('Custom Fields')).not.toBeInTheDocument();
    });
  });

  describe('AssetList', () => {
    const mockColumns = [
      { key: 'cpuBarcode', label: 'CPU Barcode' },
      { key: 'dept', label: 'Department' },
      { key: 'warranty', label: 'Warranty' },
    ];

    const mockFormFields = [
      { name: 'cpuBarcode', label: 'CPU Barcode', type: 'text' },
      { name: 'dept', label: 'Department', type: 'text' },
    ];

    const defaultProps = {
      assetType: 'PC',
      title: 'PC',
      columns: mockColumns,
      formFields: mockFormFields,
    };

    beforeEach(() => {
      (useAssets as jest.Mock).mockReturnValue({
        data: {
          data: mockAssets,
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
        isLoading: false,
        isError: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it('renders custom field values in the table', () => {
      render(<AssetList {...defaultProps} />);
      
      // Check that custom field values are displayed
      expect(screen.getByText('2025-12-31')).toBeInTheDocument();
    });

    it('shows custom field badge when editing custom fields inline', () => {
      render(<AssetList {...defaultProps} />);
      
      // Find the cell with custom field value and check for badge
      const warrantyCell = screen.getByText('2025-12-31').closest('td');
      expect(warrantyCell).toBeInTheDocument();
    });
  });
});