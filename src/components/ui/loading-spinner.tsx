'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  fullScreen?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ 
    size = 'md', 
    variant = 'primary', 
    fullScreen = false,
    className,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    };

    const variantClasses = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
    };

    const spinner = (
      <div
        ref={ref}
        className={cn(
          'inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
          Loading...
        </span>
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            {spinner}
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      );
    }

    return spinner;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner, type LoadingSpinnerProps };