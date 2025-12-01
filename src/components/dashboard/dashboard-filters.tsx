'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface FilterOption {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { label: string; value: string }[]
}

interface DashboardFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void
  onReset: () => void
}

export function DashboardFilters({ onFilterChange, onReset }: DashboardFiltersProps) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [date, setDate] = useState<Date | undefined>(undefined)

  // Define filter options
  const filterOptions: FilterOption[] = [
    {
      id: 'assetType',
      label: t('nav.assets') || 'Asset Type',
      type: 'select',
      options: [
        { label: t('nav.pc') || 'PC', value: 'pc' },
        { label: t('nav.laptop') || 'Laptop', value: 'laptop' },
        { label: t('nav.printer') || 'Printer', value: 'printer' },
        { label: t('nav.license') || 'License', value: 'license' },
        { label: t('nav.warehouse') || 'Warehouse IT', value: 'warehouse' },
        { label: t('nav.internet') || 'Internet', value: 'internet' },
      ]
    },
    {
      id: 'department',
      label: t('common.department') || 'Department',
      type: 'text'
    },
    {
      id: 'status',
      label: t('assets.status.working') || 'Status',
      type: 'select',
      options: [
        { label: t('assets.status.working') || 'Working', value: 'working' },
        { label: t('assets.status.leave') || 'Leave', value: 'leave' },
        { label: t('assets.status.repair') || 'Repair', value: 'repair' },
      ]
    },
    {
      id: 'dateRange',
      label: t('dashboard.currentDate') || 'Date Range',
      type: 'date'
    }
  ]

  const handleFilterChange = (id: string, value: any) => {
    const newFilters = { ...filters, [id]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    setFilters({})
    setDate(undefined)
    onReset()
  }

  const hasActiveFilters = Object.keys(filters).length > 0

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-medium">{t('common.filter')}</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="w-full sm:w-auto">
            <X className="h-4 w-4 mr-2" />
            {t('common.reset')}
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {filterOptions.map((option) => (
          <div key={option.id} className="space-y-2">
            <Label htmlFor={option.id}>{option.label}</Label>
            {option.type === 'text' && (
              <Input
                id={option.id}
                value={filters[option.id] || ''}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                placeholder={option.label}
              />
            )}
            {option.type === 'select' && option.options && (
              <Select
                value={filters[option.id] || ''}
                onValueChange={(value) => handleFilterChange(option.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={option.label} />
                </SelectTrigger>
                <SelectContent>
                  {option.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {option.type === 'date' && (
              <Popover modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>{t('dashboard.currentDate') || 'Pick a date'}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate)
                      handleFilterChange(option.id, newDate)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            {option.type === 'number' && (
              <Input
                id={option.id}
                type="number"
                value={filters[option.id] || ''}
                onChange={(e) => handleFilterChange(option.id, e.target.value)}
                placeholder={option.label}
              />
            )}
            {option.type === 'boolean' && (
              <Select
                value={filters[option.id] !== undefined ? String(filters[option.id]) : ''}
                onValueChange={(value) => handleFilterChange(option.id, value === 'true')}
              >
                <SelectTrigger>
                  <SelectValue placeholder={option.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('common.yes') || 'Yes'}</SelectItem>
                  <SelectItem value="false">{t('common.no') || 'No'}</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button onClick={() => {}} className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          {t('common.apply')}
        </Button>
      </div>
    </div>
  )
}