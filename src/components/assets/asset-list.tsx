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
} from "lucide-react";
import { useAssets, useDeleteAsset } from "@/hooks/useApi";
import { useState } from "react";
import { toast } from "sonner";
import { AssetForm } from "./asset-form";
import { useTranslation } from "@/hooks/use-translation";
import { useQueryClient } from '@tanstack/react-query';

// Define the asset data structure
interface Asset {
  id: string;
  [key: string]: any; // Allow additional properties
}

interface AssetResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AssetListProps {
  assetType: string;
  title: string;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any) => React.ReactNode;
  }>;
  formFields: any[];
}

export function AssetList({ assetType, title, columns, formFields }: AssetListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    search,
    status: statusFilter
  });
  
  const deleteMutation = useDeleteAsset<Asset>(assetType);
  
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t('assets.delete.success', title) || `${title} deleted successfully`);
    } catch (error: any) {
      toast.error(t('assets.delete.error', title) || `Failed to delete ${title}: ${error.message}`);
    }
  };
  
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };
  
  const handleCreate = () => {
    setEditingAsset(null);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAsset(null);
    refetch();
    toast.success(t('assets.create.success', title) || `${title} created successfully`);
  };
  
  const assets = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{t('assets.list.description', title.toLowerCase()) || `Manage your ${title.toLowerCase()} assets`}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Upload className="h-4 w-4 mr-2" />
            {t('common.import')}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.create')} {title}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{title} {t('common.list')}</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('common.search.placeholder') || "Search assets..."}
                  className="pl-8 md:w-[300px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t('common.filter')} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setStatusFilter("")}>
                    {t('assets.status.all')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter("active")}>
                    {t('assets.status.active')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter("inactive")}>
                    {t('assets.status.inactive')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter("maintenance")}>
                    {t('assets.status.maintenance')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setStatusFilter("retired")}>
                    {t('assets.status.retired')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>
            {t('assets.list.description', title.toLowerCase()) || `A list of all ${title.toLowerCase()} assets in your inventory`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((column) => (
                      <TableHead key={column.key}>{column.label}</TableHead>
                    ))}
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset: Asset) => (
                    <TableRow key={asset.id}>
                      {columns.map((column) => (
                        <TableCell key={`${asset.id}-${column.key}`}>
                          {column.render ? column.render(asset[column.key]) : asset[column.key]}
                        </TableCell>
                      ))}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">{t('common.actions')}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                  <p className="text-muted-foreground">{t('assets.list.empty') || 'No assets found'}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      
      <AssetForm
        assetType={assetType}
        fields={formFields}
        initialData={editingAsset}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingAsset(null);
        }}
      />
    </div>
  );
}