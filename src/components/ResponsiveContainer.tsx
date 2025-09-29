import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = 'xl',
  padding = 'md'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'px-3 py-2',
    md: 'px-4 py-3 md:px-6 md:py-4',
    lg: 'px-6 py-4 md:px-8 md:py-6'
  };

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

// Mobile-specific wrapper for forms and inputs
export function MobileFormContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'w-full space-y-4',
      // Touch-friendly spacing on mobile
      'touch-none select-none',
      // Ensure inputs are properly sized on mobile
      '[&_input]:text-base [&_input]:py-3',
      '[&_button]:py-3 [&_button]:px-4',
      '[&_select]:py-3',
      className
    )}>
      {children}
    </div>
  );
}

// Grid container with responsive breakpoints
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, md: 2, lg: 3, xl: 4 }
}: { 
  children: React.ReactNode; 
  className?: string;
  cols?: { default: number; md?: number; lg?: number; xl?: number }
}) {
  const gridClasses = cn(
    'grid gap-4',
    `grid-cols-${cols.default}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}