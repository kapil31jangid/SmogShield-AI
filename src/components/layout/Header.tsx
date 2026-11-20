'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X, Shield, Sun, Moon, Globe, Bell, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';

const navigation = [
  { name: 'nav.dashboard', href: '/dashboard', icon: Shield },
  { name: 'nav.profiles', href: '/dashboard/profiles', icon: User },
  { name: 'nav.assistant', href: '/dashboard/assistant', icon: Shield }, // Using Shield as placeholder
  { name: 'nav.planner', href: '/dashboard/planner', icon: Shield },
  { name: 'nav.impact', href: '/dashboard/impact', icon: Shield },
  { name: 'nav.challenges', href: '/dashboard/challenges', icon: Shield },
];

export function Header() {
  const pathname = usePathname();
  const t = useTranslations();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDark);
  };

  if (!mounted) {
    return <header className="h-16 border-b border-slate-200 dark:border-slate-700" />;
  }

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200 dark:bg-slate-900/80 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="SmogShield AI Home">
              <Shield className="h-8 w-8 text-brand-primary" aria-hidden="true" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">SmogShield AI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t(item.name)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="lg:hidden"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Language Toggle */}
            <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1">
              <Globe className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium">EN</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>

            {/* Profile Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 pr-2"
              >
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-brand-primary" />
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">User</span>
              </Button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-elevated dark:bg-slate-800 dark:border-slate-700 z-50 animate-in slide-up">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="font-medium text-slate-900 dark:text-white">User Name</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">user@example.com</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      {t('nav.settings')}
                    </Link>
                    <hr className="my-1 border-slate-200 dark:border-slate-700" />
                    <button
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-brand-accent hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LogOut className="h-4 w-4" />
                      {t('common.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="hidden lg:flex">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label="Open menu" className="md:hidden">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200 dark:border-slate-700 animate-in slide-up bg-white dark:bg-slate-900">
          <nav className="px-4 py-4 space-y-2" aria-label="Mobile navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium',
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{t(item.name)}</span>
                </Link>
              );
            })}
            <hr className="border-slate-200 dark:border-slate-700" />
            <div className="flex items-center gap-3 px-3 py-2">
              <Button variant="outline" className="flex-1" onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}