export default function HomeLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 200, background: '#1e293b', borderRadius: 8 }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ height: 16, width: '60%', background: '#1e293b', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {[80, 60, 90, 70, 80].map((w, i) => (
            <div key={i} style={{ height: 20, width: w, background: '#1e293b', borderRadius: 4 }} />
          ))}
        </div>
      </div>
    </main>
  );
}
