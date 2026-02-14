export default function BookingsLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 120, background: '#1e293b', borderRadius: 8 }} />
      {[1, 2].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ height: 16, width: 100, background: '#1e293b', borderRadius: 4 }} />
            <div style={{ height: 20, width: 60, background: '#1e293b', borderRadius: 999 }} />
          </div>
          <div style={{ height: 14, width: '50%', background: '#1e293b', borderRadius: 4, marginTop: 10 }} />
        </div>
      ))}
    </main>
  );
}
