import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/dashboard': '/dashboard',
    '/dashboard/profiles': '/dashboard/profiles',
    '/dashboard/assistant': '/dashboard/assistant',
    '/dashboard/planner': '/dashboard/planner',
    '/dashboard/impact': '/dashboard/impact',
    '/dashboard/challenges': '/dashboard/challenges',
    '/dashboard/settings': '/dashboard/settings',
  },
});