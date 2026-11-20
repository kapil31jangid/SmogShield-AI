'use client';

import { type ReactNode } from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils/helpers';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-slate-50 dark:bg-slate-950', className)}>
      <Header />
      <main id="main-content" className="pt-0" tabIndex={-1}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>SmogShield AI - Breathe Smarter. Protect Your Family.</p>
          <p className="mt-1">Data from OpenAQ & WAQI. Not medical advice. Consult healthcare professionals for health concerns.</p>
        </div>
      </footer>
    </div>
  );
}