'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '../../../components/api';

type Booking = {
  id: number;
  counselorName: string;
  startAt: string;
  endAt: string;
  status: string;
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return setMessage('로그인이 필요합니다.');

    fetch(`${API_BASE}/api/v1/bookings/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setMessage(json.message ?? '조회 실패');
          return;
        }
        setBookings(json);
      })
      .catch(() => setMessage('조회 실패'));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h2>내 예약</h2>
      {message && <p>{message}</p>}
      <ul style={{ display: 'grid', gap: 10, listStyle: 'none', padding: 0 }}>
        {bookings.map((b) => (
          <li key={b.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
            <div>{b.counselorName}</div>
            <div>{new Date(b.startAt).toLocaleString('ko-KR')} ~ {new Date(b.endAt).toLocaleTimeString('ko-KR')}</div>
            <div>상태: {b.status}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
