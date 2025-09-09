'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { UsersTableProps } from "@/types/users"

export function UsersTable({ 
  users, 
  tenants, 
  onEdit,
  onDelete,
  isDeleting,
  deletingUserId
}: UsersTableProps) {
  const { t } = useTranslation()
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length && users.length > 0) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(users.map(user => user.id)))
    }
  }

  const getTenantName = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId)
    return tenant ? tenant.name : 'Unknown'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length && users.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </TableHead>
            <TableHead>{t('users.table.name') || 'Name'}</TableHead>
            <TableHead>{t('users.table.email') || 'Email'}</TableHead>
            <TableHead>{t('users.table.role') || 'Role'}</TableHead>
            <TableHead>{t('users.table.tenant') || 'Tenant'}</TableHead>
            <TableHead>{t('users.table.createdAt') || 'Created'}</TableHead>
            <TableHead className="text-right">{t('users.table.actions') || 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableCell>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {user.role?.name || 'N/A'}
                </Badge>
              </TableCell>
              <TableCell>{getTenantName(user.tenantId)}</TableCell>
              <TableCell>{formatDate(user.createdAt)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('common.edit') || 'Edit'}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(user.id)}
                        disabled={isDeleting && deletingUserId === user.id}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t('common.delete') || 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {selectedUsers.size > 0 && onDelete && (
        <div className="border-t p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('users.table.selected', '{0} users selected', selectedUsers.size.toString()) || 
             `${selectedUsers.size} users selected`}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(Array.from(selectedUsers))}
            disabled={isDeleting}
          >
            {t('users.table.deleteSelected') || 'Delete Selected'}
          </Button>
        </div>
      )}
    </div>
  )
}