import type { Metadata, Viewport } from 'next';
import { Noto_Serif_KR, Noto_Sans_KR } from 'next/font/google';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import SessionExpiryGuard from '../components/session-expiry-guard';
import { AuthProvider } from '../components/auth-context';
import { ErrorBoundary } from '../components/error-boundary';
import { GlobalErrorHandler } from '../components/global-error-handler';
import AppHeader from '../components/app-header';
import { ToastProvider } from '../components/toast';

const notoSerifKr = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
  preload: true,
  variable: '--font-heading',
});

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  variable: '--font-body',
});

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
    <html lang={locale} className={`${notoSerifKr.variable} ${notoSansKr.variable}`}>
      <body>
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
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ErrorBoundary>
            <GlobalErrorHandler />
            <AuthProvider>
              <ToastProvider>
                <SessionExpiryGuard />
                <AppHeader />
                {children}
              </ToastProvider>
            </AuthProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
