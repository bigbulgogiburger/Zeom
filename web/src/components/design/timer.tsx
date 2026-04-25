'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimerProps {
  start: Date | number;
  total: number;
  className?: string;
  onElapsed?: () => void;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function format(remainingSec: number) {
  const safe = Math.max(0, Math.floor(remainingSec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${pad(m)}:${pad(s)}`;
}

export function Timer({ start, total, className, onElapsed }: TimerProps) {
  const startMs = typeof start === 'number' ? start : start.getTime();
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, total - Math.floor((now - startMs) / 1000));

  useEffect(() => {
    if (remaining <= 0) {
      onElapsed?.();
      return;
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [remaining, onElapsed]);

  const warning = remaining > 0 && remaining <= 30;

  return (
    <span
      role="timer"
      aria-live="polite"
      aria-label={`남은 시간 ${format(remaining)}`}
      className={cn(
        'tabular text-base font-medium',
        warning ? 'text-destructive' : 'text-text-primary',
        className,
      )}
    >
      {format(remaining)}
    </span>
  );
}
