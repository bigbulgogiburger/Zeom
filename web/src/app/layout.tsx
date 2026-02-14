import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import SessionExpiryGuard from '../components/session-expiry-guard';
import { AuthProvider } from '../components/auth-context';
import { ErrorBoundary } from '../components/error-boundary';
import { GlobalErrorHandler } from '../components/global-error-handler';
import AppHeader from '../components/app-header';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: '천지연꽃신당 — 온라인 점사 상담',
    template: '%s | 천지연꽃신당',
  },
  description: '온라인 점사 상담을 위한 예약·결제·상담방 통합 플랫폼',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.className}>
      <body style={{ margin: 0, background: '#0f172a', color: '#f8fafc' }}>
        <ErrorBoundary>
          <GlobalErrorHandler />
          <AuthProvider>
            <SessionExpiryGuard />
            <AppHeader />
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
