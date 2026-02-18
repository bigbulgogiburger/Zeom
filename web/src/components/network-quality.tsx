'use client';

import { useEffect, useState, useRef } from 'react';

type NetworkQualityProps = {
  call: any; // Sendbird Call object (has getStats or provides RTT info)
};

type QualityLevel = 'good' | 'fair' | 'poor' | 'unknown';

function getQualityInfo(level: QualityLevel): { label: string; color: string; bars: number } {
  switch (level) {
    case 'good':
      return { label: '양호', color: 'var(--color-success)', bars: 4 };
    case 'fair':
      return { label: '보통', color: 'var(--color-warning)', bars: 2 };
    case 'poor':
      return { label: '불량', color: 'var(--color-danger)', bars: 1 };
    default:
      return { label: '측정 중', color: 'var(--color-text-muted-dark)', bars: 0 };
  }
}

function classifyQuality(rttMs: number): QualityLevel {
  if (rttMs < 100) return 'good';
  if (rttMs < 300) return 'fair';
  return 'poor';
}

export default function NetworkQuality({ call }: NetworkQualityProps) {
  const [quality, setQuality] = useState<QualityLevel>('unknown');
  const [rtt, setRtt] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!call) {
      setQuality('unknown');
      setRtt(null);
      return;
    }

    async function measureQuality() {
      try {
        // Try WebRTC getStats via Sendbird Call's internal peer connection
        const peerConnection =
          call._directCall?.peerConnection ||
          call.peerConnection ||
          call._pc;

        if (peerConnection && typeof peerConnection.getStats === 'function') {
          const stats = await peerConnection.getStats();
          let candidatePairRtt: number | null = null;

          stats.forEach((report: any) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              if (report.currentRoundTripTime != null) {
                candidatePairRtt = report.currentRoundTripTime * 1000; // seconds to ms
              }
            }
          });

          if (candidatePairRtt !== null) {
            setRtt(Math.round(candidatePairRtt));
            setQuality(classifyQuality(candidatePairRtt));
            return;
          }
        }

        // Fallback: just set as unknown if no RTT data
        if (quality === 'unknown') {
          // After first measurement attempt, default to fair if connected
          setQuality('fair');
        }
      } catch {
        // Silently ignore - stats may not be available
      }
    }

    measureQuality();
    intervalRef.current = setInterval(measureQuality, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [call]);

  const info = getQualityInfo(quality);
  const maxBars = 4;

  return (
    <div
      className="flex items-center gap-1.5"
      title={rtt !== null ? `RTT: ${rtt}ms` : '네트워크 품질'}
      aria-label={`네트워크 품질: ${info.label}`}
    >
      {/* Signal bars */}
      <div className="flex items-end gap-[2px]">
        {Array.from({ length: maxBars }, (_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${6 + i * 4}px`,
              borderRadius: '1px',
              background: i < info.bars ? info.color : 'var(--color-border-dark)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: info.color }}
      >
        {info.label}
      </span>
      {rtt !== null && (
        <span
          className="text-[10px]"
          style={{ color: 'var(--color-text-muted-dark)' }}
        >
          {rtt}ms
        </span>
      )}
    </div>
  );
}
