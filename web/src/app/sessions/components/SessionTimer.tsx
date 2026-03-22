'use client';

import { useEffect, useState } from 'react';

type SessionTimerProps = {
  startedAt: string;
  durationMinutes: number;
  onTimeUp: () => void;
};

export default function SessionTimer({ startedAt, durationMinutes, onTimeUp }: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const start = new Date(startedAt).getTime();
    const end = start + durationMinutes * 60 * 1000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isWarning = remainingSeconds <= 300 && remainingSeconds > 0; // 5분 이하
  const isCritical = remainingSeconds <= 60 && remainingSeconds > 0;

  return (
    <div
      className={`
        sticky top-[64px] z-50 flex items-center justify-center gap-3 px-4 py-3
        border-b backdrop-blur-md transition-colors duration-300
        ${isCritical
          ? 'bg-[hsl(var(--dancheong)/0.9)] border-dancheong text-white'
          : isWarning
            ? 'bg-[hsl(var(--warning)/0.9)] border-warning text-white'
            : 'bg-[hsl(var(--background)/0.9)] border-[hsl(var(--gold)/0.15)] text-[hsl(var(--text-primary))]'
        }
      `}
    >
      <span className="text-sm font-medium">
        {remainingSeconds <= 0 ? '상담 시간 종료' : '남은 시간'}
      </span>
      <span className="font-heading font-bold text-lg tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      {isWarning && remainingSeconds > 0 && (
        <span className="text-xs font-medium ml-1">
          {isCritical ? '곧 종료됩니다!' : '5분 미만 남았습니다'}
        </span>
      )}
    </div>
  );
}
