import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type GlowCardPadding = 'sm' | 'md' | 'lg' | 'none';

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: GlowCardPadding;
}

const paddingClass: Record<GlowCardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-7',
};

export function GlowCard({ children, padding = 'md', className, ...rest }: GlowCardProps) {
  return (
    <div className={cn('glow-card', paddingClass[padding], className)} {...rest}>
      {children}
    </div>
  );
}
