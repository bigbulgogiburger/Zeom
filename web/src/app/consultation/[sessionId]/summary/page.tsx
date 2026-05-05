'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, User, Printer } from 'lucide-react';

type SessionSummary = {
  sessionId: number;
  reservationId: number;
  counselorId?: number;
  counselorName: string;
  counselorSpecialty: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  endReason: string | null;
  creditsUsed: number;
  memo: string | null;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}시간 ${mins}분 ${secs}초`;
  if (mins > 0) return secs > 0 ? `${mins}분 ${secs}초` : `${mins}분`;
  return `${secs}초`;
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
    case 'NETWORK':
      return '네트워크 오류';
    case 'ADMIN':
      return '관리자 종료';
    default:
      return reason || '종료';
  }
}

function getEndReasonVariant(
  reason: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (reason) {
    case 'COMPLETED':
      return 'default';
    case 'TIMEOUT':
      return 'secondary';
    case 'CLIENT_DISCONNECT':
    case 'COUNSELOR_DISCONNECT':
    case 'NETWORK':
      return 'destructive';
    default:
      return 'outline';
  }
}

export default function ConsultationSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    async function loadSummary() {
      try {
        const res = await apiFetch(`/api/v1/sessions/${sessionId}/summary`, {
          cache: 'no-store',
        });
        if (!alive) return;
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.message || '상담 요약을 불러올 수 없습니다.');
          return;
        }
        setSummary(await res.json());
      } catch {
        if (alive) setError('상담 요약을 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (sessionId) loadSummary();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <RequireLogin>
        <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
          <div className="text-center py-16 text-[hsl(var(--text-secondary))]">
            불러오는 중...
          </div>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main className="max-w-2xl mx-auto px-4 py-8 grid gap-6">
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-[hsl(var(--success)/0.15)] flex items-center justify-center text-[hsl(var(--success))]"
            aria-hidden="true"
          >
            <Check size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold font-heading text-[hsl(var(--text-primary))]">
            상담이 완료되었습니다
          </h1>
          {summary?.endReason && (
            <Badge
              variant={getEndReasonVariant(summary.endReason)}
              className="mt-2 rounded-full font-heading"
            >
              {getEndReasonLabel(summary.endReason)}
            </Badge>
          )}
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summary && (
          <Card className="rounded-2xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-heading">상담 요약</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-4 p-3 bg-[hsl(var(--surface-hover))] rounded-xl">
                <div
                  className="w-12 h-12 rounded-full bg-[hsl(var(--surface))] flex items-center justify-center text-[hsl(var(--gold))]"
                  aria-hidden="true"
                >
                  <User size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-bold text-base">{summary.counselorName}</p>
                  {summary.counselorSpecialty && (
                    <p className="text-sm text-[hsl(var(--text-secondary))]">
                      {summary.counselorSpecialty}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid gap-3 text-sm tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--text-secondary))]">시작 시간</span>
                  <span className="font-medium">{formatDateTime(summary.startedAt)}</span>
                </div>
                {summary.endedAt && (
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--text-secondary))]">종료 시간</span>
                    <span className="font-medium">{formatDateTime(summary.endedAt)}</span>
                  </div>
                )}
                {summary.durationSec != null && summary.durationSec > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--text-secondary))]">상담 시간</span>
                    <span className="font-bold text-[hsl(var(--gold))]">
                      {formatDuration(summary.durationSec)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-[hsl(var(--text-secondary))]">소모 상담권</span>
                <span className="font-bold text-lg text-[hsl(var(--gold))] tabular-nums">
                  {summary.creditsUsed}회
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {summary?.memo && (
          <Card className="rounded-2xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-heading">상담사 메모</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-[hsl(var(--surface-hover))] rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                {summary.memo}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 print:hidden">
          <Button
            onClick={() => router.push(`/consultation/${sessionId}/review`)}
            className="w-full rounded-full py-5 text-base font-heading font-bold bg-[hsl(var(--gold))] text-[hsl(var(--background))] hover:bg-[hsl(var(--gold)/0.85)]"
          >
            리뷰 작성하기
          </Button>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="w-full rounded-full py-5 text-base font-heading font-bold border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.1)]"
          >
            <Printer className="size-4 mr-2" aria-hidden />
            영수증 다운로드 (PDF)
          </Button>
          {summary && summary.counselorId != null && (
            <Button
              variant="outline"
              onClick={() => router.push(`/counselors/${summary.counselorId}`)}
              className="w-full rounded-full py-5 text-base font-heading font-bold border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.1)]"
            >
              다시 예약하기
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="w-full text-sm text-[hsl(var(--text-secondary))]"
          >
            홈으로
          </Button>
        </div>
      </main>
    </RequireLogin>
  );
}
