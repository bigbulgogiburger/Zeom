'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type ConnectionMonitorProps = {
  call: any; // SendBirdCall DirectCall
  onReconnect: () => void;
  onAudioOnlyFallback: () => void;
};

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'failed';

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_INTERVAL_MS = 30_000;

export default function ConnectionMonitor({ call, onReconnect, onAudioOnlyFallback }: ConnectionMonitorProps) {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [videoQualityPoor, setVideoQualityPoor] = useState(false);

  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const startReconnect = useCallback(() => {
    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('failed');
      clearTimers();
      return;
    }

    setStatus('reconnecting');
    const nextAttempt = reconnectAttempt + 1;
    setReconnectAttempt(nextAttempt);
    setCountdown(RECONNECT_INTERVAL_MS / 1000);

    // Countdown display
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Trigger reconnect after interval
    reconnectTimerRef.current = setTimeout(() => {
      onReconnect();
    }, RECONNECT_INTERVAL_MS);
  }, [reconnectAttempt, clearTimers, onReconnect]);

  // Monitor online/offline events
  useEffect(() => {
    function handleOffline() {
      setStatus('disconnected');
      startReconnect();
    }

    function handleOnline() {
      if (status === 'disconnected' || status === 'reconnecting') {
        setStatus('reconnecting');
        clearTimers();
        onReconnect();
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [status, startReconnect, clearTimers, onReconnect]);

  // Monitor RTCPeerConnection stats for video quality
  useEffect(() => {
    if (!call) return;

    statsIntervalRef.current = setInterval(async () => {
      try {
        // Access underlying peer connection stats if available
        const pc = call._pc || call.peerConnection;
        if (!pc || pc.connectionState === 'closed') return;

        const stats = await pc.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report: any) => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
        });

        const totalPackets = packetsLost + packetsReceived;
        if (totalPackets > 0) {
          const lossRate = packetsLost / totalPackets;
          setVideoQualityPoor(lossRate > 0.1); // >10% packet loss
        }
      } catch {
        // Stats not available, ignore
      }
    }, 5000);

    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [call]);

  // Reset on successful connection
  useEffect(() => {
    if (call && status === 'reconnecting') {
      setStatus('connected');
      setReconnectAttempt(0);
      clearTimers();
    }
  }, [call]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimers();
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
    };
  }, [clearTimers]);

  function handleManualRetry() {
    setReconnectAttempt(0);
    setStatus('reconnecting');
    clearTimers();
    onReconnect();
  }

  // Don't render when connected
  if (status === 'connected' && !videoQualityPoor) return null;

  return (
    <>
      {/* Audio-only fallback suggestion */}
      {videoQualityPoor && status === 'connected' && (
        <div className="bg-[var(--color-warning-light)] border border-[var(--color-warning)] rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-warning)]">
            <p className="font-bold">영상 품질이 불안정합니다</p>
            <p className="text-xs mt-0.5">음성 전용 모드로 전환하면 안정적인 통화가 가능합니다.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onAudioOnlyFallback}
            className="shrink-0 rounded-full border-[var(--color-warning)] text-[var(--color-warning)] hover:bg-[var(--color-warning)]/10 text-xs"
          >
            음성 전용
          </Button>
        </div>
      )}

      {/* Reconnection overlay */}
      {(status === 'disconnected' || status === 'reconnecting') && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-[#C9A227] border-t-transparent animate-spin" />
            <h2 className="text-xl font-bold font-heading text-[var(--color-text-on-dark)] mb-2">
              연결 중...
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              재연결 시도 {reconnectAttempt}/{MAX_RECONNECT_ATTEMPTS}
            </p>
            {countdown > 0 && (
              <p className="text-2xl font-bold text-[#C9A227] my-3">{countdown}초</p>
            )}
            <p className="text-xs text-muted-foreground">
              네트워크 연결을 확인해주세요
            </p>
          </div>
        </div>
      )}

      {/* Failed state */}
      {status === 'failed' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-2xl p-8 max-w-sm mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-danger-light)] flex items-center justify-center">
              <span className="text-3xl text-[#8B0000]">!</span>
            </div>
            <h2 className="text-xl font-bold font-heading text-[var(--color-text-on-dark)] mb-2">
              연결할 수 없습니다
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              네트워크 상태를 확인한 후 다시 시도해주세요.
            </p>
            <Button
              onClick={handleManualRetry}
              className="rounded-full px-8 py-3 bg-[#C9A227] text-[#0f0d0a] hover:bg-[#b08d1f] font-heading font-bold"
            >
              다시 시도
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
