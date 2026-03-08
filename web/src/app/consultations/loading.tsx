export default function ConsultationsLoading() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', display: 'grid', gap: 16 }}>
      <div style={{ height: 32, width: 140, background: '#1e293b', borderRadius: 8 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ height: 18, width: 100, background: '#1e293b', borderRadius: 4 }} />
            <div style={{ height: 22, width: 60, background: '#1e293b', borderRadius: 999 }} />
          </div>
          <div style={{ height: 14, width: '60%', background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 14, width: '40%', background: '#1e293b', borderRadius: 4 }} />
        </div>
      ))}
    </main>
  );
}
