import SessionExpiryGuard from '../components/session-expiry-guard';
import { AuthProvider } from '../components/auth-context';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        <AuthProvider>
          <SessionExpiryGuard />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
