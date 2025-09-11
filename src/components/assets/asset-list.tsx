'use client'

import { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { useCurrentUser } from '@/hooks/useApi'
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
          column.render ? column.render(displayValue) : String(displayValue || '')
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

  // Return columns with actions column at the beginning (after selection column)
  return [selectionColumn, actionsColumn, ...dataColumns];
};

// extractDepartments function removed - was unused

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Map assetType to modelType for custom fields
  const modelType = getModelType(assetType);
  
  // Parse URL parameters for persistence across refreshes
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "";
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [search, setSearch] = useState(initialSearch);
  const [searchInputValue, setSearchInputValue] = useState(initialSearch); // Add this line
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
  
  // Real-time updates (using tenantId from auth context)
  const { data: user } = useCurrentUser();
  const tenantId = user?.tenantId || '';
  const {} = useRealtimeUpdates(tenantId, assetType);
  
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
      logger.warn('Failed to save column visibility to localStorage:', e);
    }
  }, [assetType]);
  
  // Load column visibility from localStorage
  const loadColumnVisibility = useCallback(() => {
    try {
      const key = `columnVisibility_${assetType}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      logger.warn('Failed to load column visibility from localStorage:', e);
      return null;
    }
  }, [assetType]);
  
  // Save column order to localStorage whenever it changes
  const saveColumnOrder = useCallback((order: string[]) => {
    try {
      const key = `columnOrder_${assetType}`;
      localStorage.setItem(key, JSON.stringify(order));
    } catch (e) {
      logger.warn('Failed to save column order to localStorage:', e);
    }
  }, [assetType]);
  
  // Load column order from localStorage
  const loadColumnOrder = useCallback(() => {
    try {
      const key = `columnOrder_${assetType}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      logger.warn('Failed to load column order from localStorage:', e);
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
    // Only initialize column visibility when we have all the columns (including custom fields)
    // and custom fields data has been loaded (not undefined)
    if (allColumns.length > 0 && customFieldsData !== undefined) {
      // Try to load saved column visibility from localStorage
      const savedVisibility = loadColumnVisibility();
      
      // Always initialize with a proper visibility object
      const initialVisibility: Record<string, boolean> = {};
      const allColumnKeys = allColumns.map(column => column.key);
      
      if (savedVisibility) {
        // Use saved visibility if available, but ensure all current columns are included
        // and remove any columns that no longer exist
        let visibilityChanged = false;
        
        // Add any missing columns with default visibility
        allColumns.forEach(column => {
          if (!(column.key in savedVisibility)) {
            initialVisibility[column.key] = !defaultHiddenColumns.includes(column.key) && !(column as any).hide;
            visibilityChanged = true;
          } else {
            initialVisibility[column.key] = savedVisibility[column.key];
          }
        });
        
        // Remove any columns that no longer exist
        Object.keys(savedVisibility).forEach(key => {
          if (!allColumnKeys.includes(key)) {
            visibilityChanged = true;
            // Don't add this key to initialVisibility (effectively removing it)
          }
        });
        
        setColumnVisibility(initialVisibility);
        
        // Save the updated visibility to localStorage if we made changes
        if (visibilityChanged) {
          saveColumnVisibility(initialVisibility);
        }
      } else {
        // Fallback to default visibility logic
        allColumns.forEach(column => {
          initialVisibility[column.key] = !defaultHiddenColumns.includes(column.key) && !(column as any).hide;
        });
        setColumnVisibility(initialVisibility);
        // Save the initial visibility to localStorage
        saveColumnVisibility(initialVisibility);
      }
    }
  }, [allColumns, customFieldsData, defaultHiddenColumns, loadColumnVisibility, saveColumnVisibility, assetType]);

  // Toggle column visibility and save to localStorage
  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(prev => {
      const newVisibility = {
        ...prev,
        [columnKey]: !(prev[columnKey] === true) // Toggle the value, defaulting to true if undefined
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
    // Only initialize column order when we have all the columns (including custom fields)
    // and custom fields data has been loaded (not undefined)
    if (allColumns.length > 0 && customFieldsData !== undefined) {
      // Try to load saved column order from localStorage
      const savedOrder = loadColumnOrder();
      
      if (savedOrder && Array.isArray(savedOrder)) {
        // Validate that saved order contains all current columns
        const currentColumnKeys = new Set(allColumns.map(column => column.key));
        const validSavedOrder = savedOrder.filter(key => currentColumnKeys.has(key));
        
        // Only use saved order if it contains all current columns
        if (validSavedOrder.length === allColumns.length) {
          setColumnOrder(validSavedOrder);
          return;
        }
      }
      
      // Fallback to default order
      const defaultOrder = allColumns.map(column => column.key);
      setColumnOrder(defaultOrder);
      // Save the initial order to localStorage
      saveColumnOrder(defaultOrder);
    }
  }, [allColumns, customFieldsData, loadColumnOrder, saveColumnOrder, assetType]);

  // Optimize memoization with proper dependencies
  const filteredColumns = useMemo(() => {
    // Create a more efficient filtering mechanism
    return allColumns.filter(column => {
      // If columnVisibility has an explicit false value, hide the column
      // Otherwise, show the column (default to true if not set)
      return columnVisibility[column.key] !== false;
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
  
  // Reset column visibility and order when assetType changes
  useEffect(() => {
    // Reset column visibility state when assetType changes
    setColumnVisibility({});
    setColumnOrder(columns.map(column => column.key));
    
    // Load saved column visibility for the new assetType
    const savedVisibility = loadColumnVisibility();
    if (savedVisibility) {
      setColumnVisibility(savedVisibility);
    }
    // Note: We'll let the other useEffect handle the case where there's no saved data
    // since it also handles customFieldsData loading
    
    // Load saved column order for the new assetType
    const savedOrder = loadColumnOrder();
    if (savedOrder && Array.isArray(savedOrder)) {
      // Validate that saved order contains all current columns
      const currentColumnKeys = new Set(columns.map(column => column.key));
      const validSavedOrder = savedOrder.filter(key => currentColumnKeys.has(key));
      
      // Only use saved order if it contains all current columns
      if (validSavedOrder.length === columns.length) {
        setColumnOrder(validSavedOrder);
      } else {
        // Fallback to default order
        setColumnOrder(columns.map(column => column.key));
      }
    } else {
      // Fallback to default order
      setColumnOrder(columns.map(column => column.key));
    }
  }, [assetType, columns, loadColumnVisibility, loadColumnOrder]);
  
  // Re-initialize column visibility and order when custom fields data becomes available
  useEffect(() => {
    // Only re-initialize when custom fields data is loaded (not undefined) and we have all columns
    if (customFieldsData !== undefined && allColumns.length > 0) {
      // Check if we need to update column visibility to include new custom fields
      // or remove columns that no longer exist
      const allColumnKeys = allColumns.map(column => column.key);
      const currentVisibilityKeys = Object.keys(columnVisibility);
      
      // Check if we have the correct columns in visibility state
      const hasAllColumns = allColumnKeys.every(key => currentVisibilityKeys.includes(key));
      const hasOnlyValidColumns = currentVisibilityKeys.every(key => allColumnKeys.includes(key));
      
      // If we don't have all columns or have invalid columns, update the visibility state
      if (!hasAllColumns || !hasOnlyValidColumns) {
        const savedVisibility = loadColumnVisibility();
        const updatedVisibility: Record<string, boolean> = {};
        let visibilityChanged = false;
        
        if (savedVisibility) {
          // Use saved visibility but ensure consistency with current columns
          allColumns.forEach(column => {
            if (column.key in savedVisibility) {
              updatedVisibility[column.key] = savedVisibility[column.key];
            } else {
              // Add missing column with default visibility
              updatedVisibility[column.key] = !defaultHiddenColumns.includes(column.key) && !(column as any).hide;
              visibilityChanged = true;
            }
          });
          
          // Remove columns that no longer exist
          Object.keys(savedVisibility).forEach(key => {
            if (!allColumnKeys.includes(key)) {
              visibilityChanged = true;
              // Don't add this key to updatedVisibility (effectively removing it)
            }
          });
        } else {
          // No saved visibility, use default visibility for all columns
          allColumns.forEach(column => {
            updatedVisibility[column.key] = !defaultHiddenColumns.includes(column.key) && !(column as any).hide;
          });
          visibilityChanged = true;
        }
        
        if (visibilityChanged || !hasAllColumns || !hasOnlyValidColumns) {
          setColumnVisibility(updatedVisibility);
          saveColumnVisibility(updatedVisibility);
        }
      }
      
      // Re-initialize column order if not already set or if it's empty
      if (columnOrder.length === 0) {
        const savedOrder = loadColumnOrder();
        
        if (savedOrder && Array.isArray(savedOrder)) {
          // Validate that saved order contains all current columns
          const currentColumnKeys = new Set(allColumns.map(column => column.key));
          const validSavedOrder = savedOrder.filter(key => currentColumnKeys.has(key));
          
          // Only use saved order if it contains all current columns
          if (validSavedOrder.length === allColumns.length) {
            setColumnOrder(validSavedOrder);
            return;
          }
        }
        
        // Fallback to default order
        const defaultOrder = allColumns.map(column => column.key);
        setColumnOrder(defaultOrder);
        // Save the initial order to localStorage
        saveColumnOrder(defaultOrder);
      }
    }
  }, [customFieldsData, allColumns, columnVisibility, columnOrder, defaultHiddenColumns, loadColumnVisibility, saveColumnVisibility, loadColumnOrder, saveColumnOrder, assetType]);

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
  }, [currentPage, search, statusFilter]);
  
  // Sync searchInputValue with search state when search changes externally
  useEffect(() => {
    setSearchInputValue(search);
  }, [search]);
  
  // Query assets with current parameters
  // Optimize asset fetching with better caching and pagination
  const { data, isLoading, isError, error, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 20, // Increase page size for fewer requests
    search,
    status: statusFilter
  }, {
    // Optimize caching for better performance
    staleTime: search || statusFilter ? 0 : 60 * 1000, // No caching when searching or filtering
    gcTime: 10 * 60 * 1000, // Increased from 5 minutes to 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: search || statusFilter ? 'always' : false, // Always refetch when searching or filtering
    retry: false, // Disable retry to prevent unnecessary delays
    refetchInterval: false, // Disable automatic refetching
    refetchIntervalInBackground: false // Disable background refetching
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
      logger.error("Delete error:", error);
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
      logger.error("Bulk delete error:", error);
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
    refetch, // Add refetch to dependencies
    canView, // Add permission props to dependencies
    canEdit,
    canDelete
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
              <Trash className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('common.delete', "Delete")}</span> 
              <span className="sm:hidden">{selectedAssets.length}</span>
              <span className="hidden sm:inline"> ({selectedAssets.length})</span>
            </Button>
          )}
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
              onColumnVisibilityChange={setColumnVisibility} // Handle column visibility changes
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
          isDeleting={deleteMutation.isPending}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          error={deleteMutation.error ? (deleteMutation.error as ApiError).message : undefined}
        />
      )}
      
      {/* Bulk Delete Confirmation Dialog - Only show if user has bulk delete permissions */}
      {canBulkDelete && (
        <MemoizedBulkDeleteDialog
          title={title}
          count={selectedAssets.length}
          isOpen={isBulkDeleteDialogOpen}
          isDeleting={bulkDeleteMutation.isPending}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          onConfirm={confirmBulkDelete}
          error={bulkDeleteMutation.error ? (bulkDeleteMutation.error as ApiError).message : undefined}
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