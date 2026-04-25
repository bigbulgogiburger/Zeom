import { cn } from '@/lib/utils';

type BreathingAccent = 'gold' | 'jade' | 'lotus' | 'dancheong';

interface BreathingOrbProps {
  accent?: BreathingAccent;
  initial?: number;
  className?: string;
}

const accentClass: Record<BreathingAccent, string> = {
  gold: 'bg-gold/30 ring-gold/40',
  jade: 'bg-jade/30 ring-jade/40',
  lotus: 'bg-lotus/30 ring-lotus/40',
  dancheong: 'bg-dancheong/30 ring-dancheong/40',
};

export function BreathingOrb({ accent = 'gold', initial = 96, className }: BreathingOrbProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'breathe inline-block rounded-full ring-1',
        accentClass[accent],
        className,
      )}
      style={{ width: initial, height: initial }}
    />
  );
}
