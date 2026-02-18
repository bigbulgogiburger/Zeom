'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWallet } from './api-client';
import { useAuth } from './auth-context';

export default function WalletWidget() {
  const { me } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadBalance() {
    if (!me) return;
    setLoading(true);
    try {
      const data = await getWallet();
      setBalance(data.balanceCash ?? data.balance ?? 0);
    } catch {
      // Silent fail - widget is non-critical
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalance();
  }, [me]);

  // Auto-refresh on page focus
  useEffect(() => {
    const handleFocus = () => loadBalance();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [me]);

  if (!me) return null;

  return (
    <button
      onClick={() => router.push('/wallet')}
      style={{
        background: 'var(--color-gold)',
        color: 'var(--color-bg-primary)',
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
      aria-label="내 지갑"
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-gold-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-gold)'}
    >
      <span>💰</span>
      {loading ? (
        <span>...</span>
      ) : balance !== null ? (
        <span>{balance.toLocaleString()}원</span>
      ) : (
        <span>지갑</span>
      )}
    </button>
  );
}
