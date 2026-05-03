import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  withWordmark?: boolean;
  className?: string;
}

const orbPx: Record<LogoSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
};

const wordmarkClass: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function Logo({ size = 'md', withWordmark = true, className }: LogoProps) {
  const px = orbPx[size];

  // withWordmark=true 일 때는 wordmark 텍스트가 SR로 노출되므로 aria 중복 회피.
  // withWordmark=false (orb only) 일 때만 컨테이너에 role/label 부여.
  const ariaProps = withWordmark
    ? {}
    : ({ role: 'img', 'aria-label': '천지연꽃신당' } as const);

  return (
    <span {...ariaProps} className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className="rounded-full shadow-[var(--shadow-gold)]"
        style={{
          width: px,
          height: px,
          background:
            'radial-gradient(circle at 30% 30%, hsl(var(--gold-soft)), hsl(var(--gold)) 60%, hsl(var(--gold-deep)))',
        }}
      />
      {withWordmark && (
        <span
          className={cn(
            'font-heading font-bold tracking-tight text-[hsl(var(--text-primary))]',
            wordmarkClass[size],
          )}
        >
          천지연꽃신당
        </span>
      )}
    </span>
  );
}
