'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { ActionButton, Card, EmptyState, InlineError, PageTitle } from '../../../components/ui';

type Reservation = {
  id: number;
  counselorName: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: string;
};

export default function NewRefundPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [estimatedRefund, setEstimatedRefund] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadRefundableReservations() {
    try {
      const res = await apiFetch('/api/v1/reservations/me/refundable', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '환불 가능한 예약을 불러올 수 없습니다.');
        return;
      }
      const data = await res.json();
      setReservations(data);
    } catch {
      setMessage('예약 목록을 불러오는 중 오류가 발생했습니다.');
    }
  }

  useEffect(() => {
    loadRefundableReservations();
  }, []);

  useEffect(() => {
    if (selectedReservationId) {
      const reservation = reservations.find(r => r.id === selectedReservationId);
      if (reservation) {
        calculateRefund(reservation);
      }
    } else {
      setEstimatedRefund(0);
    }
  }, [selectedReservationId, reservations]);

  function calculateRefund(reservation: Reservation) {
    const now = new Date();
    const startTime = new Date(reservation.startAt);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilStart >= 24) {
      refundPercentage = 100;
    } else if (hoursUntilStart >= 1) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }

    const refundAmount = Math.floor((reservation.amount * refundPercentage) / 100);
    setEstimatedRefund(refundAmount);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!selectedReservationId) {
      setMessage('환불할 예약을 선택해주세요.');
      return;
    }

    if (!reason.trim()) {
      setMessage('환불 사유를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: selectedReservationId,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '환불 신청에 실패했습니다.');
        return;
      }

      router.push('/refunds');
    } catch {
      setMessage('환불 신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const selectedReservation = reservations.find(r => r.id === selectedReservationId);
  const hoursUntilStart = selectedReservation
    ? (new Date(selectedReservation.startAt).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;

  return (
    <RequireLogin>
      <main style={{
        padding: 'var(--spacing-xl)',
        display: 'grid',
        gap: 'var(--spacing-lg)',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <PageTitle>환불 신청</PageTitle>
        <InlineError message={message} />

        {/* Refund Policy */}
        <Card>
          <h3 style={{
            margin: '0 0 var(--spacing-md) 0',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-heading)',
          }}>
            환불 정책
          </h3>
          <div style={{
            display: 'grid',
            gap: 'var(--spacing-sm)',
            fontSize: 'var(--font-size-sm)',
          }}>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-success-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)' }}>
                24시간 이상 전:
              </span>
              <span style={{ marginLeft: 'var(--spacing-sm)' }}>100% 환불</span>
            </div>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-warning-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)' }}>
                1시간 ~ 24시간 전:
              </span>
              <span style={{ marginLeft: 'var(--spacing-sm)' }}>50% 환불</span>
            </div>
            <div style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-danger-light)',
              borderRadius: 'var(--radius-md)',
            }}>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>
                1시간 미만:
              </span>
              <span style={{ marginLeft: 'var(--spacing-sm)' }}>환불 불가</span>
            </div>
          </div>
        </Card>

        {reservations.length === 0 ? (
          <EmptyState
            title="환불 가능한 예약이 없습니다"
            desc="완료되지 않은 예약만 환불 신청이 가능합니다."
          />
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
            {/* Select Reservation */}
            <Card>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                환불할 예약 선택
              </label>
              <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {reservations.map((r) => (
                  <label
                    key={r.id}
                    style={{
                      display: 'flex',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      background: selectedReservationId === r.id
                        ? 'var(--color-gold)'
                        : 'var(--color-bg-secondary)',
                      border: `2px solid ${selectedReservationId === r.id
                        ? 'var(--color-gold)'
                        : 'var(--color-border-dark)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <input
                      type="radio"
                      name="reservation"
                      value={r.id}
                      checked={selectedReservationId === r.id}
                      onChange={() => setSelectedReservationId(r.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: 'var(--font-weight-bold)',
                        marginBottom: 'var(--spacing-xs)',
                        color: selectedReservationId === r.id
                          ? 'var(--color-bg-primary)'
                          : 'var(--color-text-on-dark)',
                      }}>
                        {r.counselorName} 상담
                      </div>
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: selectedReservationId === r.id
                          ? 'var(--color-bg-primary)'
                          : 'var(--color-text-muted-dark)',
                      }}>
                        {new Date(r.startAt).toLocaleString('ko-KR')}
                        <span style={{ margin: '0 var(--spacing-xs)' }}>·</span>
                        {r.amount.toLocaleString()}원
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Estimated Refund */}
            {selectedReservation && (
              <Card>
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--spacing-md)',
                }}>
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-muted-card)',
                    marginBottom: 'var(--spacing-sm)',
                  }}>
                    예상 환불 금액
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-black)',
                    color: estimatedRefund > 0 ? 'var(--color-gold)' : 'var(--color-danger)',
                    fontFamily: 'var(--font-heading)',
                    marginBottom: 'var(--spacing-sm)',
                  }}>
                    {estimatedRefund.toLocaleString()}원
                  </div>
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted-card)',
                  }}>
                    {hoursUntilStart >= 24
                      ? '(24시간 이상 전 - 100% 환불)'
                      : hoursUntilStart >= 1
                        ? '(1-24시간 전 - 50% 환불)'
                        : '(1시간 미만 - 환불 불가)'}
                  </div>
                </div>
              </Card>
            )}

            {/* Reason */}
            <Card>
              <label htmlFor="refund-reason" style={{
                display: 'block',
                marginBottom: 'var(--spacing-sm)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
              }}>
                환불 사유
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="환불 사유를 입력해주세요."
                rows={4}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md)',
                  border: `2px solid var(--color-border-dark)`,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-on-dark)',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'inherit',
                  lineHeight: 'var(--line-height-normal)',
                  resize: 'vertical',
                }}
              />
            </Card>

            <ActionButton
              type="submit"
              loading={loading}
              disabled={loading || !selectedReservationId || estimatedRefund === 0}
            >
              환불 신청
            </ActionButton>

            <button
              type="button"
              onClick={() => router.push('/refunds')}
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
              ← 취소
            </button>
          </form>
        )}
      </main>
    </RequireLogin>
  );
}
