'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import {
  ActionButton,
  Card,
  EmptyState,
  InlineError,
  PageTitle,
  ProgressSteps,
} from '../../../components/ui';

type Reservation = {
  id: number;
  counselorName: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: string;
};

const STEPS = ['예약 선택', '사유 입력', '확인'];

export default function NewRefundPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [estimatedRefund, setEstimatedRefund] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
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
      const reservation = reservations.find((r) => r.id === selectedReservationId);
      if (reservation) calculateRefund(reservation);
    } else {
      setEstimatedRefund(0);
    }
  }, [selectedReservationId, reservations]);

  function calculateRefund(reservation: Reservation) {
    const now = new Date();
    const startTime = new Date(reservation.startAt);
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    if (hoursUntilStart >= 24) refundPercentage = 100;
    else if (hoursUntilStart >= 1) refundPercentage = 50;

    const refundAmount = Math.floor((reservation.amount * refundPercentage) / 100);
    setEstimatedRefund(refundAmount);
  }

  function goNext() {
    setMessage('');
    if (step === 1) {
      if (!selectedReservationId) {
        setMessage('환불할 예약을 선택해주세요.');
        return;
      }
      if (estimatedRefund === 0) {
        setMessage('1시간 미만 예약은 환불이 불가합니다.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!reason.trim()) {
        setMessage('환불 사유를 입력해주세요.');
        return;
      }
      setStep(3);
    }
  }

  function goBack() {
    setMessage('');
    if (step > 1) setStep((step - 1) as 1 | 2 | 3);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!selectedReservationId || !reason.trim()) {
      setMessage('필수 정보가 누락되었습니다.');
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

  const selectedReservation = reservations.find((r) => r.id === selectedReservationId);
  const hoursUntilStart = selectedReservation
    ? (new Date(selectedReservation.startAt).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 grid gap-6">
        <PageTitle>환불 신청</PageTitle>
        <ProgressSteps steps={STEPS} current={step} />
        <InlineError message={message} />

        {/* Step 1 — Policy + Reservation Select */}
        {step === 1 && (
          <>
            <Card>
              <h3 className="m-0 mb-4 text-lg font-bold font-heading">환불 정책</h3>
              <div className="grid gap-2 text-sm">
                <div className="p-4 bg-[hsl(var(--success)/0.1)] rounded-xl tabular-nums">
                  <span className="font-bold text-[hsl(var(--success))]">24시간 이상 전:</span>
                  <span className="ml-2">100% 환불</span>
                </div>
                <div className="p-4 bg-[hsl(var(--warning)/0.1)] rounded-xl tabular-nums">
                  <span className="font-bold text-[hsl(var(--warning))]">1시간 ~ 24시간 전:</span>
                  <span className="ml-2">50% 환불</span>
                </div>
                <div className="p-4 bg-[hsl(var(--dancheong)/0.1)] rounded-xl tabular-nums">
                  <span className="font-bold text-[hsl(var(--dancheong))]">1시간 미만:</span>
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
              <Card>
                <fieldset className="m-0 p-0 border-0">
                  <legend className="block mb-4 text-base font-medium font-heading">
                    환불할 예약 선택
                  </legend>
                  <div className="grid gap-2">
                    {reservations.map((r) => {
                      const checked = selectedReservationId === r.id;
                      return (
                        <label
                          key={r.id}
                          className={`flex gap-4 p-4 rounded-xl cursor-pointer transition-all border-2 ${
                            checked
                              ? 'bg-[hsl(var(--gold))] border-[hsl(var(--gold))]'
                              : 'bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] hover:border-[hsl(var(--gold)/0.4)]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reservation"
                            value={r.id}
                            checked={checked}
                            onChange={() => setSelectedReservationId(r.id)}
                            className="cursor-pointer mt-1"
                          />
                          <div className="flex-1">
                            <div
                              className={`font-bold mb-1 ${
                                checked
                                  ? 'text-[hsl(var(--background))]'
                                  : 'text-[hsl(var(--text-primary))]'
                              }`}
                            >
                              {r.counselorName} 상담
                            </div>
                            <div
                              className={`text-sm tabular-nums ${
                                checked
                                  ? 'text-[hsl(var(--background)/0.7)]'
                                  : 'text-[hsl(var(--text-secondary))]'
                              }`}
                            >
                              {new Date(r.startAt).toLocaleString('ko-KR')}
                              <span className="mx-1" aria-hidden>·</span>
                              {r.amount.toLocaleString()}원
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </Card>
            )}

            {selectedReservation && (
              <Card variant="surface">
                <div className="text-center py-2 tabular-nums">
                  <div className="text-sm text-[hsl(var(--text-secondary))] mb-2">
                    예상 환불 금액
                  </div>
                  <div
                    className={`text-3xl font-black font-heading mb-2 ${
                      estimatedRefund > 0
                        ? 'text-[hsl(var(--gold))]'
                        : 'text-[hsl(var(--dancheong))]'
                    }`}
                  >
                    {estimatedRefund.toLocaleString()}원
                  </div>
                  <div className="text-xs text-[hsl(var(--text-secondary))]">
                    {hoursUntilStart >= 24
                      ? '(24시간 이상 전 — 100% 환불)'
                      : hoursUntilStart >= 1
                      ? '(1~24시간 전 — 50% 환불)'
                      : '(1시간 미만 — 환불 불가)'}
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/refunds')}
                className="flex-1 border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] rounded-full px-6 py-2 text-sm hover:bg-[hsl(var(--gold)/0.1)] bg-transparent cursor-pointer font-heading font-bold"
              >
                취소
              </button>
              <ActionButton
                onClick={goNext}
                disabled={!selectedReservationId || estimatedRefund === 0}
                className="flex-1"
              >
                다음 단계
              </ActionButton>
            </div>
          </>
        )}

        {/* Step 2 — Reason */}
        {step === 2 && selectedReservation && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goNext();
            }}
            className="grid gap-6"
          >
            <Card>
              <div className="text-sm text-[hsl(var(--text-secondary))] mb-1">선택한 예약</div>
              <div className="font-bold font-heading mb-4">
                {selectedReservation.counselorName} 상담 ·{' '}
                <span className="tabular-nums">
                  {selectedReservation.amount.toLocaleString()}원
                </span>
              </div>
              <label
                htmlFor="refund-reason"
                className="block mb-2 text-base font-medium font-heading"
              >
                환불 사유
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="환불 사유를 입력해주세요. (최소 10자)"
                rows={5}
                minLength={10}
                maxLength={500}
                disabled={loading}
                className="w-full p-4 border-2 border-[hsl(var(--gold)/0.15)] rounded-xl bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] text-base font-[inherit] leading-relaxed resize-y focus:border-[hsl(var(--gold)/0.5)] focus:outline-none"
              />
              <div className="text-xs text-[hsl(var(--text-secondary))] mt-2 tabular-nums text-right">
                {reason.length} / 500
              </div>
            </Card>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                className="flex-1 border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] rounded-full px-6 py-2 text-sm hover:bg-[hsl(var(--gold)/0.1)] bg-transparent cursor-pointer font-heading font-bold"
              >
                이전
              </button>
              <ActionButton type="submit" disabled={!reason.trim()} className="flex-1">
                다음 단계
              </ActionButton>
            </div>
          </form>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && selectedReservation && (
          <form onSubmit={handleSubmit} className="grid gap-6">
            <Card>
              <h3 className="m-0 mb-4 text-lg font-bold font-heading">신청 내용 확인</h3>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-3 flex-wrap">
                  <span className="text-[hsl(var(--text-secondary))]">상담사</span>
                  <span className="font-bold">{selectedReservation.counselorName}</span>
                </div>
                <div className="flex justify-between gap-3 flex-wrap tabular-nums">
                  <span className="text-[hsl(var(--text-secondary))]">예약 시각</span>
                  <span>{new Date(selectedReservation.startAt).toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex justify-between gap-3 flex-wrap tabular-nums">
                  <span className="text-[hsl(var(--text-secondary))]">결제 금액</span>
                  <span>{selectedReservation.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between gap-3 flex-wrap tabular-nums">
                  <span className="text-[hsl(var(--text-secondary))]">환불 예상 금액</span>
                  <span className="font-bold text-[hsl(var(--gold))]">
                    {estimatedRefund.toLocaleString()}원
                  </span>
                </div>
                <div className="mt-2 pt-3 border-t border-[hsl(var(--border-subtle))]">
                  <div className="text-[hsl(var(--text-secondary))] mb-2">환불 사유</div>
                  <div className="whitespace-pre-wrap p-3 bg-[hsl(var(--surface))] rounded-lg">
                    {reason}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex-1 border-2 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold))] rounded-full px-6 py-2 text-sm hover:bg-[hsl(var(--gold)/0.1)] bg-transparent cursor-pointer font-heading font-bold disabled:opacity-50"
              >
                이전
              </button>
              <ActionButton type="submit" loading={loading} disabled={loading} className="flex-1">
                환불 신청
              </ActionButton>
            </div>
          </form>
        )}
      </main>
    </RequireLogin>
  );
}
