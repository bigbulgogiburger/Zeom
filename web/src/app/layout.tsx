export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
