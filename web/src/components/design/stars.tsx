import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarsProps {
  value: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function Stars({ value, size = 16, showValue = true, className }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      role="img"
      aria-label={`별점 ${clamped.toFixed(1)} / 5`}
    >
      <span className="inline-flex items-center gap-0.5 text-gold">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} size={size} fill="currentColor" strokeWidth={0} />
        ))}
        {hasHalf && <StarHalf size={size} fill="currentColor" strokeWidth={0} />}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} size={size} className="text-gold/25" strokeWidth={0} fill="currentColor" />
        ))}
      </span>
      {showValue && (
        <span className="tabular text-sm text-text-secondary">{clamped.toFixed(1)}</span>
      )}
    </span>
  );
}
