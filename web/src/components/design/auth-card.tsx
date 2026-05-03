import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';

interface AuthCardProps {
  children: ReactNode;
  withLogo?: boolean;
  className?: string;
  wrapperClassName?: string;
  cardClassName?: string;
}

export function AuthCard({
  children,
  withLogo = true,
  className,
  wrapperClassName,
  cardClassName,
}: AuthCardProps) {
  return (
    <main
      className={cn(
        'grid place-items-center min-h-[calc(100dvh-68px)] p-6 bg-[hsl(var(--background))]',
        className,
      )}
      style={{
        backgroundImage:
          'radial-gradient(ellipse at center, hsl(var(--gold) / 0.04) 0%, transparent 70%)',
      }}
    >
      <div className={cn('w-full max-w-[420px]', wrapperClassName)}>
        <div
          className={cn(
            'bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-2xl p-8 sm:p-10',
            cardClassName,
          )}
        >
          {withLogo && (
            <div className="mb-6 flex justify-center">
              <Logo size="md" />
            </div>
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
