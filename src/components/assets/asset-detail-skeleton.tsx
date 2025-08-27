'use client'

import { Skeleton } from "@/components/ui/skeleton"
import { AssetDialog } from "./asset-dialog"

interface AssetDetailSkeletonProps {
  title: string
  fieldCount?: number
}

export function AssetDetailSkeleton({ title, fieldCount = 8 }: AssetDetailSkeletonProps) {
  return (
    <AssetDialog
      title={`View ${title} Details`}
      description="Loading asset details..."
      isOpen={true}
      onClose={() => {}}
      size="md"
    >
      <div className="space-y-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <Skeleton className="h-6 w-48 mb-3" />
          <div className="grid gap-3">
            {Array.from({ length: fieldCount }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <Skeleton className="h-4 w-4 mt-1" />
                <div className="grid gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <div className="grid gap-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AssetDialog>
  )
}