import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Gowun_Batang } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

const gowunBatang = Gowun_Batang({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gowun-batang',
  display: 'swap',
});
import SessionExpiryGuard from '../components/session-expiry-guard';
import { AuthProvider } from '../components/auth-context';
import { ErrorBoundary } from '../components/error-boundary';
import { GlobalErrorHandler } from '../components/global-error-handler';
import AppHeader from '../components/app-header';
import { Toaster } from '@/components/ui/sonner';
import { WebsiteJsonLd, ServiceJsonLd } from '../components/json-ld';
import { AnalyticsProvider } from '../components/analytics-provider';
import BottomTabBar from '../components/bottom-tab-bar';

export const metadata: Metadata = {
  title: {
    default: '천지연꽃신당 | 온라인 점사·상담 예약',
    template: '%s | 천지연꽃신당',
  },
  description: '전문 상담사와 1:1 화상상담. 사주, 타로, 신점, 꿈해몽 전문가를 만나보세요. 예약부터 화상 상담까지 한 곳에서.',
  keywords: ['점사', '사주', '타로', '신점', '온라인 상담', '천지연꽃신당', '운세', '궁합', '꿈해몽', '화상상담', '1:1 상담'],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '천지연꽃신당',
    title: '천지연꽃신당 | 온라인 점사·상담 예약',
    description: '전문 상담사와 1:1 화상상담. 사주, 타로, 신점, 꿈해몽 전문가를 만나보세요.',
    url: 'https://www.cheonjiyeon.com',
    images: [
      {
        url: 'https://www.cheonjiyeon.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '천지연꽃신당 — 온라인 점사·상담 예약 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '천지연꽃신당 | 온라인 점사·상담 예약',
    description: '전문 상담사와 1:1 화상상담. 사주, 타로, 신점, 꿈해몽 전문가를 만나보세요.',
    images: ['https://www.cheonjiyeon.com/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.cheonjiyeon.com',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0d0a',
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="font-pretendard">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="천지연꽃신당" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/style.min.css"
        />
      </head>
      <body className={`grain-overlay ${gowunBatang.variable}`}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-[hsl(var(--gold))] focus:text-[hsl(var(--background))] focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:text-sm">
          본문으로 건너뛰기
        </a>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        <WebsiteJsonLd />
        <ServiceJsonLd />
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ErrorBoundary>
            <GlobalErrorHandler />
            <AuthProvider>
              <SessionExpiryGuard />
              <AppHeader />
              <div id="main-content" className="pb-14 md:pb-0">{children}</div>
              <BottomTabBar />
              <AnalyticsProvider />
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
