'use client'

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Settings
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

interface AssetListProps {
  assetType: string;
  title: string;
  columns: AssetColumn[];
  formFields: AssetFormField[];
}

export function AssetList({ assetType, title, columns, formFields }: AssetListProps) {
  const { t, loading } = useTranslation();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  
  // Fetch custom fields for this asset type
  const { data: customFieldsData, refetch: refetchCustomFields } = useCustomFields(assetType);
  
  // Combine standard columns with custom field columns
  const allColumns = useMemo(() => {
    const customFieldColumns: AssetColumn[] = (customFieldsData || []).map(field => ({
      key: field.name,
      label: field.name
    }));
    
    return [...columns, ...customFieldColumns];
  }, [columns, customFieldsData]);
  
  // Combine standard form fields with custom fields
  const allFormFields = useMemo(() => {
    const customFormFields: AssetFormField[] = (customFieldsData || []).map(field => ({
      name: field.name,
      label: field.name,
      type: field.type as any,
      required: field.required
    }));
    
    return [...formFields, ...customFormFields];
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
    queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
    refetch();
  }, [assetType, queryClient, refetch]);
  
  // Effect to handle select all/deselect all when assets change
  useEffect(() => {
    if (selectedAssets.length > 0 && selectedAssets.length === assets.length) {
      // All assets are selected
      setIsSelectAllChecked(true);
    } else {
      setIsSelectAllChecked(false);
    }
  }, [assets, selectedAssets.length]);

  // Show loading state while translations are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  // Show skeleton while loading initial data
  if (isLoading && (!data || assets.length === 0)) {
    return <AssetListSkeleton title={title} columns={allColumns} />;
  }
  
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
                  onChange={(e) => handleSearchChange(e.target.value)}
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('common.error', "Error")}</h3>
              <p className="text-muted-foreground mb-4">
                {t('assets.list.error', "Failed to load assets. Please try again later.")}
              </p>
              <Button onClick={() => refetch()}>
                {t('common.retry', "Retry")}
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={isSelectAllChecked}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableHead>
                      {allColumns.map((column) => (
                        <TableHead key={column.key}>
                          {t(column.label, column.label)}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">{t('common.actions', "Actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={allColumns.length + 2} className="h-24 text-center">
                          {search || statusFilter 
                            ? t('common.noResults', "No results found")
                            : t('assets.list.empty', "No assets found")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      assets.map((asset) => (
                        <TableRow key={asset.id} className={selectedAssets.includes(asset.id) ? "bg-muted" : ""}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedAssets.includes(asset.id)}
                              onChange={() => handleSelectAsset(asset.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </TableCell>
                          {allColumns.map((column) => {
                            // Find the corresponding form field for this column
                            const field = allFormFields.find(f => f.name === column.key);
                            
                            // Determine the value for the cell
                            // For custom fields, get the value from the customFields object
                            const isCustomField = field && !(column.key in asset) && (asset.customFields && column.key in asset.customFields);
                            const cellValue = isCustomField ? (asset.customFields as any)[column.key] : asset[column.key];
                            
                            return (
                              <TableCell key={column.key} className="py-2">
                                {field ? (
                                  <InlineEditCell
                                    asset={asset}
                                    assetType={assetType}
                                    field={field}
                                    value={cellValue}
                                    onUpdate={(newValue) => {
                                      // Update the asset in the local state
                                      const updatedAssets = assets.map(a => 
                                        a.id === asset.id 
                                          ? { 
                                              ...a, 
                                              ...(isCustomField 
                                                ? { customFields: { ...(a.customFields || {}), [column.key]: newValue } } 
                                                : { [column.key]: newValue }
                                              )
                                            } 
                                          : a
                                      );
                                      // We would need to update the query cache here
                                      queryClient.setQueryData(
                                        ['assets', assetType, JSON.stringify({ page: currentPage, limit: 10, search, status: statusFilter })], 
                                        (oldData: any) => ({
                                          ...oldData,
                                          data: updatedAssets
                                        })
                                      );
                                    }}
                                  />
                                ) : (
                                  column.render ? column.render(asset[column.key]) : String(asset[column.key] || '')
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">{t('common.openMenu', "Open menu")}</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(asset)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t('common.view', "View")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(asset)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  {t('common.edit', "Edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(asset.id)}>
                                  <Trash className="mr-2 h-4 w-4" />
                                  {t('common.delete', "Delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <AssetDetailDialog
        asset={viewAsset}
        title={title}
        columns={allColumns}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditFromView}
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