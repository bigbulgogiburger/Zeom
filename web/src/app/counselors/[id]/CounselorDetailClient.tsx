'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '../../../components/api';

type Slot = { id: number; startAt: string; endAt: string };
type CounselorDetail = { id: number; name: string; specialty: string; intro: string; slots: Slot[] };

export default function CounselorDetailClient({ id }: { id: string }) {
  const [counselor, setCounselor] = useState<CounselorDetail | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/counselors/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setCounselor)
      .catch(() => setMessage('상담사 정보를 불러오지 못했습니다.'));
  }, [id]);

  async function book(slotId: number) {
    const token = localStorage.getItem('accessToken');
    if (!token) return setMessage('로그인 후 예약해주세요.');

    const res = await fetch(`${API_BASE}/api/v1/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ counselorId: Number(id), slotId }),
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.message ?? '예약 실패');

    setMessage('예약 완료! 내 예약에서 확인하세요.');
    setCounselor((prev) =>
      prev ? { ...prev, slots: prev.slots.filter((s) => s.id !== slotId) } : prev
    );
  }

  if (!counselor) return <main style={{ padding: 24 }}>불러오는 중...</main>;

  return (
    <main style={{ padding: 24 }}>
      <h2>{counselor.name}</h2>
      <p>{counselor.specialty}</p>
      <p>{counselor.intro}</p>

      <h3>예약 가능 슬롯</h3>
      <ul style={{ display: 'grid', gap: 10, listStyle: 'none', padding: 0 }}>
        {counselor.slots.map((s) => (
          <li key={s.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
            <div>
              {new Date(s.startAt).toLocaleString('ko-KR')} ~ {new Date(s.endAt).toLocaleTimeString('ko-KR')}
            </div>
            <button onClick={() => book(s.id)} style={{ marginTop: 8 }}>이 슬롯 예약하기</button>
          </li>
        ))}
      </ul>
      <p>{message}</p>
    </main>
  );
}
