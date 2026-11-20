import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { MainLayout } from '@/components/layout';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'SmogShield AI - Breathe Smarter. Protect Your Family.',
    template: '%s | SmogShield AI',
  },
  description: 'Your personalized air quality companion for healthier living in polluted cities. Real-time AQI, personalized recommendations, indoor protection guidance, and AI-powered assistance.',
  keywords: ['air quality', 'AQI', 'pollution', 'PM2.5', 'health', 'family', 'indoor air', 'air purifier'],
  authors: [{ name: 'SmogShield AI' }],
  creator: 'SmogShield AI',
  publisher: 'SmogShield AI',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smogshield.ai',
    siteName: 'SmogShield AI',
    title: 'SmogShield AI - Breathe Smarter. Protect Your Family.',
    description: 'Your personalized air quality companion for healthier living in polluted cities.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SmogShield AI Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmogShield AI',
    description: 'Your personalized air quality companion for healthier living in polluted cities.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a232c' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('NEXT_LOCALE')?.value || locale;

  return (
    <html lang={savedLocale} className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 antialiased">
        <NextIntlClientProvider messages={messages}>
          <MainLayout>{children}</MainLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}