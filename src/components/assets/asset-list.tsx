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
} from "lucide-react";
import { useAssets, useDeleteAsset, useBulkDeleteAssets } from "@/hooks/useApi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AssetFormDialog } from "./asset-form";
import { AssetDetailDialog } from "./asset-detail-dialog";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetResponse, AssetColumn, AssetFormField } from "@/types/assets";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

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
  const { data, isLoading, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 10,
    search,
    status: statusFilter
  });
  
  const deleteMutation = useDeleteAsset<Asset>(assetType);
  const bulkDeleteMutation = useBulkDeleteAssets<Asset>(assetType);
  
  // Reset to first page when search or filter changes
  useEffect(() => {
    if (isSearching) {
      setCurrentPage(1);
      setIsSearching(false);
    }
  }, [isSearching]);
  
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setIsSearching(true);
  };
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setIsSearching(true);
  };
  
  const handleDelete = async (id: string) => {
    setDeleteAssetId(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deleteAssetId) return;
    
    try {
      await deleteMutation.mutateAsync(deleteAssetId);
      toast.success(t('assets.delete.success', title) || `${title} deleted successfully`);
      setIsDeleteDialogOpen(false);
      setDeleteAssetId(null);
      refetch();
    } catch (error: any) {
      toast.error(t('assets.delete.error', title, error.message) || 
        `Failed to delete ${title}: ${error.message}`);
    }
  };
  
  const handleBulkDelete = () => {
    if (selectedAssets.length === 0) {
      toast.error(t('assets.bulkDelete.noSelection') || 'Please select assets to delete');
      return;
    }
    
    setIsBulkDeleteDialogOpen(true);
  };
  
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync({ ids: selectedAssets });
      toast.success(t('assets.bulkDelete.success', selectedAssets.length.toString()) || 
        `${selectedAssets.length} ${title} assets deleted successfully`);
      setSelectedAssets([]);
      setIsBulkDeleteDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(t('assets.bulkDelete.error', error.message) || 
        `Failed to delete ${title} assets: ${error.message}`);
    }
  };
  
  const handleView = (asset: Asset) => {
    setViewAsset(asset);
    setIsViewDialogOpen(true);
  };
  
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormDialogOpen(true);
    // Close the view dialog if it's open
    setIsViewDialogOpen(false);
  };
  
  const handleCreate = () => {
    setEditingAsset(undefined);
    setIsFormDialogOpen(true);
  };
  
  const handleSelectAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) 
        ? prev.filter(assetId => assetId !== id) 
        : [...prev, id]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedAssets.length === assets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(assets.map((asset: Asset) => asset.id));
    }
  };
  
  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
    refetch();
  };
  
  const assets = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
  
  // Show loading state while translations are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t(`assets.${assetType}.title`) || title}</h1>
          <p className="text-muted-foreground">
            {t('assets.list.description', t(`assets.${assetType}.title`).toLowerCase() || title.toLowerCase()) || 
              `Manage your ${title.toLowerCase()} assets`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Upload className="h-4 w-4 mr-2" />
            {t('common.import')}
          </Button>
          {selectedAssets.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              {t('common.delete')} ({selectedAssets.length})
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.create')} {t(`assets.${assetType}.title`) || title}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t(`assets.${assetType}.title`) || title} {t('common.list')}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search.placeholder') || "Search assets..."}
                  className="pl-8 md:w-[300px]"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {statusFilter ? t(`assets.status.${statusFilter}`) || statusFilter : t('assets.status.all')} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => handleStatusFilterChange("")}>
                    {t('assets.status.all')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusFilterChange("active")}>
                    {t('assets.status.active')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusFilterChange("inactive")}>
                    {t('assets.status.inactive')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusFilterChange("maintenance")}>
                    {t('assets.status.maintenance')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleStatusFilterChange("retired")}>
                    {t('assets.status.retired')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>
            {t('assets.list.description', t(`assets.${assetType}.title`).toLowerCase() || title.toLowerCase()) || 
              `A list of all ${title.toLowerCase()} assets in your inventory`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedAssets.length === assets.length && assets.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </TableHead>
                      {columns.map((column) => (
                        <TableHead key={column.key}>{t(`assets.${assetType}.${column.key}`) || column.label}</TableHead>
                      ))}
                      <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset: Asset) => (
                      <TableRow 
                        key={asset.id} 
                        className={selectedAssets.includes(asset.id) ? "bg-muted" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => handleSelectAsset(asset.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </TableCell>
                        {columns.map((column) => (
                          <TableCell key={`${asset.id}-${column.key}`}>
                            {column.render ? column.render(asset[column.key]) : asset[column.key] || '-'}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('common.actions')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleView(asset)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('common.view')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(asset)}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(asset.id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {assets.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {t('assets.list.empty') || 'No assets found'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        
        {pagination.pages > 1 && (
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">
              {t('common.pagination.showing', 
                ((pagination.page - 1) * pagination.limit) + 1,
                Math.min(pagination.page * pagination.limit, pagination.total),
                pagination.total
              ) || 
                `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} items`}
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNumber = i + 1;
                if (pagination.pages > 5) {
                  if (currentPage > 3) {
                    pageNumber = currentPage - 3 + i;
                  }
                  if (pageNumber > pagination.pages) {
                    pageNumber = pagination.pages - (5 - (i + 1));
                  }
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    disabled={isLoading}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Asset Details Dialog */}
      <AssetDetailDialog
        asset={viewAsset}
        title={t(`assets.${assetType}.title`) || title}
        columns={columns}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={() => handleEdit(viewAsset!)}
      />
      
      {/* Asset Form Dialog */}
      <AssetFormDialog
        assetType={assetType}
        title={t(`assets.${assetType}.title`) || title}
        fields={formFields}
        initialData={editingAsset}
        isOpen={isFormDialogOpen}
        onClose={() => setIsFormDialogOpen(false)}
        onSuccess={handleFormSuccess}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        title={t('assets.delete.title', t(`assets.${assetType}.title`) || title) || 
          `Delete ${title}`}
        description={t('assets.delete.description', t(`assets.${assetType}.title`).toLowerCase() || title.toLowerCase()) || 
          `Are you sure you want to delete this ${title.toLowerCase()}? This action cannot be undone.`}
        isOpen={isDeleteDialogOpen}
        isDeleting={deleteMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
      
      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        title={t('assets.bulkDelete.title') || "Bulk Delete"}
        description={t('assets.bulkDelete.description', 
          selectedAssets.length, 
          t(`assets.${assetType}.title`).toLowerCase() || title.toLowerCase()
        ) || 
          `Are you sure you want to delete ${selectedAssets.length} ${title.toLowerCase()} assets? This action cannot be undone.`}
        isOpen={isBulkDeleteDialogOpen}
        isDeleting={bulkDeleteMutation.isPending}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  );
}