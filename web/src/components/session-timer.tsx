'use client';

import { useEffect, useState } from 'react';

type SessionTimerProps = {
  startTime: string; // ISO timestamp when session started
  durationMinutes: number; // Total duration (e.g., 60)
  onTimeUp?: () => void; // Callback when timer reaches 0
};

export default function SessionTimer({ startTime, durationMinutes, onTimeUp }: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const start = new Date(startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000); // seconds elapsed
      const total = durationMinutes * 60; // total seconds
      const remaining = Math.max(0, total - elapsed);

      setRemainingSeconds(remaining);

      if (remaining === 0 && onTimeUp) {
        onTimeUp();
      }

      return remaining;
    };

    // Initial calculation
    calculateRemaining();

    // Update every second
    const interval = setInterval(() => {
      calculateRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onTimeUp]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isLowTime = remainingSeconds < 300; // Less than 5 minutes

  return (
    <div style={{
      background: isLowTime ? 'var(--color-danger)' : 'var(--color-bg-card)',
      border: `2px solid ${isLowTime ? 'var(--color-danger)' : 'var(--color-border-card)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      textAlign: 'center',
      transition: 'all var(--transition-base)',
    }}>
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: isLowTime ? 'var(--color-danger-light)' : 'var(--color-text-muted-card)',
        marginBottom: 'var(--spacing-xs)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-heading)',
      }}>
        남은 시간
      </div>
      <div style={{
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-black)',
        fontFamily: 'var(--font-heading)',
        color: isLowTime ? 'var(--color-danger-light)' : 'var(--color-gold)',
        letterSpacing: '0.05em',
      }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      {isLowTime && remainingSeconds > 0 && (
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-danger-light)',
          marginTop: 'var(--spacing-xs)',
          fontWeight: 'var(--font-weight-medium)',
        }}>
          ⚠️ 곧 종료됩니다
        </div>
      )}
      {remainingSeconds === 0 && (
        <div style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-danger-light)',
          marginTop: 'var(--spacing-xs)',
          fontWeight: 'var(--font-weight-bold)',
        }}>
          🔔 세션이 종료되었습니다
        </div>
      )}
    </div>
  );
}
