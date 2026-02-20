'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch, getSessionStatus } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
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
  }, [secondsLeft !== null]);

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
        <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
          <div className="text-center py-16 text-muted-foreground">불러오는 중...</div>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main className="max-w-3xl mx-auto px-4 py-8 grid gap-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-heading text-[var(--color-text-on-dark)]">
            상담 대기실
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            상담 시작까지 준비해주세요
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Countdown */}
        <Card className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] shadow-lg">
          <CardContent className="py-8 text-center">
            {secondsLeft !== null && secondsLeft > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-2">상담 시작까지</p>
                <p className="text-4xl font-bold font-heading text-[#C9A227]">
                  {formatCountdown(secondsLeft)}
                </p>
                {scheduledTime && (
                  <p className="text-sm text-muted-foreground mt-3">
                    예약 시간: {formatDateTime(scheduledTime)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-heading text-[#2d6930]">
                  상담 시간이 되었습니다
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  아래 버튼을 눌러 상담실에 입장해주세요
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Counselor Info + Media Preview */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Counselor Info */}
          <Card className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">상담사 정보</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1a1612] flex items-center justify-center text-3xl text-[#C9A227]">
                  &#128100;
                </div>
                <div>
                  <p className="font-bold text-lg">{booking?.counselorName || '상담사'}</p>
                  {scheduledTime && (
                    <p className="text-sm text-muted-foreground">{formatDateTime(scheduledTime)}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">상담 유형</span>
                <Badge variant="outline" className="rounded-full font-heading">화상 상담</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">사용 상담권</span>
                <span className="font-bold">{booking?.creditsUsed || 1}회</span>
              </div>

              {counselorReady && canEnter && (
                <div className="mt-2 p-3 bg-[var(--color-success-light)] rounded-xl text-center">
                  <p className="text-sm font-bold text-[#2d6930]">
                    상담사가 준비되었습니다
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Camera/Mic Preview */}
          <Card className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">카메라 미리보기</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="relative w-full pb-[56.25%] bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                    카메라를 확인 중...
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <div className={`flex-1 text-center py-2 rounded-xl text-sm font-medium ${
                  cameraReady ? 'bg-[var(--color-success-light)] text-[#2d6930]' : 'bg-[var(--color-danger-light)] text-[#8B0000]'
                }`}>
                  카메라 {cameraReady ? '정상' : '확인 필요'}
                </div>
                <div className={`flex-1 text-center py-2 rounded-xl text-sm font-medium ${
                  micReady ? 'bg-[var(--color-success-light)] text-[#2d6930]' : 'bg-[var(--color-danger-light)] text-[#8B0000]'
                }`}>
                  마이크 {micReady ? '정상' : '확인 필요'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Etiquette Tips */}
        <Card className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">상담 에티켓</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {ETIQUETTE_TIPS.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-card-foreground">
                  <span className="text-[#C9A227] font-bold shrink-0">{i + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Enter Button */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleEnter}
            disabled={!canEnter}
            className={`w-full rounded-full py-6 text-lg font-heading font-bold ${
              canEnter
                ? 'bg-[#C9A227] text-[#0f0d0a] hover:bg-[#b08d1f]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {canEnter ? '상담실 입장' : '시작 5분 전부터 입장 가능합니다'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/bookings/me')}
            className="text-sm text-muted-foreground"
          >
            예약 목록으로 돌아가기
          </Button>
        </div>
      </main>
    </RequireLogin>
  );
}
