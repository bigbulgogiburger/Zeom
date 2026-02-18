'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type CallerInfo = {
  customerName: string;
  bookingTime?: string;
  specialty?: string;
  durationMinutes?: number;
};

type CallNotificationProps = {
  open: boolean;
  callerInfo: CallerInfo;
  onAccept: () => void;
  onDecline: () => void;
};

export default function CallNotification({
  open,
  callerInfo,
  onAccept,
  onDecline,
}: CallNotificationProps) {
  const bellIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      // Play bell sound effect via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        function playBell() {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.value = 800;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
          osc.start(audioCtx.currentTime);
          osc.stop(audioCtx.currentTime + 0.5);
        }
        playBell();
        bellIntervalRef.current = setInterval(playBell, 2000);
      } catch {
        // Audio not available
      }
    }

    return () => {
      if (bellIntervalRef.current) {
        clearInterval(bellIntervalRef.current);
        bellIntervalRef.current = null;
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-[var(--color-bg-card)] text-[var(--color-text-on-card)] border-[var(--color-border-card)] max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-lg text-center">
            상담 요청
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted-card)] text-sm text-center">
            고객님이 상담을 요청하고 있습니다
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-6">
          <div className="text-5xl mb-3 animate-pulse">📞</div>
          <div className="font-heading font-bold text-xl mb-2">
            {callerInfo.customerName} 고객님
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {callerInfo.bookingTime && (
              <Badge className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted-card)]">
                {callerInfo.bookingTime}
              </Badge>
            )}
            {callerInfo.specialty && (
              <Badge className="bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
                {callerInfo.specialty}
              </Badge>
            )}
            {callerInfo.durationMinutes && (
              <Badge className="bg-[var(--color-bg-secondary)] text-[var(--color-text-muted-card)]">
                {callerInfo.durationMinutes}분
              </Badge>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-3 justify-center sm:justify-center">
          <Button
            onClick={onDecline}
            variant="outline"
            className="border-2 border-[var(--color-danger)] text-[var(--color-danger)] bg-transparent font-heading font-bold hover:bg-[var(--color-danger)] hover:text-white min-w-[100px]"
          >
            거절
          </Button>
          <Button
            onClick={onAccept}
            className="bg-[var(--color-success)] text-white font-heading font-bold hover:bg-[var(--color-success)]/90 min-w-[100px] px-8"
          >
            수락
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
