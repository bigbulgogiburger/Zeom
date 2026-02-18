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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          flexWrap: 'wrap',
        }}>
          <PageTitle>환불 내역</PageTitle>
          <button
            onClick={() => router.push('/refunds/new')}
            style={{
              background: 'var(--color-gold)',
              color: 'var(--color-bg-primary)',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'var(--font-weight-bold)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            + 환불 신청
          </button>
        </div>

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
        ) : refunds.length === 0 ? (
          <EmptyState
            title="환불 신청 내역이 없습니다"
            desc="예약을 취소하거나 환불이 필요한 경우 신청할 수 있습니다."
          />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {refunds.map((r) => (
              <Card key={r.id}>
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
                        {r.counselorName} 상담
                      </h3>
                      <StatusBadge value={r.status} />
                    </div>

                    <div style={{
                      display: 'grid',
                      gap: 'var(--spacing-xs)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-muted-card)',
                    }}>
                      <div>
                        <span>금액: </span>
                        <span style={{
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--color-gold)',
                        }}>
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
                      <div style={{
                        marginTop: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                      }}>
                        <div style={{
                          color: 'var(--color-text-muted-card)',
                          marginBottom: 'var(--spacing-xs)',
                        }}>
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
