'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from '@tanstack/react-table';
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
  Loader2,
  AlertCircle,
  Settings,
  EyeOff,
  Eye as EyeIcon
} from "lucide-react";
import { useAssets, useDeleteAsset, useBulkDeleteAssets } from "@/hooks/useApi";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AssetFormDialog } from "./asset-form";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetResponse, AssetColumn, AssetFormField } from "@/types/assets";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { AssetListSkeleton } from "./asset-list-skeleton";
import { InlineEditCell } from "./inline-edit-cell";
import { useCustomFields } from "@/hooks/useApi";
import { getModelType, isCustomField, getFieldValue } from "@/lib/custom-fields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

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
  const dataColumns: ColumnDef<Asset>[] = visibleColumns.map((column, index) => {
    // Determine if this is a custom field
    const isCustom = isCustomField(column.key, {}, customFieldsData);
    // Create a unique key for the header
    const uniqueHeaderKey = `${column.key}-${isCustom ? 'custom' : 'standard'}-${index}`;
    
    return {
      accessorKey: uniqueHeaderKey,
      header: t(column.label, column.label),
      cell: ({ row }) => {
        const asset = row.original;
        
        // Find the corresponding form field for this column
        const field = allFormFields.find(f => f.name === column.key);
        
        // Determine if this is a custom field
        const isCustom = isCustomField(column.key, asset, customFieldsData);
        // Safely access the cell value
        const cellValue = getFieldValue(column.key, asset, isCustom);
        
        // Create a unique key to avoid duplicates
        const uniqueKey = `${column.key}-${isCustom ? 'custom' : 'standard'}-${index}`;
        
        return field ? (
          <InlineEditCell
            asset={asset}
            assetType={assetType}
            field={field}
            value={cellValue}
            isCustomField={isCustom}
            onUpdate={(newValue) => {
              // Update the asset in the local state
              const updatedAssets = assets.map(a => 
                a.id === asset.id 
                  ? { 
                      ...a, 
                      ...(isCustom 
                        ? { customFields: { ...(a.customFields || {}), [column.key]: newValue } } 
                        : { [column.key]: newValue }
                      )
                    } 
                  : a
              );
              // Update the query cache to reflect the changes
              queryClient.setQueryData(
                ['assets', assetType, JSON.stringify({ page: currentPage, limit: 10, search, status: statusFilter })], 
                (oldData: any) => ({
                  ...oldData,
                  data: updatedAssets
                })
              );
              
              // Also invalidate the query to ensure data consistency
              queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
            }}
          />
        ) : (
          column.render ? column.render(asset[column.key]) : String(asset[column.key] || '')
        );
      },
    };
  });

  // Create actions column
  const actionsColumn: ColumnDef<Asset> = {
    id: 'actions',
    header: () => <div className="text-right">{t('common.actions', 'Actions')}</div>,
    cell: ({ row }) => {
      const asset = row.original;
      
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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
  };

  return [selectionColumn, ...dataColumns, actionsColumn];
};

export function AssetList({ assetType, title, columns, formFields }: AssetListProps) {
  const { t, loading } = useTranslation();
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
  const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
  const [editingCell, setEditingCell] = useState<{ assetId: string; fieldKey: string } | null>(null);
  
  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  
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

  // Initialize column visibility state
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    allColumns.forEach(column => {
      initialVisibility[column.key] = true;
    });
    setColumnVisibility(initialVisibility);
  }, [allColumns]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  // Toggle all columns visibility
  const toggleAllColumns = (visible: boolean) => {
    const newVisibility: Record<string, boolean> = {};
    allColumns.forEach(column => {
      newVisibility[column.key] = visible;
    });
    setColumnVisibility(newVisibility);
  };

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return allColumns.filter(column => columnVisibility[column.key]);
  }, [allColumns, columnVisibility]);

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
  const { data, isLoading, isError, error, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 10,
    search,
    status: statusFilter
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
  
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setIsSearching(true);
  }, []);
  
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
      refetch();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      const apiError = error as ApiError;
      let message = t('assets.bulkDelete.error', `Failed to delete {0} assets`, title);
      
      if (apiError.message) {
        message = apiError.message;
      }
      
      toast.error(message);
    }
  }, [bulkDeleteMutation, refetch, selectedAssets, t, title]);
  
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

  const handleSelectAsset = useCallback((id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(assetId => assetId !== id) 
        : [...prev, id]
    );
  }, []);
  
  const handleSelectAll = useCallback(() => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map((asset: Asset) => asset.id));
    }
  }, [assets, selectedAssets.length]);
  
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
  
  // Effect to handle select all/deselect all when assets change
  useEffect(() => {
    if (selectedAssets.length > 0 && selectedAssets.length === assets.length) {
      // All assets are selected
      setIsSelectAllChecked(true);
    } else {
      setIsSelectAllChecked(false);
    }
  }, [assets, selectedAssets.length]);

  // Get columns for DataTable
  const dataTableColumns = useMemo(() => 
    getAssetColumns(
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
    ), 
    [
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
    ]
  );

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
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              {t('common.export', "Export")}
            </Button>
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Upload className="h-4 w-4 mr-2" />
              {t('common.import', "Import")}
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="sm:hidden">
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
      
      <Card>
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
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("active")}>
                    {t('assets.status.active', "Active")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("inactive")}>
                    {t('assets.status.inactive', "Inactive")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusFilterChange("maintenance")}>
                    {t('assets.status.maintenance', "Maintenance")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Column visibility control */}
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
        </CardHeader>
        <CardContent>
          <DataTable
            columns={dataTableColumns}
            data={assets}
            searchable={false}
            filterable={false}
            sortable={true}
            pagination={true}
            pageSize={10}
            onRowSelectionChange={handleRowSelectionChange}
            loading={isLoading && (!data || assets.length === 0)}
            error={isError ? (error as ApiError).message : null}
            onRefresh={refetch}
            disableBuiltInFeatures={true}
          />
          
          {renderPagination()}
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <AssetDetailDialog
        asset={viewAsset}
        title={title}
        columns={detailDialogColumns}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditFromView}
        assetType={assetType}
      />
      
      {/* Form Dialog */}
      <AssetFormDialog
        assetType={assetType}
        title={title}
        fields={allFormFields}
        initialData={editingAsset}
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        title={t('assets.delete.confirmTitle', `Delete {0}`, title)}
        description={t('assets.delete.confirmDescription', `Are you sure you want to delete this {0}? This action cannot be undone.`, title.toLowerCase())}
        isOpen={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        error={deleteMutation.error ? (deleteMutation.error as ApiError).message : undefined}
      />
      
      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteDialog
        title={title}
        assetType={assetType}
        count={selectedAssets.length}
        isOpen={isBulkDeleteDialogOpen}
        isDeleting={bulkDeleteMutation.isPending}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        error={bulkDeleteMutation.error ? (bulkDeleteMutation.error as ApiError).message : undefined}
      />

    </div>
  );
}