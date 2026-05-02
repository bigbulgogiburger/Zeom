'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SuccessIcon = 'check' | 'lotus';

interface SuccessStateProps {
  icon?: SuccessIcon;
  title: string;
  subtitle?: string;
  autoNavigateMs?: number;
  onComplete?: () => void;
  className?: string;
}

export function SuccessState({
  icon = 'check',
  title,
  subtitle,
  autoNavigateMs,
  onComplete,
  className,
}: SuccessStateProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!autoNavigateMs || !onComplete) return;
    const t = setTimeout(onComplete, autoNavigateMs);
    return () => clearTimeout(t);
  }, [autoNavigateMs, onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center gap-5 px-6 py-12 text-center',
        className,
      )}
    >
      {/* 80px 원 + 아이콘 */}
      <div
        className={cn(
          'flex h-20 w-20 items-center justify-center rounded-full bg-gold/15',
          !reduced && 'scale-in',
        )}
      >
        {icon === 'check' ? (
          <Check size={36} className="text-gold" strokeWidth={3} aria-hidden="true" />
        ) : (
          <span className="text-4xl" aria-hidden="true">🪷</span>
        )}
      </div>

      <h2 className="m-0 font-heading text-xl font-bold text-text-primary">
        {title}
      </h2>
      {subtitle && (
        <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
          {subtitle}
        </p>
      )}

      {/* dots */}
      <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 w-1.5 rounded-full bg-gold/60',
              !reduced && 'animate-pulse',
            )}
            style={!reduced ? { animationDelay: `${i * 160}ms` } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
