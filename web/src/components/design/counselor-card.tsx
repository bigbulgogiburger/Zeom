'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';
import { Portrait } from './portrait';
import { Stars } from './stars';
import { GlowCard } from './glow-card';
import { cn } from '@/lib/utils';

export interface CounselorCardData {
  id: number | string;
  name: string;
  specialty?: string;
  level?: string | null;
  imageUrl?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  pricePerSession?: number;
  pricePerMinute?: number;
  sessionMinutes?: number;
  isOnline?: boolean;
}

export type CounselorCardVariant = 'list' | 'compact';

interface CounselorCardProps {
  counselor: CounselorCardData;
  variant?: CounselorCardVariant;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  className?: string;
  href?: string;
  trailing?: ReactNode;
}

function priceLabel(c: CounselorCardData): { value: string; suffix: string } {
  if (typeof c.pricePerSession === 'number') {
    const minutes = c.sessionMinutes ?? 30;
    return {
      value: c.pricePerSession.toLocaleString(),
      suffix: `원 / ${minutes}분`,
    };
  }
  const per = c.pricePerMinute ?? 3000;
  return { value: per.toLocaleString(), suffix: '원 / 분' };
}

export function CounselorCard({
  counselor,
  variant = 'list',
  onClick,
  className,
  href,
  trailing,
}: CounselorCardProps) {
  const target = href ?? `/counselors/${counselor.id}`;
  const price = priceLabel(counselor);
  const rating = counselor.rating ?? 0;
  const reviewCount = counselor.reviewCount ?? 0;

  if (variant === 'compact') {
    return (
      <Link
        href={target}
        onClick={onClick}
        className={cn(
          'group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-2xl',
          className,
        )}
        aria-label={`${counselor.name} 상담사`}
      >
        <GlowCard padding="sm" className="flex flex-col items-center gap-2 text-center">
          <Portrait counselor={counselor} size="md" />
          <span
            className="font-heading text-sm font-bold text-text-primary"
            style={{ wordBreak: 'keep-all' }}
          >
            {counselor.name}
          </span>
          <span className="tabular-nums text-xs text-text-secondary">
            {price.value}
            <span className="ml-0.5 text-text-muted">{price.suffix}</span>
          </span>
        </GlowCard>
      </Link>
    );
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col gap-4',
        'rounded-2xl glow-card p-5 transition-transform',
        'hover:-translate-y-0.5 motion-reduce:transform-none',
        className,
      )}
      onClick={onClick}
    >
      <header className="flex items-start gap-4">
        <Portrait counselor={counselor} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="font-heading text-base font-bold text-text-primary truncate"
              style={{ wordBreak: 'keep-all' }}
            >
              {counselor.name}
            </h3>
            {counselor.level && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold',
                  'bg-gold/15 text-gold border border-gold/30',
                )}
              >
                {counselor.level}
              </span>
            )}
            {counselor.isOnline && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium text-success"
                aria-label="지금 상담 가능"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                상담 가능
              </span>
            )}
          </div>
          {counselor.specialty && (
            <p
              className="mt-1 text-xs text-text-secondary truncate"
              style={{ wordBreak: 'keep-all' }}
            >
              {counselor.specialty}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Stars value={rating} size={14} showValue={false} />
            <span className="tabular-nums text-xs font-bold text-text-primary">
              {rating.toFixed(1)}
            </span>
            <span className="tabular-nums text-xs text-text-secondary">
              ({reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
      </header>

      <footer className="mt-auto flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] text-text-secondary">상담료</span>
          <span className="tabular-nums font-heading text-sm font-bold text-text-primary">
            {price.value}
            <span className="ml-0.5 text-xs font-normal text-text-secondary">{price.suffix}</span>
          </span>
        </div>
        {trailing ?? (
          <Link
            href={target}
            onClick={onClick}
            className={cn(
              'inline-flex items-center justify-center rounded-full px-5 py-2',
              'bg-gradient-to-r from-gold to-gold-soft text-background',
              'font-heading text-sm font-bold',
              'transition-shadow hover:shadow-[var(--shadow-gold)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
            )}
          >
            예약하기
          </Link>
        )}
      </footer>
    </article>
  );
}
