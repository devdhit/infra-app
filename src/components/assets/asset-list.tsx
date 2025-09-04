'use client'

import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Search,
  Download,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings,
  Eye as EyeIcon
} from "lucide-react";
import { useAssets, useDeleteAsset, useBulkDeleteAssets } from "@/hooks/useApi";
import { toast } from "sonner";
import { AssetFormDialog } from "./asset-form";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetResponse, AssetColumn, AssetFormField } from "@/types/assets";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { InlineEditCell } from "./inline-edit-cell";
import { useCustomFields } from "@/hooks/useApi";
import { getModelType, isCustomField, getFieldValue } from "@/lib/custom-fields";
import { debounce } from '@/lib/performance';

// Import the new separate Excel dialogs
import { ExcelImportDialog } from "./excel-import-dialog";
import { ExcelExportDialog } from "./excel-export-dialog";

// Memoize the AssetDetailDialog component to prevent unnecessary re-renders
const MemoizedAssetDetailDialog = memo(AssetDetailDialog);
MemoizedAssetDetailDialog.displayName = 'MemoizedAssetDetailDialog';

// Memoize the AssetFormDialog component to prevent unnecessary re-renders
const MemoizedAssetFormDialog = memo(AssetFormDialog);
MemoizedAssetFormDialog.displayName = 'MemoizedAssetFormDialog';

// Memoize the DeleteConfirmDialog component to prevent unnecessary re-renders
const MemoizedDeleteConfirmDialog = memo(DeleteConfirmDialog);
MemoizedDeleteConfirmDialog.displayName = 'MemoizedDeleteConfirmDialog';

// Memoize the BulkDeleteDialog component to prevent unnecessary re-renders
const MemoizedBulkDeleteDialog = memo(BulkDeleteDialog);
MemoizedBulkDeleteDialog.displayName = 'MemoizedBulkDeleteDialog';

// Memoize the ExcelImportDialog component to prevent unnecessary re-renders
const MemoizedExcelImportDialog = memo(ExcelImportDialog);
MemoizedExcelImportDialog.displayName = 'MemoizedExcelImportDialog';

// Memoize the ExcelExportDialog component to prevent unnecessary re-renders
const MemoizedExcelExportDialog = memo(ExcelExportDialog);
MemoizedExcelExportDialog.displayName = 'MemoizedExcelExportDialog';

// Define the props interface for AssetList component
interface AssetListProps {
  assetType: string;
  title: string;
  columns: AssetColumn[];
  formFields: AssetFormField[];
}

