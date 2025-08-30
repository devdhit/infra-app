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
import { Search, MoreHorizontal, Edit, Trash, Plus } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { User, Tenant } from "@/hooks/useApi"
import { BulkDeleteDialog } from "@/components/users/bulk-delete-dialog"

// Define the interface directly in this file to avoid import issues
interface UsersTableProps {
  users: User[];
  tenants: Tenant[];
  onEdit?: (user: User | null) => void;
  onDelete?: (id: string) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

// Define columns for the DataTable
const useUserColumns = (t: (key: string, fallback?: string) => string, onEdit: ((user: User) => void) | undefined, onDelete: ((id: string) => void) | undefined, isDeleting: boolean, deletingUserId: string | null, tenants: Tenant[]): ColumnDef<User>[] => {
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
      header: t('users.table.name', 'Name'),
    },
    {
      accessorKey: 'email',
      header: t('users.table.email', 'Email'),
    },
    {
      accessorKey: 'role',
      header: t('users.table.role', 'Role'),
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            role === 'admin' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-blue-100 text-blue-800'
          }`}>
            {role}
          </span>
        );
      },
    },
    {
      accessorKey: 'tenant',
      header: t('users.table.tenant', 'Tenant'),
      cell: ({ row }) => {
        const user = row.original;
        return tenants.find((t: Tenant) => t.id === user.tenantId)?.name || '-';
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">{t('common.actions', 'Actions')}</div>,
      cell: ({ row }) => {
        const user = row.original;
        
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
                  <DropdownMenuItem onClick={() => onEdit(user)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('common.edit', 'Edit')}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(user.id)}
                    disabled={isDeleting && deletingUserId === user.id}
                  >
                    {isDeleting && deletingUserId === user.id ? (
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
  ], [t, onEdit, onDelete, isDeleting, deletingUserId, tenants]);
};

export function UsersTable({ 
  users, 
  tenants,
  onEdit, 
  onDelete,
  isDeleting,
  deletingUserId
}: UsersTableProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const columns = useUserColumns(t, onEdit, onDelete, isDeleting, deletingUserId, tenants)

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!search) return users
    const term = search.toLowerCase()
    return users.filter((user: User) => 
      user.name.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    )
  }, [users, search])

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedUsers.length === 0 || !onDelete) {
      // Show error message or do nothing
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }, [selectedUsers.length, onDelete])

  // Confirm bulk delete
  const confirmBulkDelete = useCallback(() => {
    if (!onDelete) return;
    // This will be handled by the parent component
    onDelete(selectedUsers.join(',')) // Pass selected IDs as a comma-separated string
    setIsBulkDeleteDialogOpen(false)
    setSelectedUsers([])
  }, [onDelete, selectedUsers])

  // Handle row selection
  const handleRowSelection = useCallback((rows: Record<string, boolean>) => {
    const selectedIds = Object.keys(rows).filter(id => rows[id])
    setSelectedUsers(selectedIds)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('users.search.placeholder') || "Search users..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && onDelete && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              {t('common.delete', 'Delete')} ({selectedUsers.length})
            </Button>
          )}
          {onEdit && (
            <Button onClick={() => onEdit(null)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('users.create.button') || 'Add User'}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
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
        title={t('users.title', 'Users')}
        count={selectedUsers.length}
        isOpen={isBulkDeleteDialogOpen}
        isDeleting={isDeleting}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}