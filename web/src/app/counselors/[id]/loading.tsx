export default function CounselorDetailLoading() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 140, background: '#1e293b', borderRadius: 8 }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ height: 14, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 14, width: '60%', background: '#1e293b', borderRadius: 4 }} />
      </div>
      <div style={{ height: 24, width: 140, background: '#1e293b', borderRadius: 8 }} />
      {[1, 2].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
          <div style={{ height: 16, width: '50%', background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 40, width: 120, background: '#1e293b', borderRadius: 8 }} />
        </div>
      ))}
    </main>
  );
}
