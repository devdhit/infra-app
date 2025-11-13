'use client';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton with enhanced styling */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-muted">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" animated />
          <Skeleton className="h-4 w-48 rounded-lg" animated />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" animated />
          <Skeleton className="h-8 w-24 rounded-lg" animated />
        </div>
      </div>

      {/* Tabs skeleton with enhanced styling */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-10 rounded-lg" animated />
        <Skeleton className="h-10 rounded-lg" animated />
        <Skeleton className="h-10 rounded-lg" animated />
      </div>

      {/* Summary cards skeleton with enhanced styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500 bg-gradient-to-br from-background to-muted/30 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20 rounded-lg" animated />
                <Skeleton className="h-3 w-24 rounded-lg" animated />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" animated />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16 mt-2 rounded-lg" animated />
              <Skeleton className="h-3 w-20 mt-3 rounded-lg" animated />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart cards skeleton with enhanced styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full bg-gradient-to-br from-background to-muted/30 border-t-4 border-t-blue-500 overflow-hidden">
          <CardHeader>
            <div className="relative inline-block">
              <Skeleton className="h-5 w-32 rounded-lg" animated />
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-primary/30" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 rounded-lg" animated />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-lg" animated />
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full bg-gradient-to-br from-background to-muted/30 border-t-4 border-t-blue-500 overflow-hidden">
          <CardHeader>
            <div className="relative inline-block">
              <Skeleton className="h-5 w-32 rounded-lg" animated />
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-primary/30" />
              </div>
            </div>
            <Skeleton className="h-4 w-48 rounded-lg" animated />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full rounded-lg" animated />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}