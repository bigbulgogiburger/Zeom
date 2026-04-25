import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CtaProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  cta?: CtaProps;
  variant?: 'empty' | 'error';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  body,
  cta,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'glow-card flex flex-col items-center gap-4 px-6 py-12 text-center',
        isError && 'border-destructive/30',
        className,
      )}
    >
      {icon && <div className="text-4xl text-gold">{icon}</div>}
      <h3
        className={cn(
          'm-0 text-xl font-heading font-bold',
          isError ? 'text-destructive' : 'text-text-primary',
        )}
      >
        {title}
      </h3>
      {body && (
        <p className="max-w-md text-sm leading-relaxed text-text-secondary">{body}</p>
      )}
      {cta && <CtaButton {...cta} variant={variant} />}
    </div>
  );
}

function CtaButton({ label, href, onClick, variant }: CtaProps & { variant: 'empty' | 'error' }) {
  const className = cn(
    'mt-2 inline-flex items-center justify-center rounded-full px-7 py-2.5 font-heading font-bold transition-all',
    variant === 'error'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : 'bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[var(--shadow-gold)]',
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
}
