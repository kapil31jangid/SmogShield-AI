'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/helpers';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variantClasses = {
      primary: 'bg-brand-primary text-white hover:bg-brand-primaryHover focus-visible:ring-brand-primary',
      secondary: 'bg-brand-secondary text-white hover:bg-emerald-700 focus-visible:ring-brand-secondary',
      outline: 'border-2 border-slate-300 bg-transparent hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-600 dark:hover:bg-slate-800',
      ghost: 'bg-transparent hover:bg-slate-100 focus-visible:ring-slate-400 dark:hover:bg-slate-800',
      destructive: 'bg-brand-accent text-white hover:bg-red-700 focus-visible:ring-brand-accent',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0 1 10 10A10 10 0 0 1 12 2" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';