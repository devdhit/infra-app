'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LoadingSpinner, type LoadingSpinnerProps } from '@/components/ui/loading-spinner';
import { useTranslation } from '@/hooks/use-translation';

interface LoadingLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: LoadingSpinnerProps['size'];
  variant?: LoadingSpinnerProps['variant'];
  loadingText?: string;
  descriptionText?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const LoadingLayout = React.forwardRef<HTMLDivElement, LoadingLayoutProps>(
  ({
    size = 'md',
    variant = 'primary',
    loadingText,
    descriptionText,
    height = 'md',
    className,
    ...props
  }, ref) => {
    const { t } = useTranslation();
    
    const heightClasses = {
      sm: 'h-32',
      md: 'h-52',
      lg: 'h-64',
      xl: 'h-80',
      full: 'h-full'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center bg-background rounded-xl border border-muted',
          heightClasses[height],
          className
        )}
        {...props}
      >
        <LoadingSpinner size={size} variant={variant} className="mb-4" />
        {(loadingText || loadingText === undefined) && (
          <div className="text-lg font-medium text-foreground">
            {loadingText || t('common.loading') || 'Loading...'}
          </div>
        )}
        {descriptionText && (
          <div className="text-sm text-muted-foreground mt-1">
            {descriptionText}
          </div>
        )}
      </div>
    );
  }
);

LoadingLayout.displayName = 'LoadingLayout';

export { LoadingLayout, type LoadingLayoutProps };