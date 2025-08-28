import { render, screen } from '@testing-library/react';
import { AssetList } from '../asset-list';
import { useTranslation } from '@/hooks/use-translation';
import { useAssets } from '@/hooks/useApi';
import { useCustomFields } from '@/hooks/useApi';

// Mock the hooks
jest.mock('@/hooks/use-translation');
jest.mock('@/hooks/useApi');

// Mock the components that AssetList uses
jest.mock('../asset-form', () => ({
  AssetFormDialog: () => <div data-testid="asset-form-dialog" />
}));

jest.mock('../asset-detail-dialog', () => ({
  AssetDetailDialog: () => <div data-testid="asset-detail-dialog" />
}));

jest.mock('../delete-confirm-dialog', () => ({
  DeleteConfirmDialog: () => <div data-testid="delete-confirm-dialog" />
}));

jest.mock('../bulk-delete-dialog', () => ({
  BulkDeleteDialog: () => <div data-testid="bulk-delete-dialog" />
}));

jest.mock('../asset-list-skeleton', () => ({
  AssetListSkeleton: () => <div data-testid="asset-list-skeleton" />
}));

jest.mock('../inline-edit-cell', () => ({
  InlineEditCell: ({ value }: { value: string }) => <div>{value}</div>
}));

jest.mock('@/lib/custom-fields', () => ({
  getModelType: () => 'asset',
  isCustomField: () => false,
  getFieldValue: (key: string, asset: any) => asset[key]
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn()
  })
}));

const mockAssetTypes = [
  {
    key: "pc",
    columns: [
      { key: "name", label: "Name" },
      { key: "status", label: "Status" }
    ],
    formFields: [
      { name: "name", label: "Name", type: "text" },
      { name: "status", label: "Status", type: "select" }
    ]
  }
];

const mockAssets = {
  data: [
    { id: '1', name: 'PC 1', status: 'active' },
    { id: '2', name: 'PC 2', status: 'inactive' }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    pages: 1
  }
};

describe('AssetList', () => {
  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({
      t: (key: string) => key,
      loading: false
    });
    
    (useAssets as jest.Mock).mockReturnValue({
      data: mockAssets,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn()
    });
    
    (useCustomFields as jest.Mock).mockReturnValue({
      data: [],
      refetch: jest.fn()
    });
  });

  it('renders asset list with data', () => {
    const pcAssetType = mockAssetTypes[0];
    
    render(
      <AssetList
        assetType="pc"
        title="PC Assets"
        columns={pcAssetType.columns}
        formFields={pcAssetType.formFields}
      />
    );

    expect(screen.getByText('PC Assets')).toBeInTheDocument();
    expect(screen.getByText('PC Assets List')).toBeInTheDocument();
    expect(screen.getByText('Manage your pc assets')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    (useAssets as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn()
    });

    const pcAssetType = mockAssetTypes[0];
    
    render(
      <AssetList
        assetType="pc"
        title="PC Assets"
        columns={pcAssetType.columns}
        formFields={pcAssetType.formFields}
      />
    );

    expect(screen.getByTestId('asset-list-skeleton')).toBeInTheDocument();
  });
});