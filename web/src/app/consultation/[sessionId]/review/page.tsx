'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiFetch } from '../../../../components/api-client';
import { RequireLogin } from '../../../../components/route-guard';
import { Card, InlineError, PageTitle } from '../../../../components/ui';
import ReviewForm from '../../../../components/review-form';

type Reservation = {
  id: number;
  counselorName: string;
  counselorId: number;
  startAt: string;
  endAt: string;
  status: string;
};

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function loadReservation() {
    try {
      // In a real implementation, we'd have an endpoint to get reservation by session ID
      // For now, we'll assume the sessionId maps to reservationId
      const res = await apiFetch(`/api/v1/reservations/${sessionId}`, { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '예약 정보를 불러올 수 없습니다.');
        return;
      }
      const data = await res.json();
      setReservation(data);
    } catch {
      setMessage('예약 정보를 불러오는 중 오류가 발생했습니다.');
    }
  }

  useEffect(() => {
    if (sessionId) {
      loadReservation();
    }
  }, [sessionId]);

  async function handleSubmitReview(rating: number, comment: string) {
    if (!reservation) throw new Error('예약 정보가 없습니다.');

    const res = await apiFetch(`/api/v1/reservations/${reservation.id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.message || '리뷰 등록에 실패했습니다.');
    }

    setSubmitted(true);

    // Redirect after a short delay
    setTimeout(() => {
      router.push('/consultations');
    }, 2000);
  }

  if (submitted) {
    return (
      <RequireLogin>
        <main style={{
          padding: 'var(--spacing-xl)',
          display: 'grid',
          gap: 'var(--spacing-lg)',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-3xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <div style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-success)',
              }}>
                리뷰가 등록되었습니다
              </div>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted-card)',
              }}>
                소중한 의견 감사합니다. 잠시 후 상담 내역 페이지로 이동합니다.
              </div>
            </div>
          </Card>
        </main>
      </RequireLogin>
    );
  }

  if (!reservation) {
    return (
      <RequireLogin>
        <main style={{
          padding: 'var(--spacing-xl)',
          display: 'grid',
          gap: 'var(--spacing-lg)',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <PageTitle>상담 후기</PageTitle>
          <InlineError message={message} />
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-xl)',
              color: 'var(--color-text-muted-card)',
            }}>
              예약 정보를 불러오는 중...
            </div>
          </Card>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main style={{
        padding: 'var(--spacing-xl)',
        display: 'grid',
        gap: 'var(--spacing-lg)',
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <PageTitle>상담 후기 작성</PageTitle>
        <InlineError message={message} />

        <Card>
          <div style={{
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted-card)',
              marginBottom: 'var(--spacing-xs)',
            }}>
              상담 일시
            </div>
            <div style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              {new Date(reservation.startAt).toLocaleString('ko-KR')}
            </div>
          </div>

          <ReviewForm
            onSubmit={handleSubmitReview}
            counselorName={reservation.counselorName}
          />
        </Card>

        <button
          onClick={() => router.push('/consultations')}
          style={{
            background: 'transparent',
            color: 'var(--color-gold)',
            border: `1px solid var(--color-border-dark)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
          }}
        >
          ← 나중에 작성하기
        </button>
      </main>
    </RequireLogin>
  );
}
