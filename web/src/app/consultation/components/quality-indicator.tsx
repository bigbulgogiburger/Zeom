'use client';

import { useEffect, useState, useRef } from 'react';

type QualityIndicatorProps = {
  call: any; // SendBirdCall DirectCall
};

type QualityLevel = 'high' | 'medium' | 'low';

function getQualityInfo(level: QualityLevel): { label: string; color: string; bars: number } {
  switch (level) {
    case 'high':
      return { label: '상', color: '#2d6930', bars: 3 };
    case 'medium':
      return { label: '중', color: '#b8860b', bars: 2 };
    case 'low':
      return { label: '하', color: '#8B0000', bars: 1 };
  }
}

export default function QualityIndicator({ call }: QualityIndicatorProps) {
  const [quality, setQuality] = useState<QualityLevel>('high');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevStatsRef = useRef<{ packetsReceived: number; packetsLost: number; timestamp: number } | null>(null);

  useEffect(() => {
    if (!call) return;

    intervalRef.current = setInterval(async () => {
      try {
        const pc = call._pc || call.peerConnection;
        if (!pc || pc.connectionState === 'closed') return;

        const stats = await pc.getStats();
        let rtt = 0;
        let totalPacketsLost = 0;
        let totalPacketsReceived = 0;
        let hasRtt = false;

        stats.forEach((report: any) => {
          if (report.type === 'candidate-pair' && report.currentRoundTripTime !== undefined) {
            rtt = report.currentRoundTripTime * 1000; // convert to ms
            hasRtt = true;
          }
          if (report.type === 'inbound-rtp') {
            totalPacketsLost += report.packetsLost || 0;
            totalPacketsReceived += report.packetsReceived || 0;
          }
        });

        // Calculate recent packet loss rate
        let recentLossRate = 0;
        if (prevStatsRef.current) {
          const deltaLost = totalPacketsLost - prevStatsRef.current.packetsLost;
          const deltaReceived = totalPacketsReceived - prevStatsRef.current.packetsReceived;
          const deltaTotal = deltaLost + deltaReceived;
          if (deltaTotal > 0) {
            recentLossRate = deltaLost / deltaTotal;
          }
        }
        prevStatsRef.current = {
          packetsLost: totalPacketsLost,
          packetsReceived: totalPacketsReceived,
          timestamp: Date.now(),
        };

        // Determine quality based on RTT and packet loss
        if ((hasRtt && rtt > 300) || recentLossRate > 0.1) {
          setQuality('low');
        } else if ((hasRtt && rtt > 150) || recentLossRate > 0.03) {
          setQuality('medium');
        } else {
          setQuality('high');
        }
      } catch {
        // Stats not available — default to 'high' to avoid false alarms
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [call]);

  const info = getQualityInfo(quality);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm"
      title={`연결 품질: ${info.label}`}
    >
      {/* Signal bars */}
      <div className="flex items-end gap-0.5 h-3">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className="w-1 rounded-full transition-colors duration-300"
            style={{
              height: `${(bar / 3) * 100}%`,
              backgroundColor: bar <= info.bars ? info.color : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
      <span
        className="text-xs font-bold font-heading"
        style={{ color: info.color }}
      >
        {info.label}
      </span>
    </div>
  );
}
