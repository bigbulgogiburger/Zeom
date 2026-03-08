export default function NotificationsLoading() {
  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ height: 32, width: 60, background: '#1e293b', borderRadius: 8 }} />
        <div style={{ height: 28, width: 80, background: '#1e293b', borderRadius: 999 }} />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 16 }}>
          <div style={{ height: 12, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 16, width: '70%', background: '#1e293b', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 12, width: '50%', background: '#1e293b', borderRadius: 4 }} />
        </div>
      ))}
    </main>
  );
}
