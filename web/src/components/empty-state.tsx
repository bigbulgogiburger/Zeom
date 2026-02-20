'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'empty' | 'error';
  className?: string;
}

export function EmptyStateCard({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  const isError = variant === 'error';

  return (
    <div
      className={cn(
        'bg-black/30 backdrop-blur-xl border rounded-2xl p-10 sm:p-12',
        isError
          ? 'border-[var(--color-danger)]/20'
          : 'border-[rgba(201,162,39,0.1)]',
        className
      )}
    >
      <div className="flex flex-col items-center text-center gap-4">
        {icon && <div className="text-5xl">{icon}</div>}
        <h3 className={cn(
          'm-0 font-heading font-bold text-xl',
          isError
            ? 'text-[var(--color-danger)]'
            : 'text-[var(--color-text-on-dark)]'
        )}>
          {title}
        </h3>
        {description && (
          <p className="text-[#a49484] text-sm leading-relaxed max-w-[400px]">
            {description}
          </p>
        )}
        {actionLabel && (actionHref || onAction) && (
          onAction ? (
            <button
              onClick={onAction}
              className={cn(
                'mt-4 inline-flex items-center justify-center rounded-full px-8 py-3 font-bold font-heading transition-all no-underline border-none cursor-pointer',
                isError
                  ? 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90'
                  : 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)]'
              )}
            >
              {actionLabel}
            </button>
          ) : actionHref ? (
            <Link
              href={actionHref}
              className="mt-4 inline-flex items-center justify-center rounded-full px-8 py-3 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading transition-all hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)] no-underline"
            >
              {actionLabel}
            </Link>
          ) : null
        )}
      </div>
    </div>
  );
}
