'use client';

const color = {
  bg: '#0f172a',
  panel: '#0b1220',
  border: '#334155',
  text: '#e2e8f0',
  muted: '#94a3b8',
  primary: '#93c5fd',
  danger: '#fca5a5',
  success: '#86efac',
};

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
    <div style={{ border: `1px solid ${color.border}`, background: color.panel, borderRadius: 12, padding: 12 }}>
      {children}
    </div>
  );
}

export function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <div style={{ color: color.primary, fontSize: 13, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{value}</div>
      {hint && <div style={{ color: color.muted, fontSize: 12, marginTop: 4 }}>{hint}</div>}
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
  return <div role="alert" style={{ color: color.danger, fontSize: 13 }}>{message}</div>;
}

export function InlineSuccess({ message }: { message: string }) {
  if (!message) return null;
  return <div role="status" style={{ color: color.success, fontSize: 13 }}>{message}</div>;
}

export function ActionButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading ? true : undefined}
      style={{ minHeight: 40, padding: '0 12px', opacity: loading || props.disabled ? 0.7 : 1, ...(props.style || {}) }}
    >
      {loading ? '처리 중…' : children}
    </button>
  );
}
