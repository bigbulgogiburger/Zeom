'use client';

import { useEffect, useState } from 'react';

type CreditIndicatorProps = {
  totalCredits: number;      // Total credits reserved for this session
  durationMinutes: number;   // Duration per credit (typically 30 min)
  startTime: string;         // ISO timestamp when session started
};

export default function CreditIndicator({
  totalCredits,
  durationMinutes,
  startTime,
}: CreditIndicatorProps) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    function updateElapsed() {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      setElapsedSec(Math.max(0, Math.floor((now - start) / 1000)));
    }

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const creditDurationSec = durationMinutes * 60;
  const currentCreditIndex = Math.floor(elapsedSec / creditDurationSec);
  const creditsConsumed = Math.min(currentCreditIndex + 1, totalCredits);

  // Time until next credit boundary
  const nextBoundarySec = (currentCreditIndex + 1) * creditDurationSec;
  const timeUntilNextBoundary = nextBoundarySec - elapsedSec;
  const showWarning = timeUntilNextBoundary <= 300 && timeUntilNextBoundary > 0 && creditsConsumed < totalCredits;

  // Progress within current credit
  const currentCreditElapsed = elapsedSec - (currentCreditIndex * creditDurationSec);
  const progressPct = Math.min(100, (currentCreditElapsed / creditDurationSec) * 100);

  return (
    <div
      className="flex flex-col gap-1"
      style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        border: showWarning ? '2px solid var(--color-warning)' : '1px solid var(--color-border-card)',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted-card)', fontFamily: 'var(--font-heading)' }}
        >
          상담권
        </span>
        <span
          className="text-sm font-bold"
          style={{
            color: creditsConsumed >= totalCredits ? 'var(--color-danger)' : 'var(--color-gold)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {creditsConsumed}/{totalCredits}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          background: 'var(--color-border-card)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: showWarning ? 'var(--color-warning)' : 'var(--color-gold)',
            borderRadius: '2px',
            transition: 'width 1s linear',
          }}
        />
      </div>

      {showWarning && (
        <div
          className="text-[10px] font-medium"
          style={{ color: 'var(--color-warning)' }}
        >
          {Math.ceil(timeUntilNextBoundary / 60)}분 후 다음 상담권 차감
        </div>
      )}
    </div>
  );
}
