'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Tenant } from "@/hooks/useApi"
import { BulkDeleteDialog } from "@/components/tenants/bulk-delete-dialog"

// Define the interface directly in this file to avoid import issues
interface TenantsTableProps {
  tenants: Tenant[];
  onEdit?: (tenant: Tenant | null) => void;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
  deletingTenantId: string | null;
}

// Define columns for the DataTable
const useTenantColumns = (t: (key: string, fallback?: string) => string, onEdit: ((tenant: Tenant) => void) | undefined, onDelete: ((id: string) => void) | undefined, isDeleting: boolean, deletingTenantId: string | null): ColumnDef<Tenant>[] => {
  return useMemo(() => [
    {
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
    },
    {
      accessorKey: 'name',
      header: t('tenants.table.name', 'Name'),
    },
    {
      accessorKey: 'description',
      header: t('tenants.table.description', 'Description'),
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: '_count',
      header: t('tenants.table.assets', 'Assets'),
      cell: ({ row }) => {
        const count = row.original._count;
        if (!count) return '0';
        
        return (
          <div className="flex flex-wrap gap-1">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              PC: {count.pcs}
            </span>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
              Laptop: {count.laptops}
            </span>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
              Printer: {count.printers}
            </span>
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
              License: {count.licenses}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'users',
      header: t('tenants.table.users', 'Users'),
      cell: ({ row }) => {
        const count = row.original._count;
        return count ? count.users : '0';
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions', 'Actions')}</div>,
      cell: ({ row }) => {
        const tenant = row.original;
        
        // If no action handlers are provided, don't show actions
        if (!onEdit && !onDelete) {
          return null;
        }
        
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
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(tenant)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit', 'Edit')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(tenant.id)}
                    disabled={
                      (tenant._count && (tenant._count.users > 0 || 
                        tenant._count.pcs > 0 || 
                        tenant._count.laptops > 0 || 
                        tenant._count.printers > 0 || 
                        tenant._count.licenses > 0)) ||
                      (isDeleting && deletingTenantId === tenant.id)
                    }
                  >
                    {isDeleting && deletingTenantId === tenant.id ? (
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        {t('common.deleting', 'Deleting...')}
                      </div>
                    ) : (
                      <>
                        <Trash className="mr-2 h-4 w-4" />
                        {t('common.delete', 'Delete')}
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, onEdit, onDelete, isDeleting, deletingTenantId]);
};

export function TenantsTable({ 
  tenants, 
  onEdit, 
  onDelete,
  isDeleting,
  deletingTenantId
}: TenantsTableProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const columns = useTenantColumns(t, onEdit, onDelete, isDeleting, deletingTenantId)

  // Filter tenants based on search term
  const filteredTenants = useMemo(() => {
    if (!search) return tenants
    const term = search.toLowerCase()
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(term) || 
      (tenant.description && tenant.description.toLowerCase().includes(term))
    )
  }, [tenants, search])

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedTenants.length === 0 || !onDelete) {
      // Show error message or do nothing
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }, [selectedTenants.length, onDelete])

  // Confirm bulk delete
  const confirmBulkDelete = useCallback(() => {
    if (!onDelete) return;
    // This will be handled by the parent component
    onDelete(selectedTenants.join(',')) // Pass selected IDs as a comma-separated string
    setIsBulkDeleteDialogOpen(false)
    setSelectedTenants([])
  }, [onDelete, selectedTenants])

  // Handle row selection
  const handleRowSelection = useCallback((rows: Record<string, boolean>) => {
    const selectedIds = Object.keys(rows).filter(id => rows[id])
    setSelectedTenants(selectedIds)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tenants.search.placeholder') || "Search tenants..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {selectedTenants.length > 0 && onDelete && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              {t('common.delete', 'Delete')} ({selectedTenants.length})
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredTenants}
        searchable={false} // We're handling search outside the DataTable
        filterable={false} // We're handling filtering outside the DataTable
        sortable={true}
        pagination={true}
        pageSize={10}
        onRowSelectionChange={handleRowSelection}
        // Enable responsive features
        responsive={true}
        // Enable column resizing
        enableColumnResizing={true}
      />

      <BulkDeleteDialog
        title={t('tenants.title', 'Tenants')}
        count={selectedTenants.length}
        isOpen={isBulkDeleteDialogOpen}
        isDeleting={isDeleting}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}