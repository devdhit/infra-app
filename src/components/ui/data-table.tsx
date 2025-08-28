'use client'

import * as React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Row,
  Column,
  HeaderGroup,
  Cell,
  Table as ReactTable,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Eye, EyeOff, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  onRowSelectionChange?: (selectedRows: Record<string, boolean>) => void
  // Add props for API integration
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  // New prop to disable built-in features when columns are processed externally
  disableBuiltInFeatures?: boolean
  // New prop to specify row ID accessor
  getRowId?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onRowSelectionChange,
  loading = false,
  error = null,
  onRefresh,
  disableBuiltInFeatures = false,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [searchValue, setSearchValue] = React.useState('')

  // Clear row selection when data changes (e.g., after bulk delete)
  React.useEffect(() => {
    // Only clear selection if there are no selected rows or if the data has changed significantly
    if (Object.keys(rowSelection).length > 0) {
      // Check if any of the selected row IDs still exist in the new data
      const newDataIds = new Set(data.map((item, index) => getRowId ? getRowId(item) : index.toString()));
      const hasValidSelections = Object.keys(rowSelection).some(id => newDataIds.has(id));
      
      // Only clear selection if none of the selected rows exist in the new data
      if (!hasValidSelections) {
        setRowSelection({});
      }
    }
  }, [data, getRowId, rowSelection]);

  // Notify parent component of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowSelection)
    }
  }, [rowSelection, onRowSelectionChange])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    enableGlobalFilter: searchable,
    // Use custom row ID function if provided
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
  })

  // Reset pagination when data changes
  React.useEffect(() => {
    table.setPageIndex(0)
  }, [data, table])

  // Toggle all columns visibility
  const toggleAllColumns = (visible: boolean) => {
    const newState: VisibilityState = {}
    table.getAllColumns().forEach((col: Column<TData, unknown>) => {
      if (col.getCanHide()) {
        newState[col.id] = visible
      }
    })
    setColumnVisibility(newState)
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setColumnFilters([])
    setSearchValue('')
  }

  // Remove duplicate columns based on id
  const getUniqueColumns = React.useCallback(() => {
    const seen = new Set()
    return table
      .getAllColumns()
      .filter((column: Column<TData, unknown>) => {
        if (typeof column.accessorFn !== 'undefined' && column.getCanHide()) {
          const key = column.id
          if (seen.has(key)) {
            return false
          }
          seen.add(key)
          return true
        }
        return false
      })
  }, [table])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        {onRefresh && (
          <Button onClick={onRefresh}>
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Table Container with Enhanced Horizontal Scrolling */}
      <div className="rounded-md border overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <Table className="min-w-full">
              <TableHeader className="sticky top-0 bg-background z-10">
                {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header, index) => {
                      return (
                        <TableHead 
                          key={header.id} 
                          className={`whitespace-nowrap ${index === 0 ? 'sticky left-0 bg-background z-20' : ''}`}
                          colSpan={header.colSpan}
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              {...{
                                className: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                                  ? "cursor-pointer select-none flex items-center"
                                  : "flex items-center",
                                onClick: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                                  ? header.column.getToggleSortingHandler()
                                  : undefined,
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {(sortable && header.column.getCanSort() && !disableBuiltInFeatures) && (
                                <span className="ml-1">
                                  {{
                                    asc: ' ↑',
                                    desc: ' ↓',
                                  }[header.column.getIsSorted() as string] ?? null}
                                </span>
                              )}
                            </div>
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row: Row<TData>) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => onRowClick?.(row.original)}
                      className={onRowClick ? 'cursor-pointer' : ''}
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <TableCell 
                          key={cell.id} 
                          className={`whitespace-nowrap ${index === 0 ? 'sticky left-0 bg-background z-10' : ''}`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Pagination - only show if built-in features are enabled */}
      {pagination && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}