'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle, StatusBadge } from '../../../components/ui';

type Booking = {
  id: number;
  counselorName: string;
  counselorId: number;
  slotId: number;
  startAt: string;
  endAt: string;
  status: string;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const r = await apiFetch('/api/v1/bookings/me', { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setMessage(json.message ?? '조회 실패');
      return;
    }
    setBookings(json);
  }

  useEffect(() => {
    load().catch(() => setMessage('조회 실패'));
  }, []);

  async function cancelBooking(id: number) {
    const r = await apiFetch(`/api/v1/bookings/${id}/cancel`, { method: 'POST' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '취소 실패');

    setMessage('예약이 취소되었습니다.');
    await load();
  }

  return (
    <RequireLogin>
      <main style={{ padding: 24, display: 'grid', gap: 12 }}>
        <PageTitle>내 예약</PageTitle>
        <InlineError message={message} />

        {bookings.length === 0 ? (
          <EmptyState title="예약 내역이 없어요" desc="상담사 상세에서 슬롯을 예약해보세요." />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {bookings.map((b) => (
              <Card key={b.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <b>{b.counselorName}</b>
                  <StatusBadge value={b.status} />
                </div>
                <div style={{ marginTop: 8, color: '#cbd5e1' }}>
                  {new Date(b.startAt).toLocaleString('ko-KR')} ~ {new Date(b.endAt).toLocaleTimeString('ko-KR')}
                </div>
                {b.status === 'BOOKED' && (
                  <button onClick={() => cancelBooking(b.id)} style={{ marginTop: 10, minHeight: 40, padding: '0 12px' }}>
                    예약 취소
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
