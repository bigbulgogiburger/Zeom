export default function CounselorsLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 160, background: '#1e293b', borderRadius: 8 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
          <div style={{ height: 20, width: 120, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: '70%', background: '#1e293b', borderRadius: 4 }} />
        </div>
      ))}
    </main>
  );
}
