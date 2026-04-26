'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FabBtnProps {
  on?: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  className?: string;
  variant?: 'primary' | 'destructive';
}

export function FabBtn({ on = false, onClick, label, icon, className, variant = 'primary' }: FabBtnProps) {
  const base =
    'inline-flex items-center justify-center rounded-full h-14 w-14 shadow-[var(--shadow)] transition-all active:scale-95';
  const palette =
    variant === 'destructive'
      ? on
        ? 'bg-destructive text-destructive-foreground'
        : 'bg-surface-2 text-destructive hover:bg-surface-hover'
      : on
        ? 'bg-gold text-background'
        : 'bg-surface-2 text-text-primary hover:bg-surface-hover';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={on}
      className={cn(base, palette, className)}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );
}
