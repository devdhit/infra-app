'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronDown, Plus, Search, Download, Upload } from "lucide-react"
import { AssetColumn } from "@/types/assets"

interface AssetListSkeletonProps {
  title: string
  columns: AssetColumn[]
}

export function AssetListSkeleton({ title, columns }: AssetListSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Manage your {title.toLowerCase()} assets
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create {title}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{title} List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  className="pl-8 w-full md:w-[300px]"
                  disabled
                />
              </div>
              <Button variant="outline" className="w-full md:w-auto" disabled>
                All Statuses <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            A list of all {title.toLowerCase()} assets in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableHead>
                  {columns.map((column) => (
                    <TableHead key={column.key} className="whitespace-nowrap">
                      <Skeleton className="h-4 w-20" />
                    </TableHead>
                  ))}
                  <TableHead className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-4 rounded" />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Mobile view skeleton */}
          <div className="md:hidden space-y-4 mt-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="flex flex-col">
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 flex-wrap w-full">
            <div className="text-sm text-muted-foreground">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-1 items-center">
              <Button variant="outline" size="sm" disabled>
                <Skeleton className="h-4 w-4" />
              </Button>
              {Array.from({ length: 3 }).map((_, index) => (
                <Button key={index} variant="outline" size="sm" disabled>
                  <Skeleton className="h-4 w-4" />
                </Button>
              ))}
              <Button variant="outline" size="sm" disabled>
                <Skeleton className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}