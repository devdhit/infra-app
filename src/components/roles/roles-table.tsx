'use client'

import { useState } from 'react'
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { RolesTableProps } from "@/types/roles"

export function RolesTable({ 
  roles, 
  onEdit,
  onDelete,
  isDeleting,
  deletingRoleId
}: RolesTableProps) {
  const { t } = useTranslation()
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())

  const handleSelectRole = (roleId: string) => {
    setSelectedRoles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roleId)) {
        newSet.delete(roleId)
      } else {
        newSet.add(roleId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedRoles.size === roles.length) {
      setSelectedRoles(new Set())
    } else {
      setSelectedRoles(new Set(roles.map(role => role.id)))
    }
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
                checked={selectedRoles.size === roles.length && roles.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </TableHead>
            <TableHead>{t('roles.table.name') || 'Name'}</TableHead>
            <TableHead>{t('roles.table.description') || 'Description'}</TableHead>
            <TableHead>{t('roles.table.createdAt') || 'Created'}</TableHead>
            <TableHead className="text-right">{t('common.actions') || 'Actions'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className="hover:bg-muted/50">
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedRoles.has(role.id)}
                  onChange={() => handleSelectRole(role.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableCell>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell>{role.description || '-'}</TableCell>
              <TableCell>{formatDate(role.createdAt)}</TableCell>
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
                      <DropdownMenuItem onClick={() => onEdit(role)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t('common.edit') || 'Edit'}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(role.id)}
                        disabled={isDeleting && deletingRoleId === role.id}
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
      {selectedRoles.size > 0 && onDelete && (
        <div className="border-t p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {t('common.selectedCount', '{0} roles selected', selectedRoles.size.toString()) || 
             `${selectedRoles.size} roles selected`}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              // Handle bulk delete if needed
            }}
            disabled={isDeleting}
          >
            {t('common.delete') || 'Delete'}
          </Button>
        </div>
      )}
    </div>
  )
}