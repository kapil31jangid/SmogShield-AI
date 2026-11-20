'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'hover' | 'glass';
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white rounded-2xl border border-slate-200 shadow-card dark:bg-slate-800 dark:border-slate-700',
      elevated: 'bg-white rounded-2xl border border-slate-200 shadow-elevated dark:bg-slate-800 dark:border-slate-700',
      hover: 'bg-white rounded-2xl border border-slate-200 shadow-card transition-shadow duration-200 hover:shadow-elevated dark:bg-slate-800 dark:border-slate-700',
      glass: 'bg-white/80 backdrop-blur-lg dark:bg-slate-900/80 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-soft',
    };

    return (
      <div ref={ref} className={cn(variantClasses[variant], className)} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-b border-slate-200 dark:border-slate-700', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold text-slate-900 dark:text-white', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('mt-1 text-sm text-slate-600 dark:text-slate-400', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';