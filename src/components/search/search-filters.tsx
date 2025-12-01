'use client';

import React, { useState } from 'react';
import { Filter, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SearchFilters as SearchFiltersType } from '@/hooks/useEnhancedSearch';

/**
 * SearchFilters Component
 * 
 * Features:
 * - Dynamic filter options based on asset type
 * - Date range filters
 * - Multi-select filters
 * - Active filters display
 * - Clear filters functionality
 */

export interface SearchFiltersProps {
  filters: SearchFiltersType;
  filterOptions: Record<string, string[]>;
  onChange: (filters: SearchFiltersType) => void;
  onClear?: () => void;
  className?: string;
}

export function SearchFilters({
  filters,
  filterOptions,
  onChange,
  onClear,
  className,
}: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Update a single filter
   */
  const updateFilter = (key: string, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value === undefined || value === '' || value === 'all') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    onChange(newFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    onChange({});
    if (onClear) {
      onClear();
    }
  };

  /**
   * Get active filter count
   */
  const activeFilterCount = Object.keys(filters).filter(
    key => filters[key] !== undefined && filters[key] !== ''
  ).length;

  /**
   * Get display label for filter
   */
  const getFilterLabel = (key: string): string => {
    const labels: Record<string, string> = {
      status: 'Status',
      dept: 'Department',
      dateFrom: 'From Date',
      dateTo: 'To Date',
      model: 'Model',
      location: 'Location',
      color: 'Color',
      updateStatus: 'Update Status',
      productType: 'Product Type',
      internetAccess: 'Internet Access',
      category: 'Category',
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filters</h4>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-auto p-0 text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Status Filter */}
            {filterOptions.status && filterOptions.status.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="filter-status" className="text-xs">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger id="filter-status" className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {filterOptions.status.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department Filter */}
            {filterOptions.dept && filterOptions.dept.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="filter-dept" className="text-xs">Department</Label>
                <Select
                  value={filters.dept || 'all'}
                  onValueChange={(value) => updateFilter('dept', value)}
                >
                  <SelectTrigger id="filter-dept" className="h-9">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {filterOptions.dept.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Model Filter */}
            {filterOptions.model && filterOptions.model.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="filter-model" className="text-xs">Model</Label>
                <Select
                  value={filters.model || 'all'}
                  onValueChange={(value) => updateFilter('model', value)}
                >
                  <SelectTrigger id="filter-model" className="h-9">
                    <SelectValue placeholder="All models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All models</SelectItem>
                    {filterOptions.model.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location Filter */}
            {filterOptions.location && filterOptions.location.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="filter-location" className="text-xs">Location</Label>
                <Select
                  value={filters.location || 'all'}
                  onValueChange={(value) => updateFilter('location', value)}
                >
                  <SelectTrigger id="filter-location" className="h-9">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All locations</SelectItem>
                    {filterOptions.location.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range Filters */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="filter-dateFrom" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="filter-dateFrom"
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="filter-dateTo" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="filter-dateTo"
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="text-xs">
                  {getFilterLabel(key)}: {value}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter(key, undefined)}
                  className="h-auto w-auto p-0 hover:bg-transparent"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {key} filter</span>
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchFilters;
