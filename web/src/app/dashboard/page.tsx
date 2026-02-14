'use client';

import { useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireAdmin } from '../../components/route-guard';
import { Card, StatCard } from '../../components/ui';

type Summary = {
  users: number;
  counselors: number;
  availableSlots: number;
  booked: number;
  canceled: number;
  authLogin: number;
  authFail: number;
  authReuse: number;
};

function toIso(dateTimeLocal: string) {
  if (!dateTimeLocal) return '';
  return new Date(dateTimeLocal).toISOString();
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    setMessage('');
    const q = new URLSearchParams();
    if (from && to) {
      q.set('from', toIso(from));
      q.set('to', toIso(to));
    }

    const r = await apiFetch(`/api/v1/ops/summary${q.toString() ? `?${q.toString()}` : ''}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '지표 조회 실패');
    setSummary(json);
  }

  return (
    <RequireAdmin>
      <main style={{ padding: 24, display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>운영 대시보드</h2>

        <Card>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <button onClick={load}>조회</button>
          </div>
          {message && <p style={{ marginBottom: 0 }}>{message}</p>}
        </Card>

        {summary && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              <StatCard title="예약 가능 슬롯" value={summary.availableSlots} hint="Booking" />
              <StatCard title="예약 생성" value={summary.booked} hint="기간 기준" />
              <StatCard title="예약 취소" value={summary.canceled} hint="기간 기준" />
              <StatCard title="로그인 성공" value={summary.authLogin} hint="Auth 누적" />
              <StatCard title="로그인 실패" value={summary.authFail} hint="Auth 누적" />
              <StatCard title="Refresh 재사용" value={summary.authReuse} hint="보안 이벤트" />
              <StatCard title="가입 유저" value={summary.users} hint="Base" />
              <StatCard title="상담사 수" value={summary.counselors} hint="Base" />
            </div>
          </>
        )}
      </main>
    </RequireAdmin>
  );
}
