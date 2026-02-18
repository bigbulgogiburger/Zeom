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
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 grid gap-8">
        <PageTitle>환불 신청</PageTitle>
        <InlineError message={message} />

        {/* Refund Policy */}
        <Card>
          <h3 className="m-0 mb-4 text-lg font-bold font-heading">
            환불 정책
          </h3>
          <div className="grid gap-2 text-sm">
            <div className="p-4 bg-[var(--color-success-light)] rounded-xl">
              <span className="font-bold text-[var(--color-success)]">
                24시간 이상 전:
              </span>
              <span className="ml-2">100% 환불</span>
            </div>
            <div className="p-4 bg-[var(--color-warning-light)] rounded-xl">
              <span className="font-bold text-[var(--color-warning)]">
                1시간 ~ 24시간 전:
              </span>
              <span className="ml-2">50% 환불</span>
            </div>
            <div className="p-4 bg-[var(--color-danger-light)] rounded-xl">
              <span className="font-bold text-[var(--color-danger)]">
                1시간 미만:
              </span>
              <span className="ml-2">환불 불가</span>
            </div>
          </div>
        </Card>

        {reservations.length === 0 ? (
          <EmptyState
            title="환불 가능한 예약이 없습니다"
            desc="완료되지 않은 예약만 환불 신청이 가능합니다."
          />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-8">
            {/* Select Reservation */}
            <Card>
              <label className="block mb-4 text-base font-medium">
                환불할 예약 선택
              </label>
              <div className="grid gap-2">
                {reservations.map((r) => (
                  <label
                    key={r.id}
                    className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                      selectedReservationId === r.id
                        ? 'bg-[#C9A227] border-2 border-[#C9A227]'
                        : 'bg-[#1a1612] border-2 border-[rgba(201,162,39,0.15)] hover:border-[#C9A227]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reservation"
                      value={r.id}
                      checked={selectedReservationId === r.id}
                      onChange={() => setSelectedReservationId(r.id)}
                      className="cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className={`font-bold mb-1 ${
                        selectedReservationId === r.id
                          ? 'text-[#0f0d0a]'
                          : 'text-[var(--color-text-on-dark)]'
                      }`}>
                        {r.counselorName} 상담
                      </div>
                      <div className={`text-sm ${
                        selectedReservationId === r.id
                          ? 'text-[#0f0d0a]/70'
                          : 'text-[var(--color-text-muted-dark)]'
                      }`}>
                        {new Date(r.startAt).toLocaleString('ko-KR')}
                        <span className="mx-1">&middot;</span>
                        {r.amount.toLocaleString()}원
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Estimated Refund */}
            {selectedReservation && (
              <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-6">
                <div className="text-center py-2">
                  <div className="text-sm text-[var(--color-text-muted-dark)] mb-2">
                    예상 환불 금액
                  </div>
                  <div className={`text-3xl font-black font-heading mb-2 ${
                    estimatedRefund > 0
                      ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent'
                      : 'text-[var(--color-danger)]'
                  }`}>
                    {estimatedRefund.toLocaleString()}원
                  </div>
                  <div className="text-xs text-[var(--color-text-muted-dark)]">
                    {hoursUntilStart >= 24
                      ? '(24시간 이상 전 - 100% 환불)'
                      : hoursUntilStart >= 1
                        ? '(1-24시간 전 - 50% 환불)'
                        : '(1시간 미만 - 환불 불가)'}
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <Card>
              <label htmlFor="refund-reason" className="block mb-2 text-base font-medium">
                환불 사유
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="환불 사유를 입력해주세요."
                rows={4}
                disabled={loading}
                className="w-full p-4 border-2 border-[rgba(201,162,39,0.15)] rounded-xl bg-[#1a1612] text-[var(--color-text-on-dark)] text-base font-[inherit] leading-relaxed resize-y focus:border-[#C9A227]/50 focus:outline-none"
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
              className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm hover:bg-[#C9A227]/10 bg-transparent cursor-pointer"
            >
              취소
            </button>
          </form>
        )}
      </main>
    </RequireLogin>
  );
}
