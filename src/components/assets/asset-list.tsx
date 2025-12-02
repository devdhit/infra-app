'use client'

import { 
  useState, 
  useMemo, 
  useEffect, 
  useCallback, 
  memo, 
  useRef 
} from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { useAssets, useDeleteAsset, useBulkDeleteAssets } from "@/hooks/useApi"
import useEnhancedSearch from "@/hooks/useEnhancedSearch"
import { useSearchContextOptional } from "@/contexts/search-context"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@/components/ui"
import { SearchInput } from "@/components/search"
import { DataTable } from "@/components/ui/data-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Edit,
  Trash,
  Download,
  Upload,
  Eye,
  ChevronLeft,
  ChevronRight,
  Settings,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"
import { AssetFormDialog } from "./asset-form"
import { AssetDetailDialog } from "./asset-detail-dialog"
import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { BulkDeleteDialog } from "./bulk-delete-dialog"
import { useTranslation } from "@/hooks/use-translation"
import { Asset, AssetResponse, AssetColumn, AssetFormField } from "@/types/assets"
import { useRouter } from "next/navigation"
import { ApiError } from "@/lib/api"
import { InlineEditCell } from "./inline-edit-cell"
import { useCustomFields } from "@/hooks/useApi"
import { isCustomField, getFieldValue } from "@/lib/custom-fields"
import { formatDisplayDate } from "@/lib/utils"
import { typedLogger as logger } from '@/lib/logger'

// Import the new separate Excel dialogs
import { ExcelImportDialog } from "./excel-import-dialog"
import { ExcelExportDialog } from "./excel-export-dialog"

// Memoized components to prevent unnecessary re-renders
const MemoizedComponents = {
  AssetDetailDialog: memo(AssetDetailDialog),
  AssetFormDialog: memo(AssetFormDialog),
  DeleteConfirmDialog: memo(DeleteConfirmDialog),
  BulkDeleteDialog: memo(BulkDeleteDialog),
  ExcelImportDialog: memo(ExcelImportDialog),
  ExcelExportDialog: memo(ExcelExportDialog),
}

// Set display names for memoized components
Object.entries(MemoizedComponents).forEach(([name, Component]) => {
  Component.displayName = `Memoized${name}`
})

// Define the props interface for AssetList component
interface AssetListProps {
  assetType: string
  title: string
  columns: AssetColumn[]
  formFields: AssetFormField[]
  // Permission props
  canView?: boolean | null
  canCreate?: boolean | null
  canEdit?: boolean | null
  canDelete?: boolean | null
  canBulkDelete?: boolean | null
}

// Define columns for the DataTable
const getAssetColumns = (
  t: (key: string, fallback?: string) => string,
  visibleColumns: AssetColumn[],
  allFormFields: AssetFormField[],
  assetType: string,
  customFieldsData: any[] | null,
  handleView: (asset: Asset) => void,
  handleEdit: (asset: Asset) => void,
  handleDelete: (id: string) => void,
  canView: boolean | null = true,
  canEdit: boolean | null = true,
  canDelete: boolean | null = true,
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>
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
    size: 50,
    minSize: 50,
    maxSize: 50,
  }

  // Create actions column with optimized width
  const actionsColumn: ColumnDef<Asset> = {
    id: 'actions',
    header: () => <div className="text-center">{t('common.actions', 'Actions')}</div>,
    cell: ({ row }) => {
      const asset = row.original
      
      const canViewAsset = canView !== false
      const canEditAsset = canEdit !== false
      const canDeleteAsset = canDelete !== false
      
      if (!canViewAsset && !canEditAsset && !canDeleteAsset) {
        return <div className="text-center">-</div>
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
      )
    },
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableHiding: false,
  }

  // Create data columns
  const dataColumns: ColumnDef<Asset>[] = visibleColumns.map((column) => {
    const isCustom = customFieldsData?.some((cf: any) => cf.name === column.key) || false
    
    // Set column sizing based on column type
    let columnWidth = 250
    let minWidth = 150
    let maxWidth = 800
    
    if (column.key === 'select') {
      columnWidth = 100
      minWidth = 100
      maxWidth = 100
    } else if (isCustom) {
      columnWidth = 250
      minWidth = 200
      maxWidth = 800
    } else {
      columnWidth = 250
      minWidth = 150
      maxWidth = 800
    }
    
    return {
      accessorKey: column.key,
      header: t(column.label, column.label),
      enableSorting: true,
      ...(column.key === 'status' ? {
        sortingFn: (rowA, rowB, columnId) => {
          const statusOrder: Record<string, number> = { 
            working: 1, 
            leave: 2, 
            repair: 3 
          }
          const valueA = String(rowA.getValue(columnId) || '')
          const valueB = String(rowB.getValue(columnId) || '')
          return (statusOrder[valueA] || 999) - (statusOrder[valueB] || 999)
        }
      } : {}),
      cell: ({ row }) => {
        const asset = row.original
        const field = allFormFields.find(f => f.name === column.key)
        const isCustom = isCustomField(column.key, asset, customFieldsData || undefined)
        const cellValue = getFieldValue(column.key, asset, isCustom)
        
        let displayValue = cellValue
        if (column.key.toLowerCase().includes('date') && cellValue) {
          displayValue = formatDisplayDate(cellValue)
        }
        
        const isTextareaCustomField = isCustom && field?.type === 'textarea'
        
        const truncateTextForDisplay = (text: string, maxLength: number = 15) => {
          if (!text) return ''
          const str = String(text)
          return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str
        }
        
        return field ? (
          <InlineEditCell
            asset={asset}
            assetType={assetType}
            field={field}
            value={displayValue}
            isCustomField={isCustom}
            customFieldsData={customFieldsData || undefined}
            onUpdate={async (newValue, isOptimistic) => {
              // Handle optimistic updates - update local state immediately without API call
              if (isOptimistic) {
                // Update local asset state immediately for instant UI feedback
                setAssets((prevAssets: Asset[]) => 
                  prevAssets.map((a: Asset) => 
                    a.id === asset.id 
                      ? { ...a, [column.key]: newValue } 
                      : a
                  )
                )
              } else {
                // This is a rollback - restore original value in local state
                setAssets((prevAssets: Asset[]) => 
                  prevAssets.map((a: Asset) => 
                    a.id === asset.id 
                      ? { ...a, [column.key]: newValue } 
                      : a
                  )
                )
              }
              // NO refetch needed - optimistic update already handled UI changes
            }}
            onRollback={(originalValue) => {
              // Rollback local state on error
              setAssets((prevAssets: Asset[]) => 
                prevAssets.map((a: Asset) => 
                  a.id === asset.id 
                    ? { ...a, [column.key]: originalValue } 
                    : a
                )
              )
            }}
          />
        ) : (
          <div className={`p-2 rounded-lg min-h-[40px] flex items-center ${
            isTextareaCustomField ? "whitespace-pre-wrap break-words max-h-32 overflow-y-auto bg-muted/30" : "overflow-hidden text-ellipsis whitespace-nowrap"
          }`}>
            {column.render ? column.render(displayValue) : truncateTextForDisplay(displayValue || '')}
          </div>
        )
      },
      size: columnWidth,
      minSize: minWidth,
      maxSize: maxWidth,
    }
  })

  return [actionsColumn, selectionColumn, ...dataColumns]
}

