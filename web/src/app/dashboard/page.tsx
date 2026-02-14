'use client';

import { useEffect, useState } from 'react';
import { API_BASE } from '../../components/api';

type Summary = {
  users: number;
  counselors: number;
  availableSlots: number;
  booked: number;
  canceled: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/ops/summary`, { cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setMessage(json.message ?? '지표 조회 실패');
          return;
        }
        setSummary(json);
      })
      .catch(() => setMessage('지표 조회 실패'));
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h2>운영 대시보드</h2>
      {message && <p>{message}</p>}
      {summary && (
        <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
          <li>가입 유저: {summary.users}</li>
          <li>상담사 수: {summary.counselors}</li>
          <li>예약 가능 슬롯: {summary.availableSlots}</li>
          <li>예약 완료: {summary.booked}</li>
          <li>취소 완료: {summary.canceled}</li>
        </ul>
      )}
    </main>
  );
}
