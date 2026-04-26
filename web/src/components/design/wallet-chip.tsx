'use client';

import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { cn } from '@/lib/utils';

interface WalletChipProps {
  className?: string;
  hideWhenAnonymous?: boolean;
}

export function WalletChip({ className, hideWhenAnonymous = true }: WalletChipProps) {
  const { balance, loading } = useWallet();
  const router = useRouter();

  if (hideWhenAnonymous && balance === null && !loading) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push('/wallet')}
      className={cn(
        'wallet-chip text-sm font-medium text-text-primary',
        'hover:bg-surface-hover transition-colors',
        className,
      )}
      aria-label="내 지갑"
    >
      <Wallet size={14} className="text-gold" aria-hidden="true" />
      {loading ? (
        <span className="tabular text-text-muted">…</span>
      ) : (
        <span className="tabular">
          {(balance ?? 0).toLocaleString()}
          <span className="ml-0.5 text-text-secondary">원</span>
        </span>
      )}
    </button>
  );
}
