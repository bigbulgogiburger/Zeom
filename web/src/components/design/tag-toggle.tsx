'use client';

import { cn } from '@/lib/utils';

interface TagToggleProps {
  tags: ReadonlyArray<string>;
  selected: ReadonlySet<string>;
  onToggle: (tag: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function TagToggle({ tags, selected, onToggle, className, ariaLabel }: TagToggleProps) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2', className)}>
      {tags.map((tag) => {
        const active = selected.has(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(tag)}
            className={cn(
              'inline-flex items-center rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border-subtle bg-surface-2 text-text-secondary hover:bg-surface-hover',
            )}
          >
            #{tag}
          </button>
        );
      })}
    </div>
  );
}
