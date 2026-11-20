'use client';

import { useTranslations } from 'next-intl';
import { Bell, Shield, User, Trash2, Download, Moon, Sun, Globe, Database, Key, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Switch } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const common = useTranslations('common');
  const locale = useLocale();
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    dailyBriefing: true,
    pollutionAlerts: true,
    challengeUpdates: false,
  });
  const [privacy, setPrivacy] = useState({
    analytics: true,
    dataCollection: true,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newIsDark);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrivacyChange = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportData = () => {
    // In production, would fetch all user data and download as JSON
    const data = {
      preferences: { locale, theme: isDark ? 'dark' : 'light' },
      notifications,
      privacy,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smogshield-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) {
    return <MainLayout><div className="h-64" /></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('subtitle')}</p>
      </div>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-amber-600" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Toggle dark/light theme</p>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={toggleTheme}
              aria-label="Toggle dark mode"
            />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Language</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">App language (requires reload)</p>
            </div>
            <Badge variant="info" className="gap-1">
              <Globe className="h-3 w-3" />
              {locale === 'en' ? 'English' : 'हिंदी'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-brand-primary" />
            {t('notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: 'email', label: t('emailAlerts'), desc: 'Receive email notifications' },
              { key: 'push', label: t('pushNotifications'), desc: 'Browser push notifications' },
              { key: 'dailyBriefing', label: t('dailyBriefing'), desc: 'Daily AQI summary at 7 AM' },
              { key: 'pollutionAlerts', label: t('pollutionAlerts'), desc: 'Alerts when AQI exceeds 150' },
              { key: 'challengeUpdates', label: t('challengeUpdates'), desc: 'Community challenge updates' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
                </div>
                <Switch
                  checked={notifications[key as keyof typeof notifications]}
                  onCheckedChange={() => handleNotificationChange(key as keyof typeof notifications)}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-secondary" />
            {t('privacy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: 'dataCollection', label: t('dataCollection'), desc: 'Allow collection of usage data to improve the app' },
              { key: 'analytics', label: t('analytics'), desc: 'Anonymous analytics for performance monitoring' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{label}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
                </div>
                <Switch
                  checked={privacy[key as keyof typeof privacy]}
                  onCheckedChange={() => handlePrivacyChange(key as keyof typeof privacy)}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-primary" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export My Data
            </Button>
            <Button variant="outline" className="gap-2">
              <Key className="h-4 w-4" />
              Manage API Keys
            </Button>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Your data is stored securely in Firebase. Export includes preferences, profiles, actions, and challenge history.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {t('dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">{t('deleteAccount')}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              {t('deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}