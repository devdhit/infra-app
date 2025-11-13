'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function AssetListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton with enhanced styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-muted">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48 rounded-lg" animated />
          <Skeleton className="h-4 w-64 rounded-lg" animated />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" animated />
          <Skeleton className="h-8 w-20 rounded-lg" animated />
          <Skeleton className="h-8 w-24 rounded-lg" animated />
          <Skeleton className="h-8 w-24 rounded-lg" animated />
        </div>
      </div>

      {/* Card header skeleton with enhanced styling */}
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded-lg" animated />
              <Skeleton className="h-4 w-64 rounded-lg" animated />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Skeleton className="h-8 w-48 rounded-lg" animated />
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingSpinner size="sm" className="text-primary/30" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" animated />
                <Skeleton className="h-8 w-24 rounded-lg" animated />
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Table skeleton with enhanced styling */}
        <CardContent className="p-0">
          <div className="rounded-b-xl border-x border-b overflow-hidden bg-background transition-all duration-300 hover:shadow-md">
            {/* Table header skeleton */}
            <div className="bg-muted/30">
              <div className="flex">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-3 flex-1">
                    <Skeleton className="h-4 w-20 rounded-lg" animated />
                  </div>
                ))}
              </div>
            </div>

            {/* Table rows skeleton with varied animation delays for a more natural feel */}
            <div className="divide-y divide-muted">
              {[...Array(10)].map((_, i) => (
                <div 
                  key={i} 
                  className="flex"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {[...Array(6)].map((_, j) => (
                    <div key={j} className="p-3 flex-1">
                      <Skeleton 
                        className="h-4 w-full rounded-lg" 
                        animated 
                        style={{ animationDelay: `${j * 0.02}s` }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination skeleton with enhanced styling */}
          <div className="p-4 bg-muted/30 border-t border-muted rounded-b-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Skeleton className="h-4 w-48 rounded-lg" animated />
              <div className="flex gap-2 items-center">
                <Skeleton className="h-8 w-8 rounded-lg" animated />
                <Skeleton className="h-8 w-24 rounded-lg" animated />
                <Skeleton className="h-8 w-8 rounded-lg" animated />
                <LoadingSpinner size="sm" className="text-primary/30 ml-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}