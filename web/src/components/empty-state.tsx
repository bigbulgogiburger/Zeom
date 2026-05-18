'use client';

import type { ReactNode } from 'react';
import { EmptyState } from '@/components/design';

interface EmptyStateCardProps {
  icon?: ReactNode;
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
      icon={icon}
      title={title}
      body={description}
      cta={actionLabel ? { label: actionLabel, href: actionHref, onClick: onAction } : undefined}
      variant={variant}
      className={className}
    />
  );
}

export { EmptyState };
