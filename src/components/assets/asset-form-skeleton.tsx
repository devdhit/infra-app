'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface AssetFormSkeletonProps {
  title: string
  fieldCount?: number
}

export function AssetFormSkeleton({ fieldCount = 5 }: AssetFormSkeletonProps) {
  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Skeleton className="h-6 w-32" />
          </DialogTitle>
          <DialogDescription>
            <Skeleton className="h-4 w-64" />
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {Array.from({ length: fieldCount }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" disabled>
            <Skeleton className="h-4 w-16" />
          </Button>
          <Button disabled>
            <Skeleton className="h-4 w-16" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}