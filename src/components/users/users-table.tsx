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
import { User, Tenant } from "@/hooks/useApi"
import { BulkDeleteDialog } from "@/components/users/bulk-delete-dialog"

// Define the interface directly in this file to avoid import issues
interface UsersTableProps {
  users: User[];
  tenants: Tenant[];
  onEdit: (user: User | null) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  deletingUserId: string | null;
}

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

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  // Handle select individual user
  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedUsers.length === 0) {
      // Show error message
      return
    }
    setIsBulkDeleteDialogOpen(true)
  }

  // Confirm bulk delete
  const confirmBulkDelete = () => {
    // This will be handled by the parent component
    onDelete(selectedUsers.join(',')) // Pass selected IDs as a comma-separated string
    setIsBulkDeleteDialogOpen(false)
    setSelectedUsers([])
  }

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
          {selectedUsers.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash className="h-4 w-4 mr-2" />
              {t('common.delete', 'Delete')} ({selectedUsers.length})
            </Button>
          )}
          <Button onClick={() => onEdit(null)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('users.create.button') || 'Add User'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead>{t('users.table.name') || 'Name'}</TableHead>
              <TableHead>{t('users.table.email') || 'Email'}</TableHead>
              <TableHead>{t('users.table.role') || 'Role'}</TableHead>
              <TableHead>{t('users.table.tenant') || 'Tenant'}</TableHead>
              <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {search 
                    ? t('common.noResults') || 'No results found' 
                    : t('users.list.empty') || 'No users found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user: User) => (
                <TableRow key={user.id} className={selectedUsers.includes(user.id) ? 'bg-muted' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {tenants.find((t: Tenant) => t.id === user.tenantId)?.name || '-'}
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
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit') || 'Edit'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(user.id)}
                          disabled={isDeleting && deletingUserId === user.id}
                        >
                          {isDeleting && deletingUserId === user.id ? (
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