// Define columns for the DataTable
const getAssetColumns = (
  t: (key: string, fallback?: string) => string,
  visibleColumns: AssetColumn[],
  allFormFields: AssetFormField[],
  assetType: string,
  customFieldsData: any,
  handleView: (asset: Asset) => void,
  handleEdit: (asset: Asset) => void,
  handleDelete: (id: string) => void,
  assets: Asset[],
  queryClient: any,
  currentPage: number,
  search: string,
  statusFilter: string,
  refetch: () => void, // Add refetch function as parameter
): ColumnDef<Asset>[] => {
  // Create the selection column
  const selectionColumn: ColumnDef<Asset> = {
    id: 'select',
    header: ({ table }) => (
      <div className="w-12">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  };

  // Create data columns
  const dataColumns: ColumnDef<Asset>[] = visibleColumns.map((column) => {
    return {
      accessorKey: column.key, // Use the original key as accessorKey
      header: t(column.label, column.label),
      enableSorting: true, // Enable sorting for all columns
      ...(column.key === 'status' ? {
        sortingFn: // Custom sorting function for status to sort by working > leave > repair order
          (rowA, rowB, columnId) => {
            const statusOrder: Record<string, number> = { 
              working: 1, 
              leave: 2, 
              repair: 3 
            };
            const valueA = String(rowA.getValue(columnId) || '');
            const valueB = String(rowB.getValue(columnId) || '');
            return (statusOrder[valueA] || 999) - (statusOrder[valueB] || 999);
          }
      } : {}), // Use default sorting for other columns
      cell: ({ row }) => {
        const asset = row.original;
        
        // Find the corresponding form field for this column
        const field = allFormFields.find(f => f.name === column.key);
        
        // Determine if this is a custom field
        const isCustom = isCustomField(column.key, asset, customFieldsData);
        // Safely access the cell value
        const cellValue = getFieldValue(column.key, asset, isCustom);
        
        return field ? (
          <InlineEditCell
            asset={asset}
            assetType={assetType}
            field={field}
            value={cellValue}
            isCustomField={isCustom}
            customFieldsData={customFieldsData}
            onUpdate={(newValue) => {
              // Create a truly deep clone of the assets array to avoid reference issues
              const updatedAssets = assets.map(a => {
                if (a.id === asset.id) {
                  // Deep clone the asset object
                  const newAsset = JSON.parse(JSON.stringify(a));
                  
                  if (isCustom) {
                    // For custom fields, ensure the customFields object exists
                    newAsset.customFields = newAsset.customFields || {};
                    // Update the custom field with the new value
                    newAsset.customFields[column.key] = newValue;
                  } else {
                    // For standard fields, update directly
                    newAsset[column.key] = newValue;
                  }
                  
                  return newAsset;
                }
                return a;
              });
              
              // Get the exact query key for the current view
              const queryParams = { 
                page: currentPage, 
                limit: 20, 
                search, 
                statusFilter 
              };
              
              const exactQueryKey = ['assets', assetType, JSON.stringify(queryParams)];
              
              // Store the updated assets directly in the query cache
              if (queryClient) {
                // Update the exact paginated query
                queryClient.setQueryData(exactQueryKey, (oldData: any) => {
                  if (!oldData) return { data: updatedAssets };
                  return {
                    ...oldData,
                    data: updatedAssets
                  };
                });
                
                // Force query invalidation
                queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
                
                // For custom fields, also invalidate custom field queries
                if (isCustom) {
                  const modelType = getModelType(assetType);
                  queryClient.invalidateQueries({ 
                    queryKey: ['asset-custom-fields', modelType, asset.id] 
                  });
                  
                  // Also invalidate the specific asset query to ensure custom fields are refreshed
                  queryClient.invalidateQueries({ 
                    queryKey: ['assets', assetType, asset.id] 
                  });
                }
                
                // Force a refetch to ensure we have the latest data
                setTimeout(() => {
                  refetch();
                }, 100);
              }
            }}
          />
        ) : (
          column.render ? column.render(cellValue) : String(cellValue || '')
        );
      },
    };
  });

  // Create actions column with optimized width
  const actionsColumn: ColumnDef<Asset> = {
    id: 'actions',
    header: () => <div className="text-center">{t('common.actions', 'Actions')}</div>,
    cell: ({ row }) => {
      const asset = row.original;
      
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0">
                <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleView(asset)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('common.view', 'View')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit', 'Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(asset.id)}>
                <Trash className="mr-2 h-4 w-4" />
                {t('common.delete', 'Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 70, // Set a fixed width for the actions column
  };

  return [selectionColumn, ...dataColumns, actionsColumn];
};

// extractDepartments function removed - was unused

export function AssetList({ assetType, title, columns, formFields }: AssetListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Map assetType to modelType for custom fields
  const modelType = getModelType(assetType);
  
  // Parse URL parameters for persistence across refreshes
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "";
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // const [isSelectAllChecked, setIsSelectAllChecked] = useState(false); // Unused
  // const [editingCell, setEditingCell] = useState<{ assetId: string; fieldKey: string } | null>(null); // Unused
  
  // Import/Export dialog states (separate states for import and export)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  
  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  
  // State for column order
  const [columnOrder, setColumnOrder] = useState<string[]>(() => 
    columns.map(column => column.key)
  );
  
  // Save column visibility to localStorage whenever it changes
  const saveColumnVisibility = useCallback((visibility: Record<string, boolean>) => {
    try {
      const key = `columnVisibility_${assetType}`;
      localStorage.setItem(key, JSON.stringify(visibility));
    } catch (e) {
      console.warn('Failed to save column visibility to localStorage:', e);
    }
  }, [assetType]);
  
  // Load column visibility from localStorage
  const loadColumnVisibility = useCallback(() => {
    try {
      const key = `columnVisibility_${assetType}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to load column visibility from localStorage:', e);
      return null;
    }
  }, [assetType]);
  
  // Save column order to localStorage whenever it changes
  const saveColumnOrder = useCallback((order: string[]) => {
    try {
      const key = `columnOrder_${assetType}`;
      localStorage.setItem(key, JSON.stringify(order));
    } catch (e) {
      console.warn('Failed to save column order to localStorage:', e);
    }
  }, [assetType]);
  
  // Load column order from localStorage
  const loadColumnOrder = useCallback(() => {
    try {
      const key = `columnOrder_${assetType}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.warn('Failed to load column order from localStorage:', e);
      return null;
    }
  }, [assetType]);
  
  // Override the handleColumnOrderChange to also save to localStorage
  const handleColumnOrderChangeWithSave = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
    saveColumnOrder(newOrder);
  }, [saveColumnOrder]);
  
  // Fetch custom fields for this asset type
  const { data: customFieldsData, refetch: refetchCustomFields } = useCustomFields(modelType);
  
  // Combine standard columns with custom field columns, removing duplicates
  const allColumns = useMemo(() => {
    // Create a Set of standard column keys for quick lookup
    const standardColumnKeys = new Set(columns.map(c => c.key));
    
    // Filter out custom fields that have the same name as standard columns
    const uniqueCustomFieldColumns: AssetColumn[] = (customFieldsData || [])
      .filter(field => !standardColumnKeys.has(field.name))
      .map(field => ({
        key: field.name,
        label: field.name
      }));
    
    return [...columns, ...uniqueCustomFieldColumns];
  }, [columns, customFieldsData]);

  // Define the column keys we want to hide by default
  const defaultHiddenColumns = useMemo(() => {
    // This will hide technical/identifier columns by default that aren't usually needed
    // in day-to-day operations but can be shown if needed
    return [
      'cpuSapBarcode',
      'monitorSapBarcode',
      'upsSapBarcode',
      'sapBarcode',
      'upsBarcode',
      'purchaseDate',
      'dateBuy',
      'note'
    ];
  }, []);

  // Initialize column visibility state with intelligent defaults
  useEffect(() => {
    // Try to load saved column visibility from localStorage
    const savedVisibility = loadColumnVisibility();
    
    if (savedVisibility) {
      // Use saved visibility if available
      setColumnVisibility(savedVisibility);
    } else {
      // Fallback to default visibility logic
      const initialVisibility: Record<string, boolean> = {};
      allColumns.forEach(column => {
        // Show columns by default, unless they're in the default hidden list OR have hide: true property
        initialVisibility[column.key] = !defaultHiddenColumns.includes(column.key) && !(column as any).hide;
      });
      setColumnVisibility(initialVisibility);
      // Save the initial visibility to localStorage
      saveColumnVisibility(initialVisibility);
    }
  }, [allColumns, defaultHiddenColumns, loadColumnVisibility, saveColumnVisibility]);

  // Toggle column visibility and save to localStorage
  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(prev => {
      const newVisibility = {
        ...prev,
        [columnKey]: !prev[columnKey]
      };
      saveColumnVisibility(newVisibility);
      return newVisibility;
    });
  };

  // Toggle all columns visibility and save to localStorage
  const toggleAllColumns = (visible: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    allColumns.forEach(column => {
      newVisibility[column.key] = visible;
    });
    setColumnVisibility(newVisibility);
    saveColumnVisibility(newVisibility);
  };
  
  // Initialize column order with localStorage persistence
  useEffect(() => {
    // Try to load saved column order from localStorage
    const savedOrder = loadColumnOrder();
    
    if (savedOrder && Array.isArray(savedOrder)) {
      // Validate that saved order contains all current columns
      const currentColumnKeys = new Set(columns.map(column => column.key));
      const validSavedOrder = savedOrder.filter(key => currentColumnKeys.has(key));
      
      // Only use saved order if it contains all current columns
      if (validSavedOrder.length === columns.length) {
        setColumnOrder(validSavedOrder);
        return;
      }
    }
    
    // Fallback to default order
    const defaultOrder = columns.map(column => column.key);
    setColumnOrder(defaultOrder);
    // Save the initial order to localStorage
    saveColumnOrder(defaultOrder);
  }, [columns, loadColumnOrder, saveColumnOrder]);
  
  // Optimize memoization with proper dependencies
  const filteredColumns = useMemo(() => {
    // Create a more efficient filtering mechanism
    return allColumns.filter(column => {
      // Only show columns that are explicitly set to visible
      return columnVisibility[column.key] === true;
    });
  }, [allColumns, columnVisibility]);

// handleLargeDataset and related useEffect removed - was unused

  // More efficient data transformation with memoization
  const visibleColumns = useMemo(() => {
    return filteredColumns; 
  }, [filteredColumns]);

  // Create a version of allColumns with unique keys for the detail dialog
  const detailDialogColumns = useMemo(() => {
    return allColumns.map((column, index) => {
      // Determine if this is a custom field
      const isCustom = isCustomField(column.key, {}, customFieldsData);
      
      // Create a unique key for this column
      const uniqueKey = `${column.key}-${isCustom ? 'custom' : 'standard'}-${index}`;
      
      return {
        ...column,
        key: uniqueKey,
        originalKey: column.key, // Store the original key for reference
        isCustomField: isCustom // Store whether this is a custom field
      };
    });
  }, [allColumns, customFieldsData]);
  
  // Combine standard form fields with custom fields, removing duplicates
  const allFormFields = useMemo(() => {
    // Create a Set of standard field names for quick lookup
    const standardFieldNames = new Set(formFields.map(f => f.name));
    
    // Filter out custom fields that have the same name as standard fields
    const uniqueCustomFormFields: AssetFormField[] = (customFieldsData || [])
      .filter(field => !standardFieldNames.has(field.name))
      .map(field => ({
        name: field.name,
        label: field.name,
        type: field.type as any,
        required: field.required
      }));
    
    return [...formFields, ...uniqueCustomFormFields];
  }, [formFields, customFieldsData]);
  
  // Refetch custom fields when the component mounts or when assetType changes
  useEffect(() => {
    refetchCustomFields();
  }, [assetType, refetchCustomFields]);
  
  // Dialog states
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  
  // Update URL when parameters change (for bookmarking/sharing)
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    
    const newPath = `${window.location.pathname}?${params.toString()}`;
    router.replace(newPath);
  }, [currentPage, search, statusFilter, router]);
  
  // Query assets with current parameters
  // Optimize asset fetching with better caching and pagination
  const { data, isLoading, isError, error, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 20, // Increase page size for fewer requests
    search,
    status: statusFilter
  }, {
    // Optimize caching for better performance
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
  
  // Memoize assets to prevent unnecessary re-renders
  const assets = useMemo(() => data?.data || [], [data?.data]);
  const pagination = useMemo(() => data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 }, [data?.pagination]);
  
  // Remove the placeholder ID parameter
  const deleteMutation = useDeleteAsset<Asset>(assetType);
  const bulkDeleteMutation = useBulkDeleteAssets<Asset>(assetType);
  
  // Reset to first page when search or filter changes
  useEffect(() => {
    if (isSearching) {
      setCurrentPage(1);
      setIsSearching(false);
    }
  }, [isSearching]);
  
  // Handle API errors
  useEffect(() => {
    if (isError && error) {
      const apiError = error as ApiError;
      let message = t('assets.list.error', 'Failed to load assets');
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      toast.error(message);
    }
  }, [isError, error, t]);
  
  // Debounced search to reduce API calls
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setSearch(value);
      setIsSearching(true);
    }, 300),
    []
  );
  
  const handleSearchChange = useCallback((value: string) => {
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setIsSearching(true);
  }, []);
  
  const handleDelete = useCallback(async (id: string) => {
    setDeleteAssetId(id);
    setIsDeleteDialogOpen(true);
  }, []);
  
  const confirmDelete = useCallback(async () => {
    if (!deleteAssetId) return;
    
    try {
      // Call the delete mutation with the specific asset ID
      await deleteMutation.mutateAsync(deleteAssetId);
      toast.success(t('assets.delete.success', `{0} deleted successfully`, title));
      setIsDeleteDialogOpen(false);
      setDeleteAssetId(null);
      refetch();
    } catch (error: any) {
      console.error("Delete error:", error);
      const apiError = error as ApiError;
      let message = t('assets.delete.error', `Failed to delete {0}`, title);
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      toast.error(message);
    }
  }, [deleteAssetId, deleteMutation, refetch, t, title]);
  
  const handleBulkDelete = useCallback(() => {
    if (selectedAssets.length === 0) {
      toast.error(t('assets.bulkDelete.noSelection', 'Please select assets to delete'));
      return;
    }
    
    setIsBulkDeleteDialogOpen(true);
  }, [selectedAssets.length, t]);
  
  const confirmBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedAssets });
      toast.success(t('assets.bulkDelete.success', `{0} {1} assets deleted successfully`, selectedAssets.length.toString(), title));
      setSelectedAssets([]);
      setIsBulkDeleteDialogOpen(false);
      
      // More robust cache invalidation
      await queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
      
      // Reset to first page after deletion
      setCurrentPage(1);
      
      // Refetch the data to ensure UI updates
      await refetch();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      const apiError = error as ApiError;
      let message = t('assets.bulkDelete.error', `Failed to delete {0} assets`, title);
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      toast.error(message);
    }
  }, [bulkDeleteMutation, refetch, selectedAssets, t, title, assetType, queryClient]);
  
  const handleView = useCallback((asset: Asset) => {
    setViewAsset(asset);
    setIsViewDialogOpen(true);
  }, []);
  
  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset);
    setIsFormDialogOpen(true);
    // Close the view dialog if it's open
    setIsViewDialogOpen(false);
  }, []);
  
  const handleCreate = useCallback(() => {
    setEditingAsset(undefined);
    setIsFormDialogOpen(true);
  }, []);
  
  // Wrapper function for onEdit to match the expected signature
  const handleEditFromView = useCallback(() => {
    if (viewAsset) {
      handleEdit(viewAsset);
    }
  }, [viewAsset, handleEdit]);

  // handleSelectAsset removed - was unused
  
  // handleSelectAll removed - was unused
  
  const handleFormSuccess = useCallback(() => {
    // Invalidate the query to refetch all data
    queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
    
    // Also invalidate asset detail queries if we were editing
    if (editingAsset) {
      queryClient.invalidateQueries({ queryKey: ['assets', assetType, editingAsset.id] });
    }
    
    // Refetch custom fields in case they've been updated
    refetchCustomFields();
    
    // Finally refetch the list
    refetch();
  }, [assetType, queryClient, refetch, refetchCustomFields, editingAsset]);
  
  // New function to handle import success
  const handleImportSuccess = useCallback(() => {
    // Refetch all data after successful import
    queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
    refetch();
  }, [assetType, queryClient, refetch]);
  
  // Effect to handle select all/deselect all removed - was unused

  // Effect to clear selection when data changes significantly (e.g., after delete operations)
  // But not after import operations
  useEffect(() => {
    // Only clear selection if we're not in the middle of a delete operation
    // and if the data change is significant (not just adding new items)
    if (!isBulkDeleteDialogOpen && !isDeleteDialogOpen && selectedAssets.length > 0) {
      // Check if any of the selected assets still exist in the new data
      const currentAssetIds = new Set(assets.map(asset => asset.id));
      const hasValidSelections = selectedAssets.some(id => currentAssetIds.has(id));
      
      // Only clear selection if none of the selected assets exist in the new data
      // This prevents clearing selection after import but still clears after delete
      if (!hasValidSelections) {
        setSelectedAssets([]);
      }
    }
  }, [assets, isBulkDeleteDialogOpen, isDeleteDialogOpen, selectedAssets]);

  // Get columns for DataTable with proper ordering
  const dataTableColumns = useMemo(() => {
    const baseColumns = getAssetColumns(
      t,
      visibleColumns,
      allFormFields,
      assetType,
      customFieldsData,
      handleView,
      handleEdit,
      handleDelete,
      assets,
      queryClient,
      currentPage,
      search,
      statusFilter,
      refetch, // Pass refetch function
    );
    
    // Apply column order if reordering is enabled
    if (columnOrder.length > 0) {
      return baseColumns.sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.id as string || (a as any).accessorKey);
        const bIndex = columnOrder.indexOf(b.id as string || (b as any).accessorKey);
        return aIndex - bIndex;
      });
    }
    
    return baseColumns;
  }, [
    t,
    visibleColumns,
    allFormFields,
    assetType,
    customFieldsData,
    handleView,
    handleEdit,
    handleDelete,
    assets,
    queryClient,
    currentPage,
    search,
    statusFilter,
    columnOrder,
    refetch // Add refetch to dependencies
  ]);

  // Handle row selection change from DataTable
  const handleRowSelectionChange = useCallback((selectedRows: Record<string, boolean>) => {
    const selectedIds = Object.keys(selectedRows).filter(key => selectedRows[key]);
    setSelectedAssets(selectedIds);
  }, []);
  
  // Effect to update select all checkbox state removed - was unused

  // Pagination component
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (pagination.pages <= maxVisiblePages) {
        // Show all pages
        for (let i = 1; i <= pagination.pages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, current page, and last page with ellipses
        if (currentPage <= 3) {
          // Show first 5 pages
          for (let i = 1; i <= Math.min(5, pagination.pages); i++) {
            pages.push(i);
          }
          if (pagination.pages > 5) {
            pages.push('ellipsis');
            pages.push(pagination.pages);
          }
        } else if (currentPage >= pagination.pages - 2) {
          // Show last 5 pages
          pages.push(1);
          pages.push('ellipsis');
          for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
            pages.push(i);
          }
        } else {
          // Show current page with 2 pages on each side
          pages.push(1);
          pages.push('ellipsis');
          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            pages.push(i);
          }
          pages.push('ellipsis');
          pages.push(pagination.pages);
        }
      }
      
      return pages;
    };
    
    const pageNumbers = getPageNumbers();
    
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          {t('common.pagination.showing', 
            `Showing {0} to {1} of {2} items`,
            ((pagination.page - 1) * pagination.limit) + 1,
            Math.min(pagination.page * pagination.limit, pagination.total),
            pagination.total
          )}
        </div>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            aria-label={t('common.pagination.previous', "Previous page")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page as number)}
                disabled={isLoading}
                className={page === currentPage ? "bg-primary text-primary-foreground" : ""}
              >
                {page}
              </Button>
            )
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
            disabled={currentPage === pagination.pages || isLoading}
            aria-label={t('common.pagination.next', "Next page")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(`assets.${assetType}.title`, title)}</h1>
          <p className="text-muted-foreground">
            {t('assets.list.description', `Manage your {0} assets`, t(`assets.${assetType}.title`, title).toLowerCase())}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export', "Export")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('common.import', "Import")}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {selectedAssets.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('common.delete', "Delete")}</span> 
              <span className="sm:hidden">{selectedAssets.length}</span>
              <span className="hidden sm:inline"> ({selectedAssets.length})</span>
            </Button>
          )}
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{t('common.create', "Create")} {t(`assets.${assetType}.title`, title)}</span>
            <span className="sm:hidden">{t('common.create', "Create")}</span>
          </Button>
        </div>
      </div>
      
      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t(`assets.${assetType}.title`, title)} {t('common.list', "List")}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>
                  {t('assets.list.description', `Manage your {0} assets`, t(`assets.${assetType}.title`, title).toLowerCase())}
                </span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs"
                  onClick={() => router.push('/settings/custom-fields')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t('assets.list.customFields', "Manage custom fields")}
                </Button>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search.placeholder', "Search assets...")}
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      {statusFilter 
                        ? t(`assets.status.${statusFilter}`, statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))
                        : t('common.filter', "Filter")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleStatusFilterChange("")}>
                      {t('common.all', "All")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilterChange("working")}>
                      {t('assets.status.working', "Working")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilterChange("leave")}>
                      {t('assets.status.leave', "Leave")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilterChange("repair")}>
                      {t('assets.status.repair', "Repair")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Moved column visibility control to card header for better accessibility */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      {t('common.columns', "Columns")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">{t('common.columns', "Columns")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('assets.list.columnVisibility', "Select which columns to display")}
                        </p>
                      </div>
                      <Separator />
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{t('common.selectAll', "Select All")}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleAllColumns(true)}
                            className="h-8 px-2"
                          >
                            {t('common.show', "Show")}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleAllColumns(false)}
                            className="h-8 px-2"
                          >
                            {t('common.hide', "Hide")}
                          </Button>
                        </div>
                        {allColumns.map((column) => (
                          <div key={column.key} className="flex items-center justify-between">
                            <span className="text-sm">{t(column.label, column.label)}</span>
                            <Checkbox
                              checked={columnVisibility[column.key]}
                              onCheckedChange={() => toggleColumnVisibility(column.key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Remove redundant columns management UI element here */}
          <div className="rounded-md border overflow-hidden">
            <DataTable
              columns={dataTableColumns}
              data={assets}
              searchable={false}
              filterable={false}
              sortable={true} // Make sure sorting is enabled
              pagination={false}
              pageSize={10}
              onRowSelectionChange={handleRowSelectionChange}
              loading={isLoading && (!data || assets.length === 0)}
              error={isError ? (error as ApiError).message : null}
              onRefresh={refetch}
              disableBuiltInFeatures={false} // Enable built-in features for sorting
              getRowId={(row: Asset) => row.id}
              responsive={true}
              enableColumnResizing={true}
              enableColumnReordering={true} // Enable column reordering
              onColumnOrderChange={handleColumnOrderChangeWithSave} // Handle column order changes
              enableVirtualization={assets.length > 50} // Enable virtualization for medium datasets
              virtualItemHeight={50}
            />
          </div>

          {renderPagination()}
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <MemoizedAssetDetailDialog
        asset={viewAsset}
        title={title}
        columns={detailDialogColumns}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditFromView}
        assetType={assetType}
      />
      
      {/* Form Dialog */}
      <MemoizedAssetFormDialog
        assetType={assetType}
        title={title}
        fields={allFormFields}
        initialData={editingAsset}
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
      />
      
      {/* Delete Confirmation Dialog */}
      <MemoizedDeleteConfirmDialog
        title={t('assets.delete.confirmTitle', `Delete {0}`, title)}
        description={t('assets.delete.confirmDescription', `Are you sure you want to delete this {0}? This action cannot be undone.`, title.toLowerCase())}
        isOpen={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        error={deleteMutation.error ? (deleteMutation.error as ApiError).message : undefined}
      />
      
      {/* Bulk Delete Confirmation Dialog */}
      <MemoizedBulkDeleteDialog
        title={title}
        count={selectedAssets.length}
        isOpen={isBulkDeleteDialogOpen}
        isDeleting={bulkDeleteMutation.isPending}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        error={bulkDeleteMutation.error ? (bulkDeleteMutation.error as ApiError).message : undefined}
      />
      
      {/* Import Dialog */}
      <MemoizedExcelImportDialog
        assetType={assetType}
        title={title}
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
      
      {/* Export Dialog */}
      <MemoizedExcelExportDialog
        assetType={assetType}
        title={title}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        selectedAssetIds={selectedAssets}
      />
    </div>
  );
}