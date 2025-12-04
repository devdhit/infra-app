'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Filter } from "lucide-react"

interface FilterOption {
  label: string
  value: string
}

interface FilterDropdownProps {
  options: FilterOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function FilterDropdown({
  options,
  value,
  onValueChange,
  placeholder = "Filter...",
  label
}: FilterDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{label}:</span>
        </div>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
