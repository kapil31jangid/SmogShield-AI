'use client';

import React, { type ReactNode } from 'react';
import { cn } from '@/lib/utils/helpers';

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className, orientation = 'horizontal' }: TabsProps) {
  const [activeValue, setActiveValue] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : activeValue;

  const handleValueChange = (val: string) => {
    if (!controlled) setActiveValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ currentValue, onValueChange: handleValueChange, orientation }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext<{
  currentValue: string;
  onValueChange: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
} | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('Tabs components must be used within Tabs');
  return context;
}

export function TabsList({ children, className }: TabsListProps) {
  const { orientation } = useTabsContext();
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        'inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800',
        orientation === 'vertical' && 'flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, disabled, className }: TabsTriggerProps) {
  const { currentValue, onValueChange, orientation } = useTabsContext();
  const isActive = currentValue === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabs-content-${value}`}
      id={`tabs-trigger-${value}`}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isActive
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
        orientation === 'vertical' && 'w-full justify-start',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { currentValue } = useTabsContext();
  const isActive = currentValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`tabs-content-${value}`}
      aria-labelledby={`tabs-trigger-${value}`}
      className={cn('mt-4 animate-in fade-in', className)}
    >
      {children}
    </div>
  );
}