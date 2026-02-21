'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { cn } from '@/lib/utils';

type Dispute = {
  id: number;
  reservationId: number;
  category: string;
  description: string;
  status: string;
  resolutionType: string | null;
  createdAt: string;
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

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadDisputes() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/disputes/me', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '분쟁 내역을 불러올 수 없습니다.');
        setDisputes([]);
        return;
      }
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch {
      setMessage('분쟁 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDisputes();
  }, []);

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>분쟁 내역</PageTitle>

        <InlineError message={message} />

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              불러오는 중...
            </div>
          </Card>
        ) : disputes.length === 0 ? (
          <EmptyState
            title="분쟁 내역이 없습니다"
            desc="상담과 관련된 문제가 있으시면 분쟁을 접수할 수 있습니다."
          />
        ) : (
          <div className="grid gap-6">
            {disputes.map((d) => {
              const statusInfo = STATUS_MAP[d.status] || {
                label: d.status,
                className: '',
              };
              return (
                <Card
                  key={d.id}
                  className="cursor-pointer"
                >
                  <div
                    onClick={() => router.push(`/disputes/${d.id}`)}
                    className="flex justify-between items-start gap-4 flex-wrap"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex gap-2 items-center mb-2 flex-wrap">
                        <h3 className="m-0 text-lg font-bold font-heading">
                          {CATEGORY_MAP[d.category] || d.category}
                        </h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'font-heading font-bold text-xs rounded-full',
                            statusInfo.className
                          )}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="grid gap-1 text-sm text-[var(--color-text-muted-card)]">
                        <div className="line-clamp-2">{d.description}</div>
                        <div className="mt-2">
                          <span>접수일: </span>
                          <span>
                            {new Date(d.createdAt).toLocaleString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[var(--color-text-muted-card)] text-sm shrink-0">
                      &rsaquo;
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
