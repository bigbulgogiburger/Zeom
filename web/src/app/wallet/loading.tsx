export default function WalletLoading() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', display: 'grid', gap: 24 }}>
      <div style={{ height: 32, width: 100, background: '#1e293b', borderRadius: 8 }} />
      {/* Balance card skeleton */}
      <div style={{ maxWidth: 520, margin: '0 auto', width: '100%', border: '1px solid #334155', background: '#0b1220', borderRadius: 16, padding: 40, textAlign: 'center' }}>
        <div style={{ height: 14, width: 80, background: '#1e293b', borderRadius: 4, margin: '0 auto 16px' }} />
        <div style={{ height: 40, width: 200, background: '#1e293b', borderRadius: 8, margin: '0 auto 24px' }} />
        <div style={{ height: 44, width: 120, background: '#1e293b', borderRadius: 999, margin: '0 auto' }} />
      </div>
      {/* Transaction list skeleton */}
      <div style={{ height: 24, width: 100, background: '#1e293b', borderRadius: 4 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ height: 16, width: 100, background: '#1e293b', borderRadius: 4 }} />
            <div style={{ height: 18, width: 80, background: '#1e293b', borderRadius: 4 }} />
          </div>
          <div style={{ height: 12, width: '40%', background: '#1e293b', borderRadius: 4, marginTop: 8 }} />
        </div>
      ))}
    </main>
  );
}
