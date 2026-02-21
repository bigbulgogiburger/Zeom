'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCreditBalance } from './api-client';
import { useAuth } from './auth-context';

export default function CreditWidget() {
  const { me } = useAuth();
  const router = useRouter();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCredits() {
    if (!me) return;
    setLoading(true);
    try {
      const data = await getCreditBalance();
      setCredits(data.remainingCredits ?? 0);
    } catch {
      // Silent fail - widget is non-critical
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCredits();
  }, [me]);

  // Auto-refresh on page focus
  useEffect(() => {
    const handleFocus = () => loadCredits();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [me]);

  if (!me) return null;

  return (
    <button
      onClick={() => router.push('/credits')}
      style={{
        background: 'var(--color-accent-secondary)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-bold)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        minHeight: '36px',
        transition: 'background var(--transition-fast)',
        fontFamily: 'var(--font-heading)',
      }}
      aria-label="내 상담권"
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <span aria-hidden="true">🎫</span>
      {loading ? (
        <span>...</span>
      ) : credits !== null ? (
        <span>상담권 {credits}회</span>
      ) : (
        <span>상담권</span>
      )}
    </button>
  );
}
