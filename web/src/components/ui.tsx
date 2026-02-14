'use client';

export function StatusBadge({ value }: { value: string }) {
  const v = (value || '').toUpperCase();
  let bg = '#334155';
  let color = '#e2e8f0';

  if (["PAID", "OPEN", "BOOKED"].includes(v)) { bg = '#14532d'; color = '#dcfce7'; }
  else if (["PENDING"].includes(v)) { bg = '#78350f'; color = '#fef3c7'; }
  else if (["FAILED", "CANCELED", "PAYMENT_FAILED", "PAYMENT_CANCELED", "CLOSED"].includes(v)) { bg = '#7f1d1d'; color = '#fee2e2'; }

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
