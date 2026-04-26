'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RadioCardProps {
  name: string;
  value: string;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: string) => void;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function RadioCard({
  name,
  value,
  label,
  description,
  selected,
  onSelect,
  icon,
  disabled,
  className,
}: RadioCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      data-name={name}
      disabled={disabled}
      onClick={() => onSelect(value)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!disabled) onSelect(value);
        }
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        selected
          ? 'border-gold bg-gold/[0.06] shadow-[0_0_0_1px_hsl(var(--gold)/0.4)_inset]'
          : 'border-border-subtle bg-surface-2 hover:border-gold/40',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {/* 라디오 인디케이터 */}
      <span
        aria-hidden="true"
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          selected ? 'border-gold' : 'border-text-muted',
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-gold" />}
      </span>

      {icon && <span className="shrink-0 text-text-secondary">{icon}</span>}

      <span className="flex flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'font-heading text-sm font-bold',
            selected ? 'text-gold' : 'text-text-primary',
          )}
        >
          {label}
        </span>
        {description && (
          <span className="text-xs text-text-secondary">{description}</span>
        )}
      </span>
    </button>
  );
}
