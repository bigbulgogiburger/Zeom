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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <PageTitle>상담 내역</PageTitle>
        <InlineError message={message} />

        {loading ? (
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--color-text-muted-card)',
            }}>
              불러오는 중...
            </div>
          </Card>
        ) : consultations.length === 0 ? (
          <EmptyState
            title="상담 내역이 없습니다"
            desc="상담을 예약하고 이용해보세요."
          />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {consultations.map((c) => (
              <Card key={c.id}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                      display: 'flex',
                      gap: 'var(--spacing-sm)',
                      alignItems: 'center',
                      marginBottom: 'var(--spacing-sm)',
                      flexWrap: 'wrap',
                    }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 'var(--font-weight-bold)',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        {c.counselorName}
                      </h3>
                      <StatusBadge value={c.status} />
                    </div>

                    <div style={{
                      display: 'grid',
                      gap: 'var(--spacing-xs)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-muted-card)',
                    }}>
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
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {formatDuration(c.durationMinutes)}
                        </span>
                      </div>
                    </div>

                    {/* Review Status */}
                    <div style={{
                      marginTop: 'var(--spacing-md)',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      background: c.hasReview
                        ? 'var(--color-success-light)'
                        : 'var(--color-warning-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: c.hasReview
                        ? 'var(--color-success)'
                        : 'var(--color-warning)',
                    }}>
                      {c.hasReview ? '✅ 리뷰 작성 완료' : '⭐ 리뷰 작성 대기'}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)',
                  }}>
                    {!c.hasReview && c.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/consultation/${c.id}/review`)}
                        style={{
                          background: 'var(--color-gold)',
                          color: 'var(--color-bg-primary)',
                          padding: 'var(--spacing-sm) var(--spacing-md)',
                          fontSize: 'var(--font-size-sm)',
                          borderRadius: 'var(--radius-md)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 'var(--font-weight-bold)',
                          fontFamily: 'var(--font-heading)',
                        }}
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
