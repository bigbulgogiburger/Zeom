'use client';

import { cn } from '@/lib/utils';

export interface SegItem<K extends string = string> {
  key: K;
  label: string;
  count?: number;
}

interface SegProps<K extends string = string> {
  items: ReadonlyArray<SegItem<K>>;
  value: K;
  onChange: (key: K) => void;
  className?: string;
  ariaLabel?: string;
}

export function Seg<K extends string = string>({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: SegProps<K>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('seg', className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              active
                ? 'bg-gold text-background shadow-[0_2px_8px_hsl(var(--gold)/0.25)]'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            <span>{item.label}</span>
            {typeof item.count === 'number' && (
              <span
                className={cn(
                  'tabular rounded-full px-1.5 py-0.5 text-xs',
                  active ? 'bg-background/20 text-background' : 'bg-surface-3 text-text-muted',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
