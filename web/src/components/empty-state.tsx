'use client';

import { EmptyState } from '@/components/design';

interface EmptyStateCardProps {
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
}: EmptyStateCardProps) {
  return (
    <EmptyState
      icon={icon ? <span aria-hidden="true">{icon}</span> : undefined}
      title={title}
      body={description}
      cta={actionLabel ? { label: actionLabel, href: actionHref, onClick: onAction } : undefined}
      variant={variant}
      className={className}
    />
  );
}

export { EmptyState };
