import { cn } from '@/lib/utils';

interface MicLevelMeterProps {
  level: number;
  mic?: MediaStreamTrack | null;
  bars?: number;
  className?: string;
}

export function MicLevelMeter({ level, mic, bars = 8, className }: MicLevelMeterProps) {
  const muted = mic ? mic.enabled === false : false;
  const clamped = muted ? 0 : Math.max(0, Math.min(1, level));
  const active = Math.round(clamped * bars);

  return (
    <span
      role="meter"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={Number(clamped.toFixed(2))}
      aria-label={muted ? '마이크 음소거' : '마이크 입력 레벨'}
      className={cn('inline-flex items-end gap-0.5 h-5', className)}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const on = i < active;
        const heightPct = 30 + (i + 1) * (70 / bars);
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              'w-1 rounded-sm transition-colors',
              on ? 'bg-jade' : 'bg-surface-2',
            )}
            style={{ height: `${heightPct}%` }}
          />
        );
      })}
    </span>
  );
}