// Add a helper function to generate a unique key for localStorage based on assetType
const getColumnVisibilityStorageKey = (assetType: string) => `assetListColumnVisibility_${assetType}`

// Add a helper function to check internet access for a PC asset
const checkInternetAccess = async (asset: Asset, assetType: string, t: (key: string, fallback?: string) => string) => {
  // Only check for PC assets
  if (assetType !== 'pc') return;
  
  try {
    // Import the API client
    const { api } = await import('@/lib/api');
    
    // Check by IP address first if available
    const ipAddress = asset.customFields?.IP;
    if (ipAddress && ipAddress !== 'N/A') {
      // Make API call to check if there's an internet asset with the same IP address
      const response: any = await api.get(`/assets/internet?ip=${encodeURIComponent(ipAddress)}`);
      
      // If internet assets found, no need to check further
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return;
      }
    }
    
    // If no IP-based internet access found, check by userName if available
    if (asset.userName && asset.userName !== 'N/A') {
      // Make API call to check if there's an internet asset with the same userName
      const response: any = await api.get(`/assets/internet?userName=${encodeURIComponent(asset.userName)}`);
      
      // If no internet assets found, show notification
      if (!response || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        toast.warning(
          t('assets.pc.noInternetAccess', 'No Internet Access Found'),
          {
            description: t('assets.pc.noInternetAccessMessage', 'The asset (IP: {0}, User: {1}) does not have any associated internet access records.')
              .replace('{0}', ipAddress || 'N/A')
              .replace('{1}', asset.userName),
          }
        );
      }
    } else if (ipAddress && ipAddress !== 'N/A') {
      // Only IP address is available, show notification with IP
      toast.warning(
        t('assets.pc.noInternetAccess', 'No Internet Access Found'),
        {
          description: t('assets.pc.noInternetAccessMessage', 'The asset with IP address {0} does not have any associated internet access records.')
            .replace('{0}', ipAddress),
        }
      );
    }
  } catch (error) {
    logger.error("Error checking internet access:", { error: error instanceof Error ? error.message : String(error) });
  }
};

