'use client';

import { useCallback, useEffect, useState } from 'react';
import { continueNextSession } from '@/components/api-client';

type ConsecutiveSessionModalProps = {
  sessionId: string;
  nextBookingId: number;
  nextSlotStartAt: string;
  nextSlotEndAt: string;
  onContinue: (result: { extendedDurationMinutes: number; newEndTime: string; sessionId: number }) => void;
  onEnd: () => void;
};

export default function ConsecutiveSessionModal({
  sessionId,
  nextBookingId,
  nextSlotStartAt,
  nextSlotEndAt,
  onContinue,
  onEnd,
}: ConsecutiveSessionModalProps) {
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-end after 30 seconds if no response
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onEnd]);

  const handleContinue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await continueNextSession(sessionId, nextBookingId);
      onContinue(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '연장에 실패했습니다.');
      setLoading(false);
    }
  }, [sessionId, nextBookingId, onContinue]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'hsl(var(--text-primary))',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '2px solid hsl(var(--gold))',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>
          🔔
        </div>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'hsl(var(--background))',
          marginBottom: '8px',
        }}>
          다음 예약이 있습니다
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'hsl(var(--text-secondary))',
          marginBottom: '20px',
        }}>
          {formatTime(nextSlotStartAt)} ~ {formatTime(nextSlotEndAt)} 예약 티켓이 있습니다.
          <br />이어서 상담하시겠습니까?
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <button
            onClick={handleContinue}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: 'hsl(var(--gold))',
              color: 'hsl(var(--background))',
              fontWeight: 700,
              fontSize: '15px',
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
              minWidth: '120px',
            }}
          >
            {loading ? '처리 중...' : '계속 상담'}
          </button>
          <button
            onClick={onEnd}
            disabled={loading}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-subtle))',
              background: 'transparent',
              color: 'hsl(var(--text-secondary))',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              minWidth: '120px',
            }}
          >
            상담 종료
          </button>
        </div>

        {error && (
          <p style={{ fontSize: '13px', color: 'hsl(var(--dancheong))', marginBottom: '8px' }}>
            {error}
          </p>
        )}

        <p style={{
          fontSize: '12px',
          color: 'hsl(var(--text-secondary))',
        }}>
          {countdown}초 후 자동으로 종료됩니다
        </p>
      </div>
    </div>
  );
}
