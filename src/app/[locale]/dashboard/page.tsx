'use client';

import { useTranslations, useLocale } from 'next-intl';
import { DashboardClient } from './DashboardClient';

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations('dashboard');

  return <DashboardClient locale={locale} />;
}