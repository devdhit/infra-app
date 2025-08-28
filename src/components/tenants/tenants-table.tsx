'use client'

import { useState, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash,
  Search,
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { Tenant } from "@/hooks/useApi"
import { BulkDeleteDialog } from "@/components/tenants/bulk-delete-dialog"

// Define the interface directly in this file to avoid import issues
interface TenantsTableProps {
  tenants: Tenant[];
  onEdit: (tenant: Tenant | null) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingTenantId: string | null;
}

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

  // Filter tenants based on search term
  const filteredTenants = useMemo(() => {
    if (!search) return tenants
    const term = search.toLowerCase()
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(term) || 
      (tenant.description && tenant.description.toLowerCase().includes(term))
    )
  }, [tenants, search])

  // Handle select all tenants
  const handleSelectAll = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([])
    } else {
      setSelectedTenants(filteredTenants.map(tenant => tenant.id))
    }
  }

  // Handle select individual tenant
  const handleSelectTenant = (tenantId: string) => {
    if (selectedTenants.includes(tenantId)) {
      setSelectedTenants(selectedTenants.filter(id => id !== tenantId))
    } else {
      setSelectedTenants([...selectedTenants, tenantId])
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedTenants.length === 0) {
      // Show error message
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }

  // Confirm bulk delete
  const confirmBulkDelete = () => {
    // This will be handled by the parent component
    onDelete(selectedTenants.join(',')) // Pass selected IDs as a comma-separated string
    setIsBulkDeleteDialogOpen(false)
    setSelectedTenants([])
  }

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
          {selectedTenants.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              {t('common.delete', 'Delete')} ({selectedTenants.length})
            </Button>
          )}
          <Button onClick={() => onEdit(null)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('tenants.create.button') || 'Add Tenant'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTenants.length === filteredTenants.length && filteredTenants.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead>{t('tenants.table.name') || 'Name'}</TableHead>
              <TableHead>{t('tenants.table.description') || 'Description'}</TableHead>
              <TableHead>{t('tenants.table.assets') || 'Assets'}</TableHead>
              <TableHead>{t('tenants.table.users') || 'Users'}</TableHead>
              <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {search 
                    ? t('common.noResults') || 'No results found' 
                    : t('tenants.list.empty') || 'No tenants found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id} className={selectedTenants.includes(tenant.id) ? 'bg-muted' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTenants.includes(tenant.id)}
                      onCheckedChange={() => handleSelectTenant(tenant.id)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>{tenant.description || '-'}</TableCell>
                  <TableCell>
                    {tenant._count ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          PC: {tenant._count.pcs}
                        </span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Laptop: {tenant._count.laptops}
                        </span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          Printer: {tenant._count.printers}
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                          License: {tenant._count.licenses}
                        </span>
                      </div>
                    ) : '0'}
                  </TableCell>
                  <TableCell>
                    {tenant._count ? tenant._count.users : '0'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t('common.openMenu') || 'Open menu'}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tenant)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit') || 'Edit'}
                        </DropdownMenuItem>
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
                              {t('common.deleting') || 'Deleting...'}
                            </div>
                          ) : (
                            <>
                              <Trash className="mr-2 h-4 w-4" />
                              {t('common.delete') || 'Delete'}
                            </>
                          )}
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