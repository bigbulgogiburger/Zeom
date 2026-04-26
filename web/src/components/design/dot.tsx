import { cn } from '@/lib/utils';

type DotColor = 'gold' | 'success' | 'warning' | 'destructive' | 'jade' | 'muted';

interface DotProps {
  color?: DotColor;
  pulse?: boolean;
  size?: number;
  className?: string;
}

const colorClass: Record<DotColor, string> = {
  gold: 'bg-gold',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  jade: 'bg-jade',
  muted: 'bg-text-muted',
};

export function Dot({ color = 'gold', pulse = false, size = 8, className }: DotProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full',
        colorClass[color],
        pulse && 'animate-pulse',
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
