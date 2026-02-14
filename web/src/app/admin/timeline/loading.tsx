export default function TimelineLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 14 }}>
      <div style={{ height: 32, width: 180, background: '#1e293b', borderRadius: 8 }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[100, 120, 120, 100, 180, 180, 60].map((w, i) => (
            <div key={i} style={{ height: 36, width: w, background: '#1e293b', borderRadius: 4 }} />
          ))}
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ height: 16, width: 200, background: '#1e293b', borderRadius: 4 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ height: 20, width: 60, background: '#1e293b', borderRadius: 999 }} />
              <div style={{ height: 20, width: 50, background: '#1e293b', borderRadius: 999 }} />
            </div>
          </div>
          <div style={{ height: 14, width: '50%', background: '#1e293b', borderRadius: 4, marginTop: 10 }} />
        </div>
      ))}
    </main>
  );
}
