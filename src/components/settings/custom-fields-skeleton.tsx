'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { HelpCircle, Plus } from "lucide-react"

export function CustomFieldsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      </div>
      
      {/* Alert skeleton */}
      <div className="rounded-lg border p-4">
        <div className="flex">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5 mt-1" />
        </div>
      </div>
      
      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Custom Fields</CardTitle>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
          <CardDescription>
            Create custom fields for different asset types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex">
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-12 w-1/4" />
              <Skeleton className="h-12 w-24" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex py-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-6 w-1/4" />
                <div className="flex justify-end w-24">
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center py-8">
            <Skeleton className="h-4 w-48 mx-auto mb-4" />
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}