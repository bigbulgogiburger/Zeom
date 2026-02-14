'use client';

export function StatusBadge({ value }: { value: string }) {
  const v = (value || '').toUpperCase();
  let bg = '#334155';
  let color = '#e2e8f0';

  if (["PAID", "OPEN", "BOOKED", "AUTH_LOGIN", "AUTH_SIGNUP", "AUTH_ADMIN_LOGIN"].includes(v)) { bg = '#14532d'; color = '#dcfce7'; }
  else if (["PENDING"].includes(v)) { bg = '#78350f'; color = '#fef3c7'; }
  else if (["FAILED", "CANCELED", "PAYMENT_FAILED", "PAYMENT_CANCELED", "CLOSED", "AUTH_LOGIN_FAIL", "AUTH_REFRESH_REUSE_DETECTED"].includes(v)) { bg = '#7f1d1d'; color = '#fee2e2'; }

  return (
    <span style={{ background: bg, color, padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
      {v || 'UNKNOWN'}
    </span>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <div style={{ color: '#93c5fd', fontSize: 13, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      {hint && <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{hint}</div>}
    </Card>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ margin: 0, fontSize: 24, lineHeight: 1.3 }}>{children}</h2>;
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <Card>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {desc && <div style={{ color: '#94a3b8', marginTop: 4 }}>{desc}</div>}
    </Card>
  );
}

export function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return <div style={{ color: '#fca5a5', fontSize: 13 }}>{message}</div>;
}
