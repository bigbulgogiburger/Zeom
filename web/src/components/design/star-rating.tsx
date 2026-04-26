'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  hover?: number;
  onChange: (value: number) => void;
  onHover?: (value: number) => void;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export function StarRating({
  value,
  hover,
  onChange,
  onHover,
  size = 28,
  className,
  ariaLabel = '별점',
}: StarRatingProps) {
  const [internalHover, setInternalHover] = useState<number | null>(null);
  const display = hover ?? internalHover ?? value;

  return (
    <span
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-1', className)}
      onMouseLeave={() => {
        setInternalHover(null);
        onHover?.(0);
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}점`}
            onMouseEnter={() => {
              setInternalHover(n);
              onHover?.(n);
            }}
            onClick={() => onChange(n)}
            className={cn(
              'rounded transition-transform hover:scale-110',
              filled ? 'text-gold' : 'text-gold/25',
            )}
          >
            <Star size={size} fill="currentColor" strokeWidth={0} />
          </button>
        );
      })}
    </span>
  );
}
