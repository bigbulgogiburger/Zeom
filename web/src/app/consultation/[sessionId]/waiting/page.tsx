'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Phone } from 'lucide-react';
import { apiFetch, getSessionStatus } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { BreathingOrb, Portrait, FabBtn } from '@/components/design';

type BookingInfo = {
  id: number;
  counselorId: number;
  counselorName: string;
  startAt: string;
  endAt: string;
  status: string;
  creditsUsed: number;
  slots: { slotId: number; startAt: string; endAt: string }[];
};

type CanEnterResponse = {
  canEnter: boolean;
  secondsUntilStart: number;
  message: string;
};

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}시간 ${String(remainMins).padStart(2, '0')}분 ${String(secs).padStart(2, '0')}초`;
  }
  return `${String(mins).padStart(2, '0')}분 ${String(secs).padStart(2, '0')}초`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ETIQUETTE_TIPS = [
  '조용한 환경에서 상담에 참여해주세요.',
  '카메라와 마이크가 정상 작동하는지 확인해주세요.',
  '상담 시작 전 질문 사항을 미리 정리해두면 좋습니다.',
  '개인정보 보호를 위해 배경에 민감한 정보가 보이지 않도록 해주세요.',
  '상담 중에는 다른 앱 알림을 끄시는 것을 권장합니다.',
];

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [canEnter, setCanEnter] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [counselorReady, setCounselorReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  const loadBooking = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/v1/bookings/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) {
        setError('예약 정보를 불러올 수 없습니다.');
        return;
      }
      const data: BookingInfo = await res.json();
      setBooking(data);
    } catch {
      setError('예약 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }, [sessionId]);

  const checkCanEnter = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/v1/sessions/${sessionId}/can-enter`, { cache: 'no-store' });
      if (!res.ok) return;
      const data: CanEnterResponse = await res.json();
      setCanEnter(data.canEnter);
      setSecondsLeft(Math.max(0, data.secondsUntilStart));
    } catch {
      // Silently fail, will retry
    }
  }, [sessionId]);

  // Initialize camera/mic preview
  useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        previewStreamRef.current = stream;
        setPreviewStream(stream);
        setCameraReady(true);
        setMicReady(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        // Try individually
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraReady(true);
          previewStreamRef.current = camStream;
          setPreviewStream(camStream);
          if (videoRef.current) {
            videoRef.current.srcObject = camStream;
          }
        } catch { /* camera denied */ }
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setMicReady(true);
        } catch { /* mic denied */ }
      }
    }
    initMedia();

    return () => {
      const stream = previewStreamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        previewStreamRef.current = null;
      }
    };
  }, []);

  // Attach stream to video element when ref or stream changes
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Load booking and start polling can-enter
  useEffect(() => {
    loadBooking().then(() => setLoading(false));
    checkCanEnter();

    pollRef.current = setInterval(checkCanEnter, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [sessionId, loadBooking, checkCanEnter]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null) return;

    countdownRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 0) return 0;
        const next = prev - 1;
        if (next <= 300 && !canEnter) {
          setCanEnter(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [secondsLeft === null]);

  // Poll counselor readiness via session status API
  useEffect(() => {
    if (!canEnter || counselorReady) return;

    const checkCounselorReady = async () => {
      try {
        const status = await getSessionStatus(sessionId);
        if (status.counselorReady) {
          setCounselorReady(true);
        }
      } catch {
        // Silently fail, will retry
      }
    };

    checkCounselorReady();
    const interval = setInterval(checkCounselorReady, 5000);
    return () => clearInterval(interval);
  }, [canEnter, counselorReady, sessionId]);

  function handleEnter() {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    router.push(`/consultation/${sessionId}/preflight`);
  }

  const scheduledTime = booking?.slots?.[0]?.startAt || booking?.startAt;

  if (loading) {
    return (
      <RequireLogin>
        <main className="min-h-dvh flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--text-muted))]">
          불러오는 중...
        </main>
      </RequireLogin>
    );
  }

  const counselor = { name: booking?.counselorName || '상담사' };

  return (
    <RequireLogin>
      <main className="relative min-h-dvh overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--text-primary))]">
        {/* Decorative radial gold layer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 motion-reduce:hidden"
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, hsl(var(--gold) / 0.12), transparent 60%), radial-gradient(ellipse at 50% 90%, hsl(var(--lotus) / 0.08), transparent 70%)',
          }}
        />

        <div className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[hsl(var(--text-primary))] [text-wrap:balance]">
              상담 대기실
            </h1>
            <p className="mt-2 text-sm text-[hsl(var(--text-muted))] [word-break:keep-all]">
              상담 시작까지 마음을 가다듬어 주세요
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 w-full max-w-md rounded-2xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Breathing Orb + Portrait composition */}
          <div className="relative mb-8 flex items-center justify-center">
            <BreathingOrb accent="gold" initial={240} className="motion-reduce:animate-none motion-reduce:opacity-60" />
            <span className="absolute inset-0 flex items-center justify-center">
              <Portrait counselor={counselor} size="lg" />
            </span>
          </div>

          {/* Counselor name */}
          <p className="mb-2 font-heading text-xl font-bold text-[hsl(var(--text-primary))]">
            {counselor.name}
          </p>
          {scheduledTime && (
            <p className="text-sm text-[hsl(var(--text-muted))]">{formatDateTime(scheduledTime)}</p>
          )}

          {/* Countdown */}
          <div className="mt-8 mb-8" role="timer" aria-live="polite">
            {secondsLeft !== null && secondsLeft > 0 ? (
              <>
                <p className="mb-1 text-xs uppercase tracking-widest text-[hsl(var(--text-muted))]">
                  상담 시작까지
                </p>
                <p className="font-heading text-5xl font-bold tabular-nums text-[hsl(var(--gold))]">
                  {formatCountdown(secondsLeft)}
                </p>
              </>
            ) : (
              <p className="font-heading text-2xl font-bold text-[hsl(var(--success))]">
                상담 시간이 되었습니다
              </p>
            )}
          </div>

          {/* Status chips */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className={`rounded-full font-heading ${
                cameraReady
                  ? 'border-[hsl(var(--success)/0.4)] text-[hsl(var(--success))]'
                  : 'border-[hsl(var(--dancheong)/0.4)] text-[hsl(var(--dancheong))]'
              }`}
            >
              카메라 {cameraReady ? '정상' : '확인 필요'}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full font-heading ${
                micReady
                  ? 'border-[hsl(var(--success)/0.4)] text-[hsl(var(--success))]'
                  : 'border-[hsl(var(--dancheong)/0.4)] text-[hsl(var(--dancheong))]'
              }`}
            >
              마이크 {micReady ? '정상' : '확인 필요'}
            </Badge>
            {counselorReady && (
              <Badge
                variant="outline"
                className="rounded-full border-[hsl(var(--gold)/0.4)] font-heading text-[hsl(var(--gold))]"
              >
                상담사 준비됨
              </Badge>
            )}
          </div>

          {/* Hidden video element to keep preview stream attached for permission state */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            className="sr-only"
          />

          {/* Enter FAB + secondary */}
          <div className="flex flex-col items-center gap-4">
            <FabBtn
              icon={<Phone size={22} strokeWidth={2} />}
              label={canEnter ? '먼저 입장하기' : '시작 5분 전부터 입장 가능합니다'}
              onClick={canEnter ? handleEnter : () => {}}
              variant="primary"
              on={canEnter}
              className={`h-16 w-16 ${canEnter ? '' : 'cursor-not-allowed opacity-40'}`}
            />
            <p className="font-heading text-sm font-bold text-[hsl(var(--text-secondary))]">
              {canEnter ? '먼저 입장하기' : '시작 5분 전부터 입장 가능합니다'}
            </p>
            <Button
              variant="ghost"
              onClick={() => router.push('/bookings/me')}
              className="text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--gold))]"
            >
              예약 목록으로 돌아가기
            </Button>
          </div>

          {/* Etiquette quick row */}
          <Card className="mt-10 w-full max-w-md rounded-2xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] text-left shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-sm">상담 에티켓</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2">
                {ETIQUETTE_TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-xs text-[hsl(var(--text-secondary))] [word-break:keep-all]">
                    <span className="shrink-0 font-bold text-[hsl(var(--gold))]">{i + 1}.</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <Separator className="my-3 bg-[hsl(var(--border-subtle))]" />
              <p className="text-xs text-[hsl(var(--text-muted))]">
                사용 상담권: <span className="font-bold text-[hsl(var(--text-primary))]">{booking?.creditsUsed || 1}회</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </RequireLogin>
  );
}
