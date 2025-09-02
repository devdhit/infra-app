'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  ChevronDown, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Eye as EyeIcon,
  Settings
} from "lucide-react"

export function AssetListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="hidden sm:flex">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" disabled className="hidden sm:flex">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="icon" disabled className="sm:hidden">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled className="sm:hidden">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Asset</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>
      
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-4 w-48" />
                <Button variant="link" size="sm" className="p-0 h-auto text-xs" disabled>
                  <Settings className="h-3 w-3 mr-1" />
                  Manage custom fields
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Skeleton className="h-9 w-full sm:w-64 pl-8" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" className="w-full sm:w-auto" disabled>
                  Filter
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                
                <Button variant="outline" className="w-full sm:w-auto" disabled>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="w-full">
              {/* Table header skeleton */}
              <div className="border-b bg-muted/30">
                <div className="flex">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 text-left font-medium text-sm w-32">
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                  <div className="p-3 text-center font-medium text-sm w-20">
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                </div>
              </div>
              
              {/* Table body skeleton */}
              <div>
                {[...Array(10)].map((_, rowIndex) => (
                  <div key={rowIndex} className="border-b">
                    <div className="flex">
                      {[...Array(6)].map((_, colIndex) => (
                        <div key={colIndex} className="p-3 w-32">
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                      <div className="p-3 w-20 flex items-center justify-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination skeleton */}
          <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-1 items-center">
              <Button variant="outline" size="sm" disabled>
                <ChevronDown className="h-4 w-4 rotate-90" />
              </Button>
              <div className="text-sm">
                <Skeleton className="h-4 w-24" />
              </div>
              <Button variant="outline" size="sm" disabled>
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}