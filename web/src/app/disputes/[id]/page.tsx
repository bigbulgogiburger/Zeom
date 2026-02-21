'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, InlineError, PageTitle } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { cn } from '@/lib/utils';

type DisputeDetail = {
  id: number;
  reservationId: number;
  category: string;
  description: string;
  status: string;
  resolution: string | null;
  resolutionType: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: '접수됨',
    className: 'bg-[var(--color-warning)] text-[var(--color-warning-light)] hover:bg-[var(--color-warning)]',
  },
  IN_REVIEW: {
    label: '검토중',
    className: 'bg-[#2563eb] text-white hover:bg-[#2563eb]',
  },
  RESOLVED: {
    label: '해결됨',
    className: 'bg-[var(--color-success)] text-[var(--color-success-light)] hover:bg-[var(--color-success)]',
  },
};

const CATEGORY_MAP: Record<string, string> = {
  SERVICE_ISSUE: '서비스 문제',
  BILLING_ISSUE: '결제 문제',
  COUNSELOR_ISSUE: '상담사 문제',
  OTHER: '기타',
};

const RESOLUTION_TYPE_MAP: Record<string, string> = {
  REFUND: '환불 처리',
  CREDIT: '보상 크레딧 지급',
  WARNING: '상담사 경고',
  DISMISS: '기각',
};

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadDispute() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/disputes/${params.id}`, { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '분쟁 정보를 불러올 수 없습니다.');
        return;
      }
      setDispute(await res.json());
    } catch {
      setMessage('분쟁 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.id) loadDispute();
  }, [params.id]);

  return (
    <RequireLogin>
      <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/disputes')}
            className="text-[var(--color-gold)] font-heading font-bold"
          >
            &larr; 목록
          </Button>
          <PageTitle>분쟁 상세</PageTitle>
        </div>

        <InlineError message={message} />

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              불러오는 중...
            </div>
          </Card>
        ) : dispute ? (
          <div className="space-y-6">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="m-0 text-xl font-bold font-heading">
                    {CATEGORY_MAP[dispute.category] || dispute.category}
                  </h3>
                  {(() => {
                    const statusInfo = STATUS_MAP[dispute.status] || {
                      label: dispute.status,
                      className: '',
                    };
                    return (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-heading font-bold text-xs rounded-full',
                          statusInfo.className
                        )}
                      >
                        {statusInfo.label}
                      </Badge>
                    );
                  })()}
                </div>

                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="text-[var(--color-text-muted-card)]">예약 번호: </span>
                    <span className="font-bold">{dispute.reservationId}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted-card)]">접수일: </span>
                    <span>{new Date(dispute.createdAt).toLocaleString('ko-KR')}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-[#1a1612] rounded-xl text-sm">
                  <div className="text-[var(--color-text-muted-card)] mb-1">설명</div>
                  <div className="whitespace-pre-wrap">{dispute.description}</div>
                </div>
              </div>
            </Card>

            {dispute.status === 'RESOLVED' && (
              <Card>
                <div className="space-y-4">
                  <h3 className="m-0 text-lg font-bold font-heading text-[var(--color-gold)]">
                    해결 결과
                  </h3>

                  <div className="grid gap-3 text-sm">
                    {dispute.resolutionType && (
                      <div>
                        <span className="text-[var(--color-text-muted-card)]">처리 유형: </span>
                        <span className="font-bold">
                          {RESOLUTION_TYPE_MAP[dispute.resolutionType] || dispute.resolutionType}
                        </span>
                      </div>
                    )}
                    {dispute.resolutionNote && (
                      <div className="mt-2 p-4 bg-[#1a1612] rounded-xl">
                        <div className="text-[var(--color-text-muted-card)] mb-1">관리자 메모</div>
                        <div className="whitespace-pre-wrap">{dispute.resolutionNote}</div>
                      </div>
                    )}
                    {dispute.resolvedAt && (
                      <div>
                        <span className="text-[var(--color-text-muted-card)]">해결일: </span>
                        <span>{new Date(dispute.resolvedAt).toLocaleString('ko-KR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        ) : null}
      </main>
    </RequireLogin>
  );
}
