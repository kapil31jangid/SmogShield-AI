'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/helpers';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400',
        'focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
        'dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm placeholder:text-slate-400',
        'focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
        'dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'resize-y min-h-[80px]',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm',
        'focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20',
        'dark:border-slate-600 dark:bg-slate-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-slate-700 mb-1.5 dark:text-slate-300', className)} {...props}>
      {children}
      {required && <span className="ml-1 text-brand-accent" aria-hidden="true">*</span>}
    </label>
  );
}

export function InputError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-brand-accent" role="alert">{message}</p>;
}

export function InputHelper({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{message}</p>;
}