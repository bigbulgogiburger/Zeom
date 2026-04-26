'use client';

import { useCallback, useEffect, useState } from 'react';
import { getWallet } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';

interface UseWalletResult {
  balance: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useWallet(): UseWalletResult {
  const { me } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!me) {
      setBalance(null);
      return;
    }
    setLoading(true);
    try {
      const data = await getWallet();
      setBalance(data.balanceCash ?? data.balance ?? 0);
    } catch {
      // Silent fail — widget is non-critical
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return { balance, loading, refresh };
}
