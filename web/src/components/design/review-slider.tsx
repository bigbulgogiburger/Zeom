'use client';

import { useRef, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlowCard } from './glow-card';
import { Stars } from './stars';
import { cn } from '@/lib/utils';

export interface ReviewSliderItem {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  counselorName?: string;
}

interface ReviewSliderProps {
  reviews: ReviewSliderItem[];
  className?: string;
  ariaLabel?: string;
}

/**
 * ReviewSlider — horizontal snap scroller (mobile + desktop).
 * Desktop: optional arrow buttons + ←/→ keyboard scroll.
 */
export function ReviewSlider({
  reviews,
  className,
  ariaLabel = '고객 후기',
}: ReviewSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollBy(1);
    }
  };

  if (reviews.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      {/* Desktop arrows */}
      <button
        type="button"
        aria-label="이전 후기"
        onClick={() => scrollBy(-1)}
        className="hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--gold)/0.08)] transition-colors"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="다음 후기"
        onClick={() => scrollBy(1)}
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 items-center justify-center rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--gold)/0.08)] transition-colors"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>

      <div
        ref={scrollerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKey}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] rounded-lg"
      >
        {reviews.map((r) => (
          <GlowCard
            key={r.id}
            padding="md"
            className="snap-start shrink-0 min-w-[280px] sm:min-w-[320px] min-h-[180px] flex flex-col"
          >
            <Stars value={r.rating} />
            <p
              className="mt-3 text-sm leading-relaxed text-[hsl(var(--text-primary))] line-clamp-3 flex-1"
              style={{ wordBreak: 'keep-all' }}
            >
              &ldquo;{r.comment}&rdquo;
            </p>
            <div className="mt-4 text-sm text-[hsl(var(--text-secondary))]">
              <span className="font-heading font-bold text-[hsl(var(--text-primary))]">
                {r.authorName}
              </span>
              {r.counselorName && <span> · {r.counselorName} 상담사</span>}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}
