'use client';

import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/helpers';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'aqi' | 'priority';
  children: ReactNode;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium';

  const variantClasses = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    aqi: 'rounded-xl px-3 py-1.5 font-semibold text-sm',
    priority: 'rounded-lg px-2.5 py-1 text-xs font-medium',
  };

  return <span className={cn(baseClasses, variantClasses[variant], className)} {...props}>{children}</span>;
}

export function AQIBadge({ aqi, label }: { aqi: number; label?: string }) {
  const category =
    aqi <= 50 ? 'good' :
    aqi <= 100 ? 'moderate' :
    aqi <= 150 ? 'sensitive' :
    aqi <= 200 ? 'unhealthy' :
    aqi <= 300 ? 'very-unhealthy' : 'hazardous';

  const variantClasses = {
    good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    sensitive: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    unhealthy: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'very-unhealthy': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    hazardous: 'bg-red-900/10 text-red-900 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <Badge variant="aqi" className={cn(variantClasses[category])}>
      AQI {aqi} {label && `• ${label}`}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' | 'low' }) {
  const variantClasses = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <Badge variant="priority" className={cn(variantClasses[priority])}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}