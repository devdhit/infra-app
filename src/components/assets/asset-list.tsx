'use client'

import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useAssets, useDeleteAsset, useBulkDeleteAssets } from "@/hooks/useApi";
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
  Eye as EyeIcon,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { AssetFormDialog } from "./asset-form";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetResponse, AssetColumn, AssetFormField } from "@/types/assets";
import { useRouter} from "next/navigation";
import { ApiError } from "@/lib/api";
import { InlineEditCell } from "./inline-edit-cell";
import { useCustomFields } from "@/hooks/useApi";
import { isCustomField, getFieldValue } from "@/lib/custom-fields";

import { formatDisplayDate } from "@/lib/utils";
import logger from '@/lib/logger';

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
  // Permission props
  canView?: boolean | null;
  canCreate?: boolean | null;
  canEdit?: boolean | null;
  canDelete?: boolean | null;
  canBulkDelete?: boolean | null;
}

// Define columns for the DataTable
const getAssetColumns = (
  t: (key: string, fallback?: string) => string,
  visibleColumns: AssetColumn[],
  allFormFields: AssetFormField[],
  assetType: string,
  customFieldsData: any[] | null, // Changed from CustomField[] | null to any[] | null
  handleView: (asset: Asset) => void,
  handleEdit: (asset: Asset) => void,
  handleDelete: (id: string) => void,
  refetch: () => Promise<any>, // Change refetch function type to return Promise
  robustRefetch: (refetchFn: () => Promise<any>, t: (key: string, fallback?: string, ...args: any[]) => string) => Promise<boolean>, // Add robustRefetch function as parameter
  // Permission props
  canView: boolean | null = true,
  canEdit: boolean | null = true,
  canDelete: boolean | null = true
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

  // Create actions column with optimized width
  const actionsColumn: ColumnDef<Asset> = {
    id: 'actions',
    header: () => <div className="text-center">{t('common.actions', 'Actions')}</div>,
    cell: ({ row }) => {
      const asset = row.original;
      
      // If no permissions are provided, show all actions
      const canViewAsset = canView !== false;
      const canEditAsset = canEdit !== false;
      const canDeleteAsset = canDelete !== false;
      
      // If no permissions are granted, don't show the actions column
      if (!canViewAsset && !canEditAsset && !canDeleteAsset) {
        return <div className="text-center">-</div>;
      }
      
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
              {canViewAsset && (
                <DropdownMenuItem onClick={() => handleView(asset)}>
                  <Eye className="mr-2 h-4 w-4" />
                  {t('common.view', 'View')}
                </DropdownMenuItem>
              )}
              {canEditAsset && (
                <DropdownMenuItem onClick={() => handleEdit(asset)}>
                  <Edit className="mr-2 h-4 w-4" />
                  {t('common.edit', 'Edit')}
                </DropdownMenuItem>
              )}
              {canDeleteAsset && (
                <DropdownMenuItem onClick={() => handleDelete(asset.id)}>
                  <Trash className="mr-2 h-4 w-4" />
                  {t('common.delete', 'Delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 70, // Set a fixed width for the actions column
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
        const isCustom = isCustomField(column.key, asset, customFieldsData || undefined);
        // Safely access the cell value
        const cellValue = getFieldValue(column.key, asset, isCustom);
        
        // Format date fields for display
        let displayValue = cellValue;
        if (column.key.toLowerCase().includes('date') && cellValue) {
          displayValue = formatDisplayDate(cellValue);
        }
        
        return field ? (
          <InlineEditCell
            asset={asset}
            assetType={assetType}
            field={field}
            value={displayValue}
            isCustomField={isCustom}
            customFieldsData={customFieldsData || undefined}
            onUpdate={async (_newValue) => {
              // Force a refetch to ensure we have the latest data from the server
              // Use the robust refetch function
              await robustRefetch(refetch, t);
            }}
          />
        ) : (
          column.render ? column.render(displayValue) : String(displayValue || '')
        );
      },
    };
  });

  // Return the columns array with actions column first, then selection, then data columns
  return [actionsColumn, selectionColumn, ...dataColumns];
};

// Add a helper function to generate a unique key for localStorage based on assetType
const getColumnVisibilityStorageKey = (assetType: string) => `assetListColumnVisibility_${assetType}`;

export function AssetList({
  assetType,
  title,
  columns,
  formFields,
  canView = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  canBulkDelete = true
}: AssetListProps) {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  
  // New function to robustly refresh data with immediate cache update awareness
  const robustRefetch = useCallback(async (refetchFn: () => Promise<any>, t: (key: string, fallback?: string, ...args: any[]) => string) => {
    // Wait for a shorter period to ensure cache updates are complete
    await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
    
    try {
      await refetchFn();
      return true;
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error(t('assets.refresh.error', 'Failed to refresh data after update'));
      return false;
    }
  }, []);

  // Fetch assets with current parameters
  const { data: assetsData, isLoading: assetsLoading, error: assetsApiError, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 20,
    search,
    status: statusFilter
  });
  
  // Update state when assets data changes
  useEffect(() => {
    if (assetsData) {
      setAssets(assetsData.data || []);
      setPagination(assetsData.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      setIsLoading(assetsLoading);
      // isError is not a property of useAssets hook, using error instead
      setIsError(!!assetsApiError);
      setError(assetsApiError || null);
    }
  }, [assetsData, assetsLoading, assetsApiError]);
  
  // Fetch custom fields
  const { data: customFieldsData, refetch: refetchCustomFields } = useCustomFields(assetType);
  
  // Asset deletion hooks
  const { deleteAsset, isLoading: deleteLoading } = useDeleteAsset<Asset>(assetType);
  const { bulkDeleteAssets, isLoading: bulkDeleteLoading } = useBulkDeleteAssets<Asset>(assetType);
  
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
  
  // Optimized search with smart debouncing that waits for user to finish typing
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSearchChange = useCallback((value: string) => {
    // Update the input value immediately for UI responsiveness
    setSearchInputValue(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If value is empty, trigger search immediately
    if (value === '') {
      setSearch(value);
      setIsSearching(true);
      return;
    }
    
    // Only set timeout for non-empty values
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value);
      setIsSearching(true);
    }, 500); // Wait 500ms after user stops typing
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  // Better focus management
  const handleSearchFocus = useCallback(() => {
    // Clear any pending searches when focusing
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);
  
  const handleSearchBlur = useCallback(() => {
    // Trigger search immediately when losing focus if there's a pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      setSearch(searchInputValue);
      setIsSearching(true);
    }
  }, [searchInputValue]);
  
  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
    setIsSearching(true);
  }, []);
  
  const handleDelete = useCallback(async (id: string) => {
    setDeleteAssetId(id);
    setIsDeleteDialogOpen(true);
  }, []);
  
  const handleBulkDelete = useCallback(() => {
    if (selectedAssets.length === 0) {
      toast.error(t('assets.bulkDelete.noSelection', 'Please select assets to delete'));
      return;
    }
    
    setIsBulkDeleteDialogOpen(true);
  }, [selectedAssets.length, t]);
  
  const confirmDelete = useCallback(async () => {
    if (!deleteAssetId) return;
    
    try {
      // Call the delete function with the specific asset ID
      await deleteAsset(deleteAssetId);
      toast.success(t('assets.delete.success', `{0} deleted successfully`, title));
      setIsDeleteDialogOpen(false);
      setDeleteAssetId(null);
      
      // Clear selection if the deleted asset was selected
      setSelectedAssets(prev => prev.filter(id => id !== deleteAssetId));
      
      // Refetch data to ensure UI updates
      await refetch();
    } catch (error: any) {
      logger.error("Delete error:", error);
      const apiError = error as ApiError;
      let message = t('assets.delete.error', `Failed to delete {0}`, title);
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      // Even if there was an error, the asset might have been deleted
      // So we still clear the selection and refresh the data
      setIsDeleteDialogOpen(false);
      setDeleteAssetId(null);
      
      // Clear selection if the deleted asset was selected
      setSelectedAssets(prev => prev.filter(id => id !== deleteAssetId));
      
      // Refetch data to ensure UI updates
      await refetch();
      
      toast.error(message);
    }
  }, [deleteAssetId, deleteAsset, t, title, refetch]);

  const confirmBulkDelete = useCallback(async () => {
    try {
      await bulkDeleteAssets(selectedAssets);
      toast.success(t('assets.bulkDelete.success', `{0} {1} assets deleted successfully`, selectedAssets.length.toString(), title));
      
      // Clear selection after successful deletion
      setSelectedAssets([]);
      setIsBulkDeleteDialogOpen(false);
      
      // Reset to first page after deletion to ensure we're showing current data
      setCurrentPage(1);
      
      // Refetch data to ensure UI updates
      await refetch();
    } catch (error: any) {
      logger.error("Bulk delete error:", error);
      const apiError = error as ApiError;
      let message = t('assets.bulkDelete.error', `Failed to delete {0} assets`, title);
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      // Even if there was an error, some assets might have been deleted
      // So we still clear the selection and refresh the data
      setSelectedAssets([]);
      setIsBulkDeleteDialogOpen(false);
      
      // Reset to first page after deletion
      setCurrentPage(1);
      
      // Refetch data to ensure UI updates
      await refetch();
      
      toast.error(message);
    }
  }, [bulkDeleteAssets, selectedAssets, t, title, refetch]);
  
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

  const handleFormSuccess = useCallback(async () => {
    // Force a more aggressive refetch to ensure we get fresh data
    try {
      // Wait a shorter time for server-side cache to update
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
      
      // Force a complete refresh by resetting the cache
      await refetch();
      
      // Also refetch custom fields
      await refetchCustomFields();
      
      // Show success message
      toast.success(t('assets.update.success', 'Asset updated successfully'));
    } catch (error) {
      console.error("Form success refetch error:", error);
      toast.error(t('assets.update.error', 'Failed to refresh data after update'));
    }
  }, [refetch, refetchCustomFields, t]);

  const handleImportSuccess = useCallback(async () => {
    // Force a more aggressive refetch to ensure we get fresh data
    try {
      // Wait a shorter time for server-side cache to update
      await new Promise(resolve => setTimeout(resolve, 100)); // Reduced from 500ms to 100ms
      
      // Force a complete refresh by resetting the cache
      await refetch();
      
      // Show success message
      toast.success(t('assets.import.success', 'Assets imported successfully'));
    } catch (error) {
      console.error("Import success refetch error:", error);
      toast.error(t('assets.import.error', 'Failed to refresh data after import'));
    }
  }, [refetch, t]);
  
  // Update URL when parameters change (for bookmarking/sharing)
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    
    const newPath = `${window.location.pathname}?${params.toString()}`;
    router.replace(newPath, { scroll: false }); // Prevent scrolling when updating URL
  }, [currentPage, search, statusFilter, router]);
  
  // Maintain focus on search input after URL updates
  useEffect(() => {
    // Only refocus if the search input is already focused
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    }
  }, [currentPage, search, statusFilter, searchInputRef]);
  
  // Sync searchInputValue with search state when search changes externally
  useEffect(() => {
    setSearchInputValue(search);
  }, [search]);
  
  // Create a version of allColumns with unique keys for the detail dialog
  const allColumns = useMemo(() => {
    // Combine standard columns with custom field columns
    const standardColumnKeys = new Set(columns.map(c => c.key));
    
    // Add custom fields as columns if they don't already exist as standard columns
    const customFieldColumns: AssetColumn[] = (customFieldsData || [])
      .filter(field => !standardColumnKeys.has(field.name))
      .map(field => ({
        key: field.name,
        label: field.name,
        render: undefined
      }));
    
    return [...columns, ...customFieldColumns];
  }, [columns, customFieldsData]);
  
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
  
  // Initialize column visibility and order when assetType or allColumns change
  useEffect(() => {
    // Try to load saved column visibility from localStorage
    let savedVisibility: Record<string, boolean> | null = null;
    try {
      const savedVisibilityString = localStorage.getItem(getColumnVisibilityStorageKey(assetType));
      if (savedVisibilityString) {
        savedVisibility = JSON.parse(savedVisibilityString);
      }
    } catch (e) {
      // If there's an error parsing, we'll use default visibility
      console.warn('Failed to parse saved column visibility', e);
    }
    
    // Initialize column visibility with saved data or defaults for all columns
    const initialVisibility: Record<string, boolean> = {};
    allColumns.forEach(column => {
      initialVisibility[column.key] = savedVisibility?.[column.key] ?? true;
    });
    
    setColumnVisibility(initialVisibility);
    setColumnOrder(allColumns.map(column => column.key));
  }, [assetType, allColumns]);

  // Update column visibility when custom fields data becomes available or allColumns change
  useEffect(() => {
    // Only update when we have all the data we need
    if ((customFieldsData !== undefined || allColumns.length > columns.length) && columns.length > 0) {
      // Try to load saved column visibility from localStorage
      let savedVisibility: Record<string, boolean> | null = null;
      try {
        const savedVisibilityString = localStorage.getItem(getColumnVisibilityStorageKey(assetType));
        if (savedVisibilityString) {
          savedVisibility = JSON.parse(savedVisibilityString);
        }
      } catch (e) {
        // If there's an error parsing, we'll use default visibility
        console.warn('Failed to parse saved column visibility', e);
      }
      
      // Create updated visibility state that includes both standard columns and custom fields
      const updatedVisibility: Record<string, boolean> = {};
      
      // Add all standard columns with their saved visibility or default to true
      allColumns.forEach(column => {
        updatedVisibility[column.key] = savedVisibility?.[column.key] ?? true;
      });
      
      // Add all custom field columns with their saved visibility or default to true
      if (customFieldsData) {
        customFieldsData.forEach(field => {
          // Only add custom fields that don't conflict with standard columns
          if (!allColumns.some(c => c.key === field.name)) {
            updatedVisibility[field.name] = savedVisibility?.[field.name] ?? true;
          }
        });
      }
      
      setColumnVisibility(updatedVisibility);
      
      // Update column order to include custom fields if needed
      if (columnOrder.length > 0) {
        // Preserve existing order but add any new custom field columns at the end
        const existingOrder = [...columnOrder];
        const customFieldKeys = (customFieldsData || [])
          .filter(field => !allColumns.some(c => c.key === field.name))
          .map(field => field.name);
        
        // Add any new custom field columns that aren't already in the order
        const newCustomFields = customFieldKeys.filter(key => !existingOrder.includes(key));
        if (newCustomFields.length > 0) {
          setColumnOrder([...existingOrder, ...newCustomFields]);
        }
      } else {
        // If columnOrder is empty, initialize it with all columns
        const allColumnKeys = [
          ...allColumns.map(c => c.key),
          ...(customFieldsData || [])
            .filter(field => !allColumns.some(c => c.key === field.name))
            .map(field => field.name)
        ];
        setColumnOrder(allColumnKeys);
      }
    }
  }, [customFieldsData, allColumns, columnOrder, assetType, columns]);

  // Get visible columns based on column visibility state
  const visibleColumnsData = useMemo(() => {
    return allColumns.filter(column => columnVisibility[column.key] !== false);
  }, [allColumns, columnVisibility]);

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnVisibility(prev => {
      const newVisibility = {
        ...prev,
        [columnKey]: !prev[columnKey]
      };
      
      // Save to localStorage
      try {
        localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility));
      } catch (e) {
        console.warn('Failed to save column visibility to localStorage', e);
      }
      
      return newVisibility;
    });
  }, [assetType]);

  // Toggle all columns visibility
  const toggleAllColumns = useCallback((visible: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    // Apply visibility to all current columns (both standard and custom fields)
    allColumns.forEach(column => {
      newVisibility[column.key] = visible;
    });
    
    // Save to localStorage
    try {
      localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility));
    } catch (e) {
      console.warn('Failed to save column visibility to localStorage', e);
    }
    
    setColumnVisibility(newVisibility);
  }, [assetType, allColumns]);

  // Handle column order change
  const handleColumnOrderChangeWithSave = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
  }, []);

  // Get columns for DataTable with proper ordering
  const dataTableColumns = useMemo(() => {
    const baseColumns = getAssetColumns(
      t,
      visibleColumnsData,
      allFormFields,
      assetType,
      customFieldsData,
      handleView,
      handleEdit,
      handleDelete,
      refetch, // Pass refetch function
      robustRefetch, // Pass robustRefetch function
      canView, // Pass permission props
      canEdit,
      canDelete
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
    visibleColumnsData,
    allFormFields,
    assetType,
    customFieldsData,
    handleView,
    handleEdit,
    handleDelete,
    columnOrder,
    refetch, // Add refetch to dependencies
    robustRefetch, // Add robustRefetch to dependencies
    canView, // Add permission props to dependencies
    canEdit,
    canDelete
  ]);

  // New function to manually refresh data
  const handleRefresh = useCallback(() => {
    // Force a refetch to ensure UI updates with fresh data
    robustRefetch(refetch, t).then(() => {
      toast.success(t('assets.refresh.success', 'Data refreshed successfully'));
    }).catch((error) => {
      logger.error('Error refreshing data:', error);
      toast.error(t('assets.refresh.error', 'Failed to refresh data'));
    });
  }, [refetch, t, robustRefetch]);

  // Handle row selection change from DataTable
  const handleRowSelectionChange = useCallback((selectedRows: Record<string, boolean>) => {
    const selectedIds = Object.keys(selectedRows).filter(key => selectedRows[key]);
    setSelectedAssets(selectedIds);
  }, []);
  
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
              disabled={canView === false}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export', "Export")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={canCreate === false}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('common.import', "Import")}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={canView === false}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={canCreate === false}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {selectedAssets.length > 0 && canBulkDelete && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t('common.delete', "Delete")}</span> 
              <span className="sm:hidden">{selectedAssets.length}</span>
              <span className="hidden sm:inline"> ({selectedAssets.length})</span>
            </Button>
          )}
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', "Refresh")}</span>
            <span className="sm:hidden">{t('common.refresh', "Refresh")}</span>
          </Button>
          {canCreate && (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('common.create', "Create")} {t(`assets.${assetType}.title`, title)}</span>
              <span className="sm:hidden">{t('common.create', "Create")}</span>
            </Button>
          )}
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
                {isSearching && (
                  <div className="absolute right-2.5 top-2.5 h-4 w-4">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground border-r-transparent animate-spin" />
                  </div>
                )}
                <Input
                  ref={searchInputRef}
                  placeholder={t('common.search.placeholder', "Search assets...")}
                  value={searchInputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pl-8 w-full sm:w-64 pr-8"
                  disabled={canView === false}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto" disabled={canView === false}>
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
                    <Button variant="outline" className="w-full sm:w-auto" disabled={canView === false}>
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
                            disabled={canView === false}
                          >
                            {t('common.show', "Show")}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleAllColumns(false)}
                            className="h-8 px-2"
                            disabled={canView === false}
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
                              disabled={canView === false}
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
              loading={isLoading} // Show loading indicator when isLoading is true
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
              columnVisibility={columnVisibility} // Pass column visibility state
              onColumnVisibilityChange={(newVisibility) => {
                // Update our local state and save to localStorage
                setColumnVisibility(newVisibility);
                try {
                  localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility));
                } catch (e) {
                  console.warn('Failed to save column visibility to localStorage', e);
                }
              }} // Handle column visibility changes
            />
          </div>

          {renderPagination()}
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <MemoizedAssetDetailDialog
        asset={viewAsset}
        title={title}
        columns={allColumns.map((column, index) => {
          // Determine if this is a custom field
          const isCustom = isCustomField(column.key, {}, customFieldsData || undefined);
          
          // Create a unique key for this column
          const uniqueKey = `${column.key}-${isCustom ? 'custom' : 'standard'}-${index}`;
          
          return {
            ...column,
            key: uniqueKey,
            originalKey: column.key, // Store the original key for reference
            isCustomField: isCustom // Store whether this is a custom field
          };
        })}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditFromView}
        assetType={assetType}
      />
      
      {/* Form Dialog - Only show if user has create or edit permissions */}
      {(canCreate || canEdit) && (
        <MemoizedAssetFormDialog
          assetType={assetType}
          title={title}
          fields={allFormFields}
          initialData={editingAsset}
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
      
      {/* Delete Confirmation Dialog - Only show if user has delete permissions */}
      {canDelete && (
        <MemoizedDeleteConfirmDialog
          title={t('assets.delete.confirmTitle', `Delete {0}`, title)}
          description={t('assets.delete.confirmDescription', `Are you sure you want to delete this {0}? This action cannot be undone.`, title.toLowerCase())}
          isOpen={isDeleteDialogOpen}
          isDeleting={deleteLoading}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          error={error ? error.message : undefined}
        />
      )}
      
      {/* Bulk Delete Confirmation Dialog - Only show if user has bulk delete permissions */}
      {canBulkDelete && (
        <MemoizedBulkDeleteDialog
          title={title}
          count={selectedAssets.length}
          isOpen={isBulkDeleteDialogOpen}
          isDeleting={bulkDeleteLoading}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          onConfirm={confirmBulkDelete}
          error={error ? error.message : undefined}
        />
      )}
      
      {/* Import Dialog - Only show if user has create permissions */}
      {canCreate && (
        <MemoizedExcelImportDialog
          assetType={assetType}
          title={title}
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
      
      {/* Export Dialog - Only show if user has view permissions */}
      {canView && (
        <MemoizedExcelExportDialog
          assetType={assetType}
          title={title}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          selectedAssetIds={selectedAssets}
        />
      )}
    </div>
  );
}