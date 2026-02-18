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
        <main className="py-8 px-6 grid gap-8 max-w-[600px] mx-auto">
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-12">
            <div className="text-center flex flex-col gap-6 items-center">
              <div className="text-5xl">&#9989;</div>
              <div className="text-xl font-bold font-heading bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
                리뷰가 등록되었습니다
              </div>
              <div className="text-sm text-[var(--color-text-muted-dark)]">
                소중한 의견 감사합니다. 잠시 후 상담 내역 페이지로 이동합니다.
              </div>
            </div>
          </div>
        </main>
      </RequireLogin>
    );
  }

  if (!reservation) {
    return (
      <RequireLogin>
        <main className="py-8 px-6 grid gap-8 max-w-[600px] mx-auto">
          <PageTitle>상담 후기</PageTitle>
          <InlineError message={message} />
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              예약 정보를 불러오는 중...
            </div>
          </Card>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main className="py-8 px-6 grid gap-6 max-w-[600px] mx-auto">
        <PageTitle>상담 후기 작성</PageTitle>
        <InlineError message={message} />

        <Card>
          <div className="mb-6 p-4 bg-[#1a1612] rounded-xl">
            <div className="text-sm text-[var(--color-text-muted-card)] mb-1">
              상담 일시
            </div>
            <div className="text-base font-medium">
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
          className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm hover:bg-[#C9A227]/10 bg-transparent cursor-pointer"
        >
          나중에 작성하기
        </button>
      </main>
    </RequireLogin>
  );
}
