'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getSettlementBySession } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type SessionData = {
  id: number;
  reservationId: number;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  endReason: string | null;
};

type SettlementData = {
  id: number;
  sessionId: number;
  bookingId: number;
  creditsReserved: number;
  creditsConsumed: number;
  creditsRefunded: number;
  actualDurationSec: number;
  settlementType: string;
  counselorEarning: number;
  platformFee: number;
  commissionRate: number;
  settledAt: string;
};

const REVIEW_COUNTDOWN_SEC = 60;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}초`;
  return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEndReasonLabel(reason: string | null): string {
  switch (reason) {
    case 'COMPLETED':
      return '정상 종료';
    case 'TIMEOUT':
      return '시간 만료';
    case 'CLIENT_DISCONNECT':
      return '고객 연결 해제';
    case 'COUNSELOR_DISCONNECT':
      return '상담사 연결 해제';
    case 'ERROR':
      return '오류 발생';
    default:
      return reason || '종료';
  }
}

/** 단청 동심원 SVG — 80x80 gold 원 + 8 dot + 중앙 dot. emoji 0 baseline 유지 */
function DancheongMandala({ size = 80 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const dotR = size * 0.325;
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="상담 완료"
      className="motion-safe:[animation:scaleIn_0.6s_ease-out]"
    >
      <circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill="hsl(var(--gold) / 0.08)"
        stroke="hsl(var(--gold))"
        strokeWidth={2}
      />
      <circle cx={cx} cy={cy} r={size * 0.075} fill="hsl(var(--gold))" />
      {angles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = cx + dotR * Math.cos(rad);
        const y = cy + dotR * Math.sin(rad);
        return (
          <circle
            key={deg}
            cx={x}
            cy={y}
            r={size * 0.0375}
            fill="hsl(var(--gold-soft))"
          />
        );
      })}
    </svg>
  );
}

export default function ConsultationCompletePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(REVIEW_COUNTDOWN_SEC);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const sessionRes = await apiFetch(`/api/v1/sessions/${sessionId}`, {
          cache: 'no-store',
        });
        if (sessionRes.ok) setSession(await sessionRes.json());

        try {
          const settlementData = await getSettlementBySession(sessionId);
          setSettlement(settlementData);
        } catch {
          /* settlement may not exist yet */
        }
      } catch {
        setError('상담 결과를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) loadData();
  }, [sessionId]);

  // 60s auto-redirect to review (pausable)
  useEffect(() => {
    if (paused || loading) return;
    if (secondsLeft <= 0) {
      router.push(`/consultation/${sessionId}/review`);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, paused, loading, router, sessionId]);

  if (loading) {
    return (
      <RequireLogin>
        <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
          <div className="text-center py-16 text-muted-foreground">
            불러오는 중...
          </div>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
        {/* Hero — 80px gold 단청 SVG + 카운트다운 */}
        <div className="text-center grid place-items-center gap-3">
          <DancheongMandala size={80} />
          <h1 className="text-2xl font-bold font-heading text-[hsl(var(--text-primary))]">
            상담이 종료되었습니다
          </h1>
          {session?.endReason && (
            <Badge variant="secondary" className="rounded-full">
              {getEndReasonLabel(session.endReason)}
            </Badge>
          )}

          {/* Countdown */}
          <div
            role="status"
            aria-live="polite"
            className="mt-2 text-sm text-[hsl(var(--text-secondary))] tabular-nums"
          >
            {paused ? (
              <span>리뷰 자동 이동이 일시 중지되었습니다.</span>
            ) : (
              <span>
                {secondsLeft}초 후 리뷰 작성으로 이동합니다.{' '}
                <button
                  type="button"
                  onClick={() => setPaused(true)}
                  className="text-[hsl(var(--gold))] underline font-heading font-bold ml-1"
                >
                  머무르기
                </button>
              </span>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" className="text-destructive text-sm text-center font-medium">
            {error}
          </div>
        )}

        {session && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상담 요약</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted-foreground">시작 시간</span>
                <span className="font-medium">{formatDateTime(session.startedAt)}</span>
              </div>
              {session.endedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">종료 시간</span>
                  <span className="font-medium">{formatDateTime(session.endedAt)}</span>
                </div>
              )}
              {session.durationSec != null && session.durationSec > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">실제 상담 시간</span>
                  <span className="font-bold text-primary">
                    {formatDuration(session.durationSec)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {settlement && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">정산 결과</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted-foreground">예약 상담권</span>
                <span className="font-medium">{settlement.creditsReserved}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">사용 상담권</span>
                <span className="font-bold">{settlement.creditsConsumed}회</span>
              </div>
              {settlement.creditsRefunded > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">환불 상담권</span>
                  <span className="font-bold text-[hsl(var(--success))]">
                    {settlement.creditsRefunded}회
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">실제 상담 시간</span>
                <span className="font-medium">
                  {formatDuration(settlement.actualDurationSec)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">정산 유형</span>
                <Badge variant="outline">
                  {settlement.settlementType === 'NORMAL'
                    ? '정상'
                    : settlement.settlementType === 'EARLY_END'
                    ? '조기 종료'
                    : settlement.settlementType === 'TIMEOUT'
                    ? '시간 만료'
                    : settlement.settlementType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {!settlement && !error && !loading && (
          <Card>
            <CardContent className="text-center py-6 text-muted-foreground text-sm">
              정산 정보가 아직 처리 중입니다. 잠시 후 다시 확인해주세요.
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push(`/consultation/${sessionId}/review`)}
            className="bg-primary text-primary-foreground font-bold"
          >
            리뷰 작성하기
          </Button>
          <Link href={`/consultation/${sessionId}/summary`}>
            <Button variant="outline" className="w-full">
              상담 요약 보기
            </Button>
          </Link>
          <Link href="/credits/history">
            <Button variant="ghost" className="w-full">
              상담권 내역
            </Button>
          </Link>
        </div>
      </main>
    </RequireLogin>
  );
}
