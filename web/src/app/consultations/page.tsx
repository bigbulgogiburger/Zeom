'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle, StatusBadge } from '../../components/ui';

type Consultation = {
  id: number;
  reservationId: number;
  counselorName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  status: string;
  hasReview: boolean;
};

export default function ConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadConsultations() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/consultations/me', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '상담 내역을 불러올 수 없습니다.');
        setConsultations([]);
        return;
      }
      const data = await res.json();
      setConsultations(data);
    } catch {
      setMessage('상담 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsultations();
  }, []);

  function formatDuration(minutes: number) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  }

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>상담 내역</PageTitle>
        <InlineError message={message} />

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              불러오는 중...
            </div>
          </Card>
        ) : consultations.length === 0 ? (
          <EmptyState
            title="상담 내역이 없습니다"
            desc="상담을 예약하고 이용해보세요."
          />
        ) : (
          <div className="grid gap-6">
            {consultations.map((c) => (
              <Card key={c.id}>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2 items-center mb-2 flex-wrap">
                      <h3 className="m-0 text-lg font-bold font-heading">
                        {c.counselorName}
                      </h3>
                      <StatusBadge value={c.status} />
                    </div>

                    <div className="grid gap-1 text-sm text-[var(--color-text-muted-card)]">
                      <div>
                        <span>시작: </span>
                        <span>{new Date(c.startedAt).toLocaleString('ko-KR')}</span>
                      </div>
                      {c.endedAt && (
                        <div>
                          <span>종료: </span>
                          <span>{new Date(c.endedAt).toLocaleString('ko-KR')}</span>
                        </div>
                      )}
                      <div>
                        <span>시간: </span>
                        <span className="font-medium">
                          {formatDuration(c.durationMinutes)}
                        </span>
                      </div>
                    </div>

                    {/* Review Status */}
                    <div className={`mt-4 px-4 py-2 rounded-full text-xs font-medium inline-block ${
                      c.hasReview
                        ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                        : 'bg-[var(--color-warning-light)] text-[var(--color-warning)]'
                    }`}>
                      {c.hasReview ? '리뷰 작성 완료' : '리뷰 작성 대기'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {!c.hasReview && c.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/consultation/${c.id}/review`)}
                        className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] px-6 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
                      >
                        리뷰 작성
                      </button>
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
