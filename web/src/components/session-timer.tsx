'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type TimerThreshold = '5min' | '3min' | '1min' | 'expired';

type SessionTimerProps = {
  startTime: string;
  durationMinutes: number;
  onTimeUp?: () => void;
  onThreshold?: (threshold: TimerThreshold) => void;
  gracePeriodMinutes?: number; // default 2
  onGracePeriodEnd?: () => void;
};

// Simple audio alert using Web Audio API
function playAlertSound(count: number = 1) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = count > 1 ? 880 : 660;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      const startTime = ctx.currentTime + i * 0.4;
      osc.start(startTime);
      osc.stop(startTime + 0.2);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    }
  } catch {
    // Audio not available
  }
}

export default function SessionTimer({
  startTime,
  durationMinutes,
  onTimeUp,
  onThreshold,
  gracePeriodMinutes = 2,
  onGracePeriodEnd,
}: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [phase, setPhase] = useState<'normal' | 'warning5' | 'warning3' | 'warning1' | 'expired' | 'grace'>('normal');
  const [graceRemaining, setGraceRemaining] = useState(gracePeriodMinutes * 60);
  const firedRef = useRef<Set<string>>(new Set());
  const timeUpFiredRef = useRef(false);
  const gracePeriodEndFiredRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onThresholdRef = useRef(onThreshold);
  const onGracePeriodEndRef = useRef(onGracePeriodEnd);

  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);
  useEffect(() => { onThresholdRef.current = onThreshold; }, [onThreshold]);
  useEffect(() => { onGracePeriodEndRef.current = onGracePeriodEnd; }, [onGracePeriodEnd]);

  const fireThreshold = useCallback((key: TimerThreshold, soundCount: number) => {
    if (firedRef.current.has(key)) return;
    firedRef.current.add(key);
    playAlertSound(soundCount);
    onThresholdRef.current?.(key);
  }, []);

  // Main countdown
  useEffect(() => {
    // Reset guards when timer is reset (e.g., consecutive session)
    timeUpFiredRef.current = false;
    gracePeriodEndFiredRef.current = false;
    firedRef.current.clear();

    const calculateRemaining = () => {
      // Normalize server timestamp: append 'Z' if no timezone offset present
      const normalized = startTime.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(startTime) ? startTime : startTime + 'Z';
      const start = new Date(normalized).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000);
      const total = durationMinutes * 60;
      const remaining = Math.max(0, total - elapsed);
      setRemainingSeconds(remaining);

      // Threshold alerts
      if (remaining <= 300 && remaining > 180) {
        setPhase('warning5');
        fireThreshold('5min', 1);
      } else if (remaining <= 180 && remaining > 60) {
        setPhase('warning3');
        fireThreshold('3min', 1);
      } else if (remaining <= 60 && remaining > 0) {
        setPhase('warning1');
        fireThreshold('1min', 2);
      } else if (remaining === 0) {
        fireThreshold('expired', 2);
      } else {
        setPhase('normal');
      }

      return remaining;
    };

    calculateRemaining();
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining === 0) {
        clearInterval(interval);
        setPhase('expired');
        if (!timeUpFiredRef.current) {
          timeUpFiredRef.current = true;
          onTimeUpRef.current?.();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes, fireThreshold]);

  // Grace period countdown (starts when main timer hits 0)
  useEffect(() => {
    if (phase !== 'expired' && phase !== 'grace') return;
    if (remainingSeconds > 0) return;

    setPhase('grace');
    setGraceRemaining(gracePeriodMinutes * 60);

    const interval = setInterval(() => {
      setGraceRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!gracePeriodEndFiredRef.current) {
            gracePeriodEndFiredRef.current = true;
            onGracePeriodEndRef.current?.();
          }
          return 0;
        }
        // 10-second final warning
        if (next === 10) {
          playAlertSound(3);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, remainingSeconds, gracePeriodMinutes]);

  const isGrace = phase === 'grace' && remainingSeconds === 0;
  const displaySeconds = isGrace ? graceRemaining : remainingSeconds;
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;

  const getBgColor = () => {
    if (isGrace) return '#8B0000';
    if (phase === 'warning1') return '#8B0000';
    if (phase === 'warning3') return '#B8860B';
    if (phase === 'warning5') return '#DAA520';
    if (phase === 'expired') return '#8B0000';
    return 'var(--color-bg-card)';
  };

  const getTextColor = () => {
    if (isGrace || phase === 'warning1' || phase === 'expired') return '#FFF';
    if (phase === 'warning3' || phase === 'warning5') return '#FFF';
    return 'var(--color-gold)';
  };

  const getLabel = () => {
    if (isGrace) return '마무리 시간';
    if (phase === 'expired') return '시간 종료';
    return '남은 시간';
  };

  const getMessage = () => {
    if (isGrace && graceRemaining <= 10) return `${graceRemaining}초 후 자동 종료됩니다`;
    if (isGrace) return '상담을 마무리해주세요';
    if (phase === 'warning1') return '상담 종료 1분 전입니다';
    if (phase === 'warning3') return '상담 종료 3분 전입니다';
    if (phase === 'warning5') return '곧 종료됩니다';
    if (phase === 'expired') return '예약 시간이 종료되었습니다';
    return null;
  };

  return (
    <div style={{
      background: getBgColor(),
      border: `2px solid ${getBgColor()}`,
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    }}>
      <div style={{
        fontSize: 'var(--font-size-sm)',
        color: getTextColor(),
        marginBottom: 'var(--spacing-xs)',
        fontWeight: 'var(--font-weight-medium)',
        fontFamily: 'var(--font-heading)',
        opacity: 0.8,
      }}>
        {getLabel()}
      </div>
      <div style={{
        fontSize: 'var(--font-size-3xl)',
        fontWeight: 'var(--font-weight-black)',
        fontFamily: 'var(--font-heading)',
        color: getTextColor(),
        letterSpacing: '0.05em',
      }}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      {getMessage() && (
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: getTextColor(),
          marginTop: 'var(--spacing-xs)',
          fontWeight: 'var(--font-weight-medium)',
          opacity: 0.9,
          animation: (phase === 'warning1' || isGrace) ? 'pulse 1s infinite' : undefined,
        }}>
          {getMessage()}
        </div>
      )}
    </div>
  );
}

// Re-export for use in counselor page
export { playAlertSound };
export type { TimerThreshold, SessionTimerProps };
