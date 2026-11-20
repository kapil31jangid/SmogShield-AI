'use client';

import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/helpers';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, onCheckedChange, checked, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className="flex items-center gap-3 cursor-pointer" htmlFor={inputId}>
        <input
          ref={ref}
          type="checkbox"
          id={inputId}
          role="switch"
          checked={checked}
          onChange={handleChange}
          className={cn(
            'h-4 w-4 appearance-none rounded border-slate-300 text-brand-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600',
            className
          )}
          {...props}
        />
        {label && <span className="text-sm font-medium text-slate-900 dark:text-white">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';