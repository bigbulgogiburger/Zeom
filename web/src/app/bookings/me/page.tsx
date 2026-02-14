'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';

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
    <main style={{ padding: 24 }}>
      <h2>내 예약</h2>
      {message && <p>{message}</p>}
      <ul style={{ display: 'grid', gap: 10, listStyle: 'none', padding: 0 }}>
        {bookings.map((b) => (
          <li key={b.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
            <div>{b.counselorName}</div>
            <div>{new Date(b.startAt).toLocaleString('ko-KR')} ~ {new Date(b.endAt).toLocaleTimeString('ko-KR')}</div>
            <div>상태: {b.status}</div>
            {b.status === 'BOOKED' && (
              <button onClick={() => cancelBooking(b.id)} style={{ marginTop: 8 }}>
                예약 취소
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
    </RequireLogin>
  );
}
