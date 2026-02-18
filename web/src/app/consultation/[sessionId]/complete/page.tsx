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
    case 'COMPLETED': return '정상 종료';
    case 'TIMEOUT': return '시간 만료';
    case 'CLIENT_DISCONNECT': return '고객 연결 해제';
    case 'COUNSELOR_DISCONNECT': return '상담사 연결 해제';
    case 'ERROR': return '오류 발생';
    default: return reason || '종료';
  }
}

export default function ConsultationCompletePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [settlement, setSettlement] = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Load session data
        const sessionRes = await apiFetch(`/api/v1/sessions/${sessionId}`, { cache: 'no-store' });
        if (sessionRes.ok) {
          setSession(await sessionRes.json());
        }

        // Load settlement data
        try {
          const settlementData = await getSettlementBySession(sessionId);
          setSettlement(settlementData);
        } catch {
          // Settlement may not exist yet if session just ended
        }
      } catch {
        setError('상담 결과를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) loadData();
  }, [sessionId]);

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
      <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-5xl mb-4">&#10004;&#65039;</div>
          <h1 className="text-2xl font-bold font-heading">상담이 종료되었습니다</h1>
          {session?.endReason && (
            <Badge variant="secondary" className="mt-2">
              {getEndReasonLabel(session.endReason)}
            </Badge>
          )}
        </div>

        {error && (
          <div role="alert" className="text-destructive text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Session Summary */}
        {session && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상담 요약</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
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
                  <span className="font-bold text-primary">{formatDuration(session.durationSec)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Settlement Result */}
        {settlement && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">정산 결과</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
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
                  <span className="font-bold text-green-700">{settlement.creditsRefunded}회</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">실제 상담 시간</span>
                <span className="font-medium">{formatDuration(settlement.actualDurationSec)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">정산 유형</span>
                <Badge variant="outline">
                  {settlement.settlementType === 'NORMAL' ? '정상' :
                   settlement.settlementType === 'EARLY_END' ? '조기 종료' :
                   settlement.settlementType === 'TIMEOUT' ? '시간 만료' :
                   settlement.settlementType}
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push(`/consultation/${sessionId}/review`)}
            className="bg-primary text-primary-foreground font-bold"
          >
            리뷰 작성하기
          </Button>
          <Link href="/credits/history">
            <Button variant="outline" className="w-full">
              상담권 이용 내역
            </Button>
          </Link>
          <Link href="/bookings/me">
            <Button variant="ghost" className="w-full">
              내 예약 목록
            </Button>
          </Link>
        </div>
      </main>
    </RequireLogin>
  );
}
