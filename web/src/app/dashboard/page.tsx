'use client';

import { useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireAdmin } from '../../components/route-guard';

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
    <main style={{ padding: 24 }}>
      <h2>운영 대시보드</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <label>
          시작
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          종료
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button onClick={load}>조회</button>
      </div>

      {message && <p>{message}</p>}
      {summary && (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
            <li><b>[Booking]</b></li>
            <li>예약 가능 슬롯: {summary.availableSlots}</li>
            <li>예약 생성(기간): {summary.booked}</li>
            <li>예약 취소(기간): {summary.canceled}</li>
          </ul>
          <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
            <li><b>[Auth]</b></li>
            <li>로그인 성공 누적: {summary.authLogin}</li>
            <li>로그인 실패 누적: {summary.authFail}</li>
            <li>Refresh 재사용 탐지: {summary.authReuse}</li>
          </ul>
          <ul style={{ display: 'grid', gap: 8, listStyle: 'none', padding: 0 }}>
            <li><b>[Base]</b></li>
            <li>가입 유저: {summary.users}</li>
            <li>상담사 수: {summary.counselors}</li>
          </ul>
        </div>
      )}
    </main>
    </RequireAdmin>
  );
}
