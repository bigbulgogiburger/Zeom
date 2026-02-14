'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '../../../components/api';
import { apiFetch } from '../../../components/api-client';
import { Card, EmptyState, InlineError, PageTitle } from '../../../components/ui';

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
    const res = await apiFetch('/api/v1/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>{counselor.name}</PageTitle>
      <Card>
        <div style={{ color: '#93c5fd', fontSize: 14 }}>{counselor.specialty}</div>
        <p style={{ color: '#cbd5e1' }}>{counselor.intro}</p>
      </Card>

      <h3 style={{ margin: 0 }}>예약 가능 슬롯</h3>
      <InlineError message={message} />

      {counselor.slots.length === 0 ? (
        <EmptyState title="현재 가능한 슬롯이 없어요" desc="다른 상담사 또는 시간대를 확인해주세요." />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {counselor.slots.map((s) => (
            <Card key={s.id}>
              <div>
                {new Date(s.startAt).toLocaleString('ko-KR')} ~ {new Date(s.endAt).toLocaleTimeString('ko-KR')}
              </div>
              <button onClick={() => book(s.id)} style={{ marginTop: 8, minHeight: 40, padding: '0 12px' }}>
                이 슬롯 예약하기
              </button>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
