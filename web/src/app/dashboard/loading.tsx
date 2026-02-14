export default function DashboardLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 180, background: '#1e293b', borderRadius: 8 }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 40, width: 180, background: '#1e293b', borderRadius: 4 }} />
          <div style={{ height: 40, width: 180, background: '#1e293b', borderRadius: 4 }} />
          <div style={{ height: 40, width: 60, background: '#1e293b', borderRadius: 8 }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
            <div style={{ height: 13, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 28, width: 50, background: '#1e293b', borderRadius: 4 }} />
          </div>
        ))}
      </div>
    </main>
  );
}
