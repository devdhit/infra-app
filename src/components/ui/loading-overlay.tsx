'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, type LoadingSpinnerProps } from '@/components/ui/loading-spinner';

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading: boolean;
  loadingText?: string;
  spinnerSize?: LoadingSpinnerProps['size'];
  spinnerVariant?: LoadingSpinnerProps['variant'];
  fullScreen?: boolean;
  overlayClassName?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({
    isLoading,
    loadingText = 'Loading...',
    spinnerSize = 'md',
    spinnerVariant = 'primary',
    fullScreen = false,
    overlayClassName,
    className,
    children,
    ...props
  }, ref) => {
    if (!isLoading) {
      return children ? <>{children}</> : null;
    }

    const overlayContent = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10',
          'bg-background/80 backdrop-blur-sm',
          overlayClassName
        )}
        {...props}
      >
        <LoadingSpinner size={spinnerSize} variant={spinnerVariant} />
        {loadingText && (
          <span className="text-sm font-medium text-muted-foreground">
            {loadingText}
          </span>
        )}
      </div>
    );

    if (!children) {
      return overlayContent;
    }

    return (
      <div className={cn('relative', className)}>
        {children}
        {overlayContent}
      </div>
    );
  }
);

LoadingOverlay.displayName = 'LoadingOverlay';

export { LoadingOverlay, type LoadingOverlayProps };