// Add a helper function to check license status for a PC asset
const checkLicenseStatus = async (asset: Asset, assetType: string, t: (key: string, fallback?: string) => string) => {
  // Only check for PC assets
  if (assetType !== 'pc') return;
  
  try {
    // Import the API client
    const { api } = await import('@/lib/api');
    
    // Check by IP address first if available
    const ipAddress = asset.customFields?.IP;
    if (ipAddress && ipAddress !== 'N/A') {
      // Make API call to check if there's a license asset with the same IP address
      const response: any = await api.get(`/assets/license?ip=${encodeURIComponent(ipAddress)}`);
      
      // If license assets found, no need to check further
      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        return;
      }
    }
    
    // If no IP-based license found, check by userName if available
    if (asset.userName && asset.userName !== 'N/A') {
      // Make API call to check if there's a license asset with the same userName
      const response: any = await api.get(`/assets/license?userName=${encodeURIComponent(asset.userName)}`);
      
      // If no license assets found, show notification
      if (!response || !response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        toast.warning(
          t('assets.pc.noLicense', 'No License Found'),
          {
            description: t('assets.pc.noLicenseMessage', 'The asset (IP: {0}, User: {1}) does not have any associated license records.')
              .replace('{0}', ipAddress || 'N/A')
              .replace('{1}', asset.userName),
          }
        );
      }
    } else if (ipAddress && ipAddress !== 'N/A') {
      // Only IP address is available, show notification with IP
      toast.warning(
        t('assets.pc.noLicense', 'No License Found'),
        {
          description: t('assets.pc.noLicenseMessage', 'The asset with IP address {0} does not have any associated license records.')
            .replace('{0}', ipAddress),
        }
      );
    }
  } catch (error) {
    logger.error("Error checking license status:", { error: error instanceof Error ? error.message : String(error) });
  }
};

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
  const router = useRouter()
  const { t } = useTranslation()
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const toastCountRef = useRef<number>(0)
  
  // State management
  const [assets, setAssets] = useState<Asset[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInputValue, setSearchInputValue] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [viewAsset, setViewAsset] = useState<Asset | null>(null)
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  
  // Add state for tracking which assets have been checked
  const [checkedAssets, setCheckedAssets] = useState<Set<string>>(new Set())
  
  // Optimized robust refetch function with better error handling
  const robustRefetch = useCallback(async (refetchFn: () => Promise<any>, t: (key: string, fallback?: string, ...args: any[]) => string) => {
    try {
      // Wait for a shorter period to ensure cache updates are complete
      await new Promise(resolve => setTimeout(resolve, 100))
      await refetchFn()
      return true
    } catch (error) {
      logger.error("Failed to refresh data:", { error: error instanceof Error ? error.message : String(error) })
      toast.error(t('assets.refresh.error', 'Failed to refresh data after update'))
      return false
    }
  }, [])

  // Enhanced search functionality with fast API
  const searchContext = useSearchContextOptional()
  const enhancedSearch = useEnhancedSearch(assetType, {
    autoSearch: false,
    enableCache: true,
    debounceMs: 300, // Faster debounce
  })
  
  // Use enhanced search results when searching, otherwise use regular API
  const isUsingEnhancedSearch = search && search.length > 0
  
  // Fetch assets with current parameters (only when NOT searching)
  const { data: assetsData, isLoading: assetsLoading, error: assetsApiError, refetch } = useAssets<AssetResponse<Asset>>(assetType, {
    page: currentPage,
    limit: 20,
    search: isUsingEnhancedSearch ? '' : search, // Empty when using enhanced search
    status: statusFilter
  })
  
  // Determine which data source to use (memoized to prevent infinite loops)
  const activeAssets = useMemo(() => 
    isUsingEnhancedSearch && enhancedSearch.results ? enhancedSearch.results.data : (assetsData?.data || []),
    [isUsingEnhancedSearch, enhancedSearch.results, assetsData?.data]
  )
  
  const activeLoading = isUsingEnhancedSearch ? enhancedSearch.isLoading : assetsLoading
  const activeError = isUsingEnhancedSearch ? enhancedSearch.error : assetsApiError
  
  const activePagination = useMemo(() => 
    isUsingEnhancedSearch && enhancedSearch.results 
      ? {
          page: enhancedSearch.results.page,
          limit: enhancedSearch.results.limit,
          total: enhancedSearch.results.total,
          pages: enhancedSearch.results.totalPages
        }
      : (assetsData?.pagination || { page: 1, limit: 20, total: 0, pages: 1 }),
    [isUsingEnhancedSearch, enhancedSearch.results, assetsData?.pagination]
  )
  
  // Update state when assets data changes
  useEffect(() => {
    setAssets(activeAssets)
    setPagination(activePagination)
    setIsLoading(activeLoading)
    setIsError(!!activeError)
    setError(activeError as ApiError | null)
  }, [activeAssets, activePagination, activeLoading, activeError])

  // Check internet access and license status for PC assets
  useEffect(() => {
    if (assetType === 'pc' && activeAssets && activeAssets.length > 0) {
      activeAssets.forEach((asset: Asset) => {
        // Check if we've already checked this asset
        // Only check assets with valid userName (not empty and not "N/A")
        if (asset.userName && asset.userName !== 'N/A' && !checkedAssets.has(asset.id)) {
          // Mark as checked to prevent duplicate notifications
          setCheckedAssets(prev => new Set(prev).add(asset.id))
          // Check internet access for this asset
          checkInternetAccess(asset, assetType, t)
          // Check license status for this asset
          checkLicenseStatus(asset, assetType, t)
        }
      })
    }
  }, [activeAssets, assetType, checkedAssets, t])

  // Fetch custom fields
  const { data: customFieldsData, refetch: refetchCustomFields } = useCustomFields(assetType)
  
  // Debounce ref for suggestions fetching
  const suggestionsFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Extract fetchSuggestions to ensure stable reference
  const { fetchSuggestions } = enhancedSearch
  
  // Fetch search suggestions when input changes (debounced to prevent infinite loops)
  const fetchSuggestionsDebounced = useCallback(
    (prefix: string) => {
      // Clear previous timeout
      if (suggestionsFetchTimeoutRef.current) {
        clearTimeout(suggestionsFetchTimeoutRef.current)
      }
      
      // Only fetch if prefix is long enough
      if (prefix && prefix.length > 1) {
        // Debounce the API call to prevent excessive requests
        suggestionsFetchTimeoutRef.current = setTimeout(() => {
          fetchSuggestions(prefix)
        }, 300) // 300ms debounce for suggestions
      }
    },
    [fetchSuggestions] // Depend on the extracted function
  )
  
  useEffect(() => {
    fetchSuggestionsDebounced(searchInputValue)
  }, [searchInputValue, fetchSuggestionsDebounced])
  
  // Cleanup suggestions timeout on unmount
  useEffect(() => {
    return () => {
      if (suggestionsFetchTimeoutRef.current) {
        clearTimeout(suggestionsFetchTimeoutRef.current)
      }
    }
  }, [])
  
  // Asset deletion hooks
  const { deleteAsset, isLoading: deleteLoading } = useDeleteAsset<Asset>(assetType)
  const { bulkDeleteAssets, isLoading: bulkDeleteLoading } = useBulkDeleteAssets<Asset>(assetType)
  
  // Reset to first page when search or filter changes
  useEffect(() => {
    if (isSearching) {
      setCurrentPage(1)
      setIsSearching(false)
    }
  }, [isSearching])
  
  // Handle API errors
  useEffect(() => {
    if (isError && error) {
      const apiError = error as ApiError
      let message = t('assets.list.error', 'Failed to load assets')
      
      if (apiError.message) {
        message = apiError.message
      }
      
      toast.error(message)
    }
  }, [isError, error, t])
  
  // Optimized search with enhanced API
  const handleSearchChange = useCallback((value: string) => {
    setSearchInputValue(value)
    setSearch(value)
    
    // Use enhanced search API when there's a query
    if (value && value.length > 0) {
      // Execute enhanced search with filters
      enhancedSearch.search(value, {
        page: currentPage,
        limit: 20,
        filters: statusFilter ? { status: statusFilter } : {},
      })
    } else {
      // Clear search - will use regular API
      setIsSearching(true)
    }
  }, [statusFilter, currentPage, enhancedSearch])
  
  // Handle search completion (when user presses Enter or selects suggestion)
  const handleSearchComplete = useCallback((value: string) => {
    // Only save to history when search is completed (not on every keystroke)
    if (value && value.length >= 3 && searchContext) {
      searchContext.addToHistory({
        query: value,
        assetType,
        timestamp: Date.now(),
        filters: statusFilter ? { status: statusFilter } : undefined,
      })
    }
  }, [searchContext, assetType, statusFilter])
  
  // Handle status filter with enhanced search support
  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status)
    
    // If currently searching, re-execute search with new filter
    if (search && search.length > 0) {
      enhancedSearch.search(search, {
        page: currentPage,
        limit: 20,
        filters: status ? { status } : {},
      })
    } else {
      setIsSearching(true)
    }
  }, [search, currentPage, enhancedSearch])
  
  const handleDelete = useCallback(async (id: string) => {
    setDeleteAssetId(id)
    setIsDeleteDialogOpen(true)
  }, [])
  
  const handleBulkDelete = useCallback(() => {
    if (selectedAssets.length === 0) {
      toast.error(t('assets.bulkDelete.noSelection', 'Please select assets to delete'))
      return
    }
    
    setIsBulkDeleteDialogOpen(true)
  }, [selectedAssets.length, t])
  
  const confirmDelete = useCallback(async () => {
    if (!deleteAssetId) return
    
    // Store original asset for potential rollback
    const originalAsset = assets.find(a => a.id === deleteAssetId)
    
    try {
      // OPTIMISTIC DELETE: Remove from UI immediately
      setAssets(prevAssets => prevAssets.filter(a => a.id !== deleteAssetId))
      setIsDeleteDialogOpen(false)
      setDeleteAssetId(null)
      
      // Clear selection if the deleted asset was selected
      setSelectedAssets(prev => prev.filter(id => id !== deleteAssetId))
      
      // Call the delete API in background
      await deleteAsset(deleteAssetId)
      
      // Refresh data sources after successful delete
      if (isUsingEnhancedSearch && enhancedSearch.refetch) {
        // Refetch search results AND regular data (for when user clears search)
        await Promise.all([enhancedSearch.refetch(), refetch()])
      } else {
        // Refetch regular data
        await refetch()
      }
      
      // Show success message after API confirms
      toast.success(t('assets.delete.success', `{0} deleted successfully`, title))
    } catch (error: any) {
      // ROLLBACK: Restore the deleted asset on error
      if (originalAsset) {
        setAssets(prevAssets => [originalAsset, ...prevAssets])
      }
      
      const apiError = error as ApiError
      let message = t('assets.delete.error', `Failed to delete {0}`, title)
      
      if (apiError.message) {
        message = apiError.message
      }
      
      toast.error(message)
    }
  }, [deleteAssetId, deleteAsset, t, title, assets, isUsingEnhancedSearch, enhancedSearch, refetch])

  const confirmBulkDelete = useCallback(async () => {
    // Store original assets for potential rollback
    const originalAssets = assets.filter(a => selectedAssets.includes(a.id))
    
    try {
      // OPTIMISTIC DELETE: Remove all selected assets from UI immediately
      setAssets(prevAssets => prevAssets.filter(a => !selectedAssets.includes(a.id)))
      setIsBulkDeleteDialogOpen(false)
      setSelectedAssets([])
      
      // Call the bulk delete API in background
      await bulkDeleteAssets(selectedAssets)
      
      // Refresh data sources after successful delete
      if (isUsingEnhancedSearch && enhancedSearch.refetch) {
        // Refetch search results AND regular data (for when user clears search)
        await Promise.all([enhancedSearch.refetch(), refetch()])
      } else {
        // Refetch regular data
        await refetch()
      }
      
      // Show success message after API confirms
      toast.success(t('assets.bulkDelete.success', `{0} {1} assets deleted successfully`, selectedAssets.length.toString(), title))
      
      // Reset to first page after deletion
      setCurrentPage(1)
    } catch (error: any) {
      // ROLLBACK: Restore all deleted assets on error
      if (originalAssets.length > 0) {
        setAssets(prevAssets => [...originalAssets, ...prevAssets])
      }
      
      const apiError = error as ApiError
      let message = t('assets.bulkDelete.error', `Failed to delete {0} assets`, title)
      
      if (apiError.message) {
        message = apiError.message
      }
      
      toast.error(message)
    }
  }, [bulkDeleteAssets, selectedAssets, t, title, assets, isUsingEnhancedSearch, enhancedSearch, refetch])
  
  const handleView = useCallback((asset: Asset) => {
    setViewAsset(asset)
    setIsViewDialogOpen(true)
  }, [])
  
  const handleEdit = useCallback((asset: Asset) => {
    setEditingAsset(asset)
    setIsFormDialogOpen(true)
    // Close the view dialog if it's open
    setIsViewDialogOpen(false)
  }, [])
  
  const handleCreate = useCallback(() => {
    setEditingAsset(undefined)
    setIsFormDialogOpen(true)
  }, [])
  
  // Wrapper function for onEdit to match the expected signature
  const handleEditFromView = useCallback(() => {
    if (viewAsset) {
      handleEdit(viewAsset)
    }
  }, [viewAsset, handleEdit])

  const handleFormSuccess = useCallback(async () => {
    try {
      // Wait a shorter time for server-side cache to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force a complete refresh by resetting the cache
      await refetch()
      
      // Also refetch enhanced search results if currently searching
      if (enhancedSearch && enhancedSearch.query && enhancedSearch.query.length > 0 && enhancedSearch.refetch) {
        await enhancedSearch.refetch()
      }
      
      // Also refetch custom fields
      await refetchCustomFields()
      
      // Show success message
      toast.success(t('assets.update.success', 'Asset updated successfully'))
    } catch (error) {
      logger.error("Form success refetch error:", { error: error instanceof Error ? error.message : String(error) })
      toast.error(t('assets.update.error', 'Failed to refresh data after update'))
    }
  }, [refetch, refetchCustomFields, t, enhancedSearch])

  const handleImportSuccess = useCallback(async () => {
    try {
      // Wait a shorter time for server-side cache to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Force a complete refresh by resetting the cache
      await refetch()
      
      // Show success message
      toast.success(t('assets.import.success', 'Assets imported successfully'))
    } catch (error) {
      logger.error("Import success refetch error:", { error: error instanceof Error ? error.message : String(error) })
      toast.error(t('assets.import.error', 'Failed to refresh data after import'))
    }
  }, [refetch, t])
  
  // Update URL when parameters change (for bookmarking/sharing)
  useEffect(() => {
    const params = new URLSearchParams()
    if (currentPage > 1) params.set("page", currentPage.toString())
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    
    const newPath = `${window.location.pathname}?${params.toString()}`
    router.replace(newPath, { scroll: false }) // Prevent scrolling when updating URL
  }, [currentPage, search, statusFilter, router])
  
  // Maintain focus on search input after URL updates
  useEffect(() => {
    // Only refocus if the search input is already focused
    if (searchInputRef.current && document.activeElement === searchInputRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 0)
    }
  }, [currentPage, search, statusFilter, searchInputRef])
  
  // Sync searchInputValue with search state when search changes externally
  useEffect(() => {
    setSearchInputValue(search)
  }, [search])
  
  // Create a version of allColumns with unique keys for the detail dialog
  const allColumns = useMemo(() => {
    // Combine standard columns with custom field columns
    const standardColumnKeys = new Set(columns.map(c => c.key))
    
    // Add custom fields as columns if they don't already exist as standard columns
    const customFieldColumns: AssetColumn[] = (customFieldsData || [])
      .filter(field => !standardColumnKeys.has(field.name))
      .map(field => ({
        key: field.name,
        label: field.name,
        render: undefined
      }))
    
    return [...columns, ...customFieldColumns]
  }, [columns, customFieldsData])
  
  // Combine standard form fields with custom fields, removing duplicates
  const allFormFields = useMemo(() => {
    // Create a Set of standard field names for quick lookup
    const standardFieldNames = new Set(formFields.map(f => f.name))
    
    // Filter out custom fields that have the same name as standard fields
    const uniqueCustomFormFields: AssetFormField[] = (customFieldsData || [])
      .filter(field => !standardFieldNames.has(field.name))
      .map(field => ({
        name: field.name,
        label: field.name,
        type: field.type as any,
        required: field.required
      }))
    
    return [...formFields, ...uniqueCustomFormFields]
  }, [formFields, customFieldsData])
  
  // Refetch custom fields when the component mounts or when assetType changes
  useEffect(() => {
    refetchCustomFields()
  }, [assetType, refetchCustomFields])
  
  // Initialize column visibility and order when assetType or allColumns change
  useEffect(() => {
    // Try to load saved column visibility from localStorage
    let savedVisibility: Record<string, boolean> | null = null
    try {
      const savedVisibilityString = localStorage.getItem(getColumnVisibilityStorageKey(assetType))
      if (savedVisibilityString) {
        savedVisibility = JSON.parse(savedVisibilityString)
      }
    } catch (e) {
      // If there's an error parsing, we'll use default visibility
      logger.warn('Failed to parse saved column visibility', { error: e instanceof Error ? e.message : String(e) })
    }
    
    // Initialize column visibility with saved data or defaults for all columns
    const initialVisibility: Record<string, boolean> = {}
    allColumns.forEach(column => {
      initialVisibility[column.key] = savedVisibility?.[column.key] ?? true
    })
    
    setColumnVisibility(initialVisibility)
    setColumnOrder(allColumns.map(column => column.key))
  }, [assetType, allColumns])

  // Update column visibility when custom fields data becomes available or allColumns change
  useEffect(() => {
    // Only update when we have all the data we need
    if ((customFieldsData !== undefined || allColumns.length > columns.length) && columns.length > 0) {
      // Try to load saved column visibility from localStorage
      let savedVisibility: Record<string, boolean> | null = null
      try {
        const savedVisibilityString = localStorage.getItem(getColumnVisibilityStorageKey(assetType))
        if (savedVisibilityString) {
          savedVisibility = JSON.parse(savedVisibilityString)
        }
      } catch (e) {
        // If there's an error parsing, we'll use default visibility
        logger.warn('Failed to parse saved column visibility', { error: e instanceof Error ? e.message : String(e) })
      }
      
      // Create updated visibility state that includes both standard columns and custom fields
      const updatedVisibility: Record<string, boolean> = {}
      
      // Add all standard columns with their saved visibility or default to true
      allColumns.forEach(column => {
        updatedVisibility[column.key] = savedVisibility?.[column.key] ?? true
      })
      
      // Add all custom field columns with their saved visibility or default to true
      if (customFieldsData) {
        customFieldsData.forEach(field => {
          // Only add custom fields that don't conflict with standard columns
          if (!allColumns.some(c => c.key === field.name)) {
            updatedVisibility[field.name] = savedVisibility?.[field.name] ?? true
          }
        })
      }
      
      setColumnVisibility(updatedVisibility)
      
      // Update column order to include custom fields if needed
      if (columnOrder.length > 0) {
        // Preserve existing order but add any new custom field columns at the end
        const existingOrder = [...columnOrder]
        const customFieldKeys = (customFieldsData || [])
          .filter(field => !allColumns.some(c => c.key === field.name))
          .map(field => field.name)
        
        // Add any new custom field columns that aren't already in the order
        const newCustomFields = customFieldKeys.filter(key => !existingOrder.includes(key))
        if (newCustomFields.length > 0) {
          setColumnOrder([...existingOrder, ...newCustomFields])
        }
      } else {
        // If columnOrder is empty, initialize it with all columns
        const allColumnKeys = [
          ...allColumns.map(c => c.key),
          ...(customFieldsData || [])
            .filter(field => !allColumns.some(c => c.key === field.name))
            .map(field => field.name)
        ]
        setColumnOrder(allColumnKeys)
      }
    }
  }, [customFieldsData, allColumns, columnOrder, assetType, columns])

  // Get visible columns based on column visibility state
  const visibleColumnsData = useMemo(() => {
    return allColumns.filter(column => columnVisibility[column.key] !== false)
  }, [allColumns, columnVisibility])

  // Toggle column visibility
  const toggleColumnVisibility = useCallback((columnKey: string) => {
    setColumnVisibility(prev => {
      const newVisibility = {
        ...prev,
        [columnKey]: !prev[columnKey]
      }
      
      // Save to localStorage
      try {
        localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility))
      } catch (e) {
        logger.warn('Failed to save column visibility to localStorage', { error: e instanceof Error ? e.message : String(e) })
      }
      
      return newVisibility
    })
  }, [assetType])

  // Toggle all columns visibility
  const toggleAllColumns = useCallback((visible: boolean) => {
    const newVisibility: Record<string, boolean> = {}
    // Apply visibility to all current columns (both standard and custom fields)
    allColumns.forEach(column => {
      newVisibility[column.key] = visible
    })
    
    // Save to localStorage
    try {
      localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility))
    } catch (e) {
      logger.warn('Failed to save column visibility to localStorage', { error: e instanceof Error ? e.message : String(e) })
    }
    
    setColumnVisibility(newVisibility)
  }, [assetType, allColumns])

  // Handle column order change
  const handleColumnOrderChangeWithSave = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder)
  }, [])

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
      canView,
      canEdit,
      canDelete,
      setAssets
    )
    
    // Apply column order if reordering is enabled
    if (columnOrder.length > 0) {
      return baseColumns.sort((a, b) => {
        const aIndex = columnOrder.indexOf(a.id as string || (a as any).accessorKey)
        const bIndex = columnOrder.indexOf(b.id as string || (b as any).accessorKey)
        return aIndex - bIndex
      })
    }
    
    return baseColumns
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
    canView,
    canEdit,
    canDelete,
    setAssets
  ])

  // New function to manually refresh data
  const handleRefresh = useCallback(() => {
    // Force a refetch to ensure UI updates with fresh data
    robustRefetch(refetch, t).then(() => {
      toast.success(t('assets.refresh.success', 'Data refreshed successfully'))
    }).catch((error) => {
      logger.error('Error refreshing data:', { error: error instanceof Error ? error.message : String(error) })
      toast.error(t('assets.refresh.error', 'Failed to refresh data'))
    })
  }, [refetch, t, robustRefetch])

  // Handle row selection change from DataTable
  const handleRowSelectionChange = useCallback((selectedRows: Record<string, boolean>) => {
    const selectedIds = Object.keys(selectedRows).filter(key => selectedRows[key])
    setSelectedAssets(selectedIds)
  }, [])
  
  // Add effect to check internet access for PC assets
  useEffect(() => {
    if (assetType === 'pc' && assets.length > 0) {
      // Reset toast count for each new batch of assets
      toastCountRef.current = 0;
      
      // Filter PC assets that have userName but haven't been checked yet
      const uncheckedAssets = assets.filter(asset => 
        asset.userName && !checkedAssets.has(asset.id)
      );
      
      // Check each unchecked asset
      uncheckedAssets.forEach(asset => {
        // Mark this asset as checked to prevent duplicate checks
        setCheckedAssets(prev => new Set(prev).add(asset.id));
        
        // Check internet access for this asset
        checkInternetAccess(asset, assetType, t);
        // Check license status for this asset
        checkLicenseStatus(asset, assetType, t);
      });
    }
  }, [assets, assetType, checkedAssets, t]);
  
  // Pagination component
  const renderPagination = () => {
    if (pagination.pages <= 1) return null
    
    const getPageNumbers = () => {
      const pages = []
      const maxVisiblePages = 5
      
      if (pagination.pages <= maxVisiblePages) {
        // Show all pages
        for (let i = 1; i <= pagination.pages; i++) {
          pages.push(i)
        }
      } else {
        // Show first page, current page, and last page with ellipses
        if (currentPage <= 3) {
          // Show first 5 pages
          for (let i = 1; i <= Math.min(5, pagination.pages); i++) {
            pages.push(i)
          }
          if (pagination.pages > 5) {
            pages.push('ellipsis')
            pages.push(pagination.pages)
          }
        } else if (currentPage >= pagination.pages - 2) {
          // Show last 5 pages
          pages.push(1)
          pages.push('ellipsis')
          for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
            pages.push(i)
          }
        } else {
          // Show current page with 2 pages on each side
          pages.push(1)
          pages.push('ellipsis')
          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            pages.push(i)
          }
          pages.push('ellipsis')
          pages.push(pagination.pages)
        }
      }
      
      return pages
    }
    
    const pageNumbers = getPageNumbers()
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap w-full">
        <div className="text-sm text-muted-foreground">
          {t('common.pagination.showing', 
            `Showing {0} to {1} of {2} items`,
            ((pagination.page - 1) * pagination.limit) + 1,
            Math.min(pagination.page * pagination.limit, pagination.total),
            pagination.total
          )}
        </div>
        <div className="flex gap-1 items-center bg-muted/30 p-1 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.max(1, currentPage - 1)
              setCurrentPage(newPage)
              // Re-execute search if active
              if (search && search.length > 0) {
                enhancedSearch.search(search, {
                  page: newPage,
                  limit: 20,
                  filters: statusFilter ? { status: statusFilter } : {},
                })
              }
            }}
            disabled={currentPage === 1 || isLoading}
            aria-label={t('common.pagination.previous', "Previous page")}
            className="transition-all duration-200 hover:shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCurrentPage(page as number)
                  // Re-execute search if active
                  if (search && search.length > 0) {
                    enhancedSearch.search(search, {
                      page: page as number,
                      limit: 20,
                      filters: statusFilter ? { status: statusFilter } : {},
                    })
                  }
                }}
                disabled={isLoading}
                className={`transition-all duration-200 ${page === currentPage ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:shadow-sm"}`}
              >
                {page}
              </Button>
            )
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newPage = Math.min(pagination.pages, currentPage + 1)
              setCurrentPage(newPage)
              // Re-execute search if active
              if (search && search.length > 0) {
                enhancedSearch.search(search, {
                  page: newPage,
                  limit: 20,
                  filters: statusFilter ? { status: statusFilter } : {},
                })
              }
            }}
            disabled={currentPage === pagination.pages || isLoading}
            aria-label={t('common.pagination.next', "Next page")}
            className="transition-all duration-200 hover:shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-muted">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            {t(`assets.${assetType}.title`, title)}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('assets.list.description', `Manage your {0} assets`, t(`assets.${assetType}.title`, title).toLowerCase())}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md shadow-sm"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={canView === false}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('common.export', "Export")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="hidden sm:flex border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md shadow-sm"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={canCreate === false}
            >
              <Upload className="h-4 w-4 mr-2" />
              {t('common.import', "Import")}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md shadow-sm"
              onClick={() => setIsExportDialogOpen(true)}
              disabled={canView === false}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="sm:hidden border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md shadow-sm"
              onClick={() => setIsImportDialogOpen(true)}
              disabled={canCreate === false}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          {selectedAssets.length > 0 && canBulkDelete && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              className="transition-all duration-200 hover:shadow-md shadow-sm"
            >
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
            className="border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 transition-all duration-200 hover:shadow-md shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', "Refresh")}</span>
            <span className="sm:hidden">{t('common.refresh', "Refresh")}</span>
          </Button>
          {canCreate && (
            <Button 
              size="sm" 
              onClick={handleCreate}
              className="transition-all duration-200 hover:shadow-md shadow-sm bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('common.create', "Create")} {t(`assets.${assetType}.title`, title)}</span>
              <span className="sm:hidden">{t('common.create', "Create")}</span>
            </Button>
          )}
        </div>
      </div>
      
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{t(`assets.${assetType}.title`, title)} {t('common.list', "List")}</CardTitle>
              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                <span>
                  {t('assets.list.description', `Manage your {0} assets`, t(`assets.${assetType}.title`, title).toLowerCase())}
                </span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 h-auto text-xs w-fit"
                  onClick={() => router.push('/settings/custom-fields')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {t('assets.list.customFields', "Manage custom fields")}
                </Button>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-64">
                <SearchInput
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  onSearch={handleSearchComplete}
                  onClear={() => {
                    setSearchInputValue('')
                    setSearch('')
                    setIsSearching(true)
                  }}
                  onDeleteHistory={(query) => {
                    // Remove from context history
                    if (searchContext) {
                      searchContext.removeSearchFromHistory(query)
                    }
                  }}
                  placeholder={t('common.search.placeholder', "Search assets...")}
                  suggestions={enhancedSearch.suggestions}
                  disabled={canView === false}
                  showSuggestions={searchContext?.preferences.showSuggestions !== false}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto transition-all duration-200 hover:shadow-sm"
                      disabled={canView === false}
                    >
                      {statusFilter 
                        ? t(`assets.status.${statusFilter}`, statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))
                        : t('common.filter', "Filter")}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-muted shadow-lg">
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
                <Popover modal={false}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto transition-all duration-200 hover:shadow-sm"
                      disabled={canView === false}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('common.columns', "Columns")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-background border border-muted shadow-lg" align="end">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold leading-none">{t('common.columns', "Columns")}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('assets.list.columnVisibility', "Select which columns to display")}
                        </p>
                      </div>
                      <Separator />
                      <div className="grid gap-3 max-h-60 overflow-y-auto">
                        <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                          <span className="text-sm font-medium">{t('common.selectAll', "Select All")}</span>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleAllColumns(true)}
                              className="h-8 px-2 text-xs"
                              disabled={canView === false}
                            >
                              {t('common.show', "Show")}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleAllColumns(false)}
                              className="h-8 px-2 text-xs"
                              disabled={canView === false}
                            >
                              {t('common.hide', "Hide")}
                            </Button>
                          </div>
                        </div>
                        {allColumns.map((column) => (
                          <div key={column.key} className="flex items-center justify-between p-2 hover:bg-muted/30 rounded-lg transition-colors duration-150">
                            <span className="text-sm">{t(column.label, column.label)}</span>
                            <Checkbox
                              checked={columnVisibility[column.key]}
                              onCheckedChange={() => toggleColumnVisibility(column.key)}
                              disabled={canView === false}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
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
        <CardContent className="p-0">
          <div className="rounded-b-xl border-x border-b overflow-hidden bg-background">
            <DataTable
              columns={dataTableColumns}
              data={assets}
              searchable={false}
              filterable={false}
              sortable={true}
              pagination={false}
              pageSize={10}
              onRowSelectionChange={handleRowSelectionChange}
              loading={isLoading}
              error={isError ? (error as ApiError).message : null}
              onRefresh={refetch}
              disableBuiltInFeatures={false}
              getRowId={(row: Asset) => row.id}
              responsive={true}
              enableColumnResizing={true}
              enableColumnReordering={true}
              onColumnOrderChange={handleColumnOrderChangeWithSave}
              enableVirtualization={assets.length > 50}
              virtualItemHeight={50}
              columnVisibility={columnVisibility}
              onColumnVisibilityChange={(newVisibility) => {
                // Update our local state and save to localStorage
                setColumnVisibility(newVisibility)
                try {
                  localStorage.setItem(getColumnVisibilityStorageKey(assetType), JSON.stringify(newVisibility))
                } catch (e) {
                  logger.warn('Failed to save column visibility to localStorage', { error: e instanceof Error ? e.message : String(e) })
                }
              }}
            />
          </div>

          <div className="p-4 bg-muted/30 border-t border-muted">
            {renderPagination()}
          </div>
        </CardContent>
      </Card>
      
      {/* View Dialog */}
      <MemoizedComponents.AssetDetailDialog
        asset={viewAsset}
        title={title}
        columns={allColumns.map((column, index) => {
          // Determine if this is a custom field
          const isCustom = isCustomField(column.key, {}, customFieldsData || undefined)
          
          // Create a unique key for this column
          const uniqueKey = `${column.key}-${isCustom ? 'custom' : 'standard'}-${index}`
          
          return {
            ...column,
            key: uniqueKey,
            originalKey: column.key, // Store the original key for reference
            isCustomField: isCustom // Store whether this is a custom field
          }
        })}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
        onEdit={handleEditFromView}
        assetType={assetType}
      />
      
      {/* Form Dialog - Only show if user has create or edit permissions */}
      {(canCreate || canEdit) && (
        <MemoizedComponents.AssetFormDialog
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
        <MemoizedComponents.DeleteConfirmDialog
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
        <MemoizedComponents.BulkDeleteDialog
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
        <MemoizedComponents.ExcelImportDialog
          assetType={assetType}
          title={title}
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}
      
      {/* Export Dialog - Only show if user has view permissions */}
      {canView && (
        <MemoizedComponents.ExcelExportDialog
          assetType={assetType}
          title={title}
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          selectedAssetIds={selectedAssets}
        />
      )}
    </div>
  )
}