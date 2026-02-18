'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle, StatusBadge } from '../../components/ui';

type Refund = {
  id: number;
  reservationId: number;
  counselorName: string;
  amount: number;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
};

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadRefunds() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/refunds/me', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '환불 내역을 불러올 수 없습니다.');
        setRefunds([]);
        return;
      }
      const data = await res.json();
      setRefunds(data);
    } catch {
      setMessage('환불 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefunds();
  }, []);

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <PageTitle>환불 내역</PageTitle>
          <button
            onClick={() => router.push('/refunds/new')}
            className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] px-6 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
          >
            + 환불 신청
          </button>
        </div>

        <InlineError message={message} />

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              불러오는 중...
            </div>
          </Card>
        ) : refunds.length === 0 ? (
          <EmptyState
            title="환불 신청 내역이 없습니다"
            desc="예약을 취소하거나 환불이 필요한 경우 신청할 수 있습니다."
          />
        ) : (
          <div className="grid gap-6">
            {refunds.map((r) => (
              <Card key={r.id}>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2 items-center mb-2 flex-wrap">
                      <h3 className="m-0 text-lg font-bold font-heading">
                        {r.counselorName} 상담
                      </h3>
                      <StatusBadge value={r.status} />
                    </div>

                    <div className="grid gap-1 text-sm text-[var(--color-text-muted-card)]">
                      <div>
                        <span>금액: </span>
                        <span className="font-bold text-[#C9A227]">
                          {r.amount.toLocaleString()}원
                        </span>
                      </div>
                      <div>
                        <span>신청일: </span>
                        <span>{new Date(r.requestedAt).toLocaleString('ko-KR')}</span>
                      </div>
                      {r.processedAt && (
                        <div>
                          <span>처리일: </span>
                          <span>{new Date(r.processedAt).toLocaleString('ko-KR')}</span>
                        </div>
                      )}
                    </div>

                    {r.reason && (
                      <div className="mt-4 p-4 bg-[#1a1612] rounded-xl text-sm">
                        <div className="text-[var(--color-text-muted-card)] mb-1">
                          사유:
                        </div>
                        <div>{r.reason}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
