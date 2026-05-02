'use client';

import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  count?: number;
  disabled?: boolean;
  className?: string;
}

export function FilterChip({
  label,
  selected,
  onToggle,
  count,
  disabled,
  className,
}: FilterChipProps) {
  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) onToggle();
    }
  }

  return (
    <button
      type="button"
      role="button"
      aria-pressed={selected}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onToggle()}
      onKeyDown={handleKey}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5',
        'font-heading text-xs font-bold transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-0',
        selected
          ? 'border-gold bg-gold/15 text-gold ring-1 ring-gold/40'
          : 'border-border-subtle bg-surface-2 text-text-secondary hover:border-gold/40 hover:text-text-primary',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span style={{ wordBreak: 'keep-all' }}>{label}</span>
      {typeof count === 'number' && (
        <span
          className={cn(
            'tabular-nums rounded-full px-1.5 py-0.5 text-[10px]',
            selected ? 'bg-gold/20 text-gold' : 'bg-surface-3 text-text-muted',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
