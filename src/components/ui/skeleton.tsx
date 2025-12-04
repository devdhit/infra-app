'use client'

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
}

function Skeleton({ 
  className, 
  animated = true,
  rounded = 'md',
  ...props 
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  }

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent",
        animated ? "animate-pulse" : "",
        roundedClasses[rounded],
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
