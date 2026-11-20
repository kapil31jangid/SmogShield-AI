'use client';

import { forwardRef, useId, type SelectHTMLAttributes, type ReactNode, isValidElement, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils/helpers';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  children: ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  onChange?: (value: string) => void;
}

function hasOptionChildren(children: ReactNode): boolean {
  if (!children) return false;
  if (Array.isArray(children)) {
    return children.some(child => isValidElement(child) && child.type === 'option');
  }
  return isValidElement(children) && children.type === 'option';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, onChange, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const useNative = hasOptionChildren(children);

    const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        // Call with the value string for convenience
        (onChange as (value: string) => void)(e.target.value);
      }
    };

    if (useNative) {
      return (
        <div className="w-full">
          {label && (
            <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
              {label}
            </label>
          )}
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white',
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            onChange={handleChange}
            {...props}
          >
            {children}
          </select>
          {error && (
            <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          {helperText && !error && (
            <p id={helperId} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {helperText}
            </p>
          )}
        </div>
      );
    }

    // Compound component API (SelectTrigger, SelectContent, SelectItem) - not implemented yet
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-900 dark:text-white">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          onChange={handleChange}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

// Placeholder exports for compound component API (not fully implemented)
export const SelectTrigger = () => null;
export const SelectValue = () => null;
export const SelectContent = () => null;
export const SelectItem = () => null;