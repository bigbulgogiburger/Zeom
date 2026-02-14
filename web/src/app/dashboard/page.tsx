'use client';

import { useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireAdmin } from '../../components/route-guard';
import { ActionButton, Card, EmptyState, InlineError, InlineSuccess, PageTitle, StatCard } from '../../components/ui';

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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    setLoading(true);
    setMessage('');
    setSuccess('');
    const q = new URLSearchParams();
    if (from && to) {
      q.set('from', toIso(from));
      q.set('to', toIso(to));
    }

    const r = await apiFetch(`/api/v1/ops/summary${q.toString() ? `?${q.toString()}` : ''}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setLoading(false);
      return setMessage(json.message ?? '지표 조회 실패');
    }
    setSummary(json);
    setSuccess('지표를 업데이트했어요.');
    setLoading(false);
  }

  return (
    <RequireAdmin>
      <main style={{ padding: 24, display: 'grid', gap: 12 }}>
        <PageTitle>운영 대시보드</PageTitle>

        <Card>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <ActionButton onClick={load} loading={loading}>조회</ActionButton>
          </div>
          <InlineError message={message} />
          <InlineSuccess message={success} />
        </Card>

        {summary ? (
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
        ) : (
          <EmptyState title="아직 지표를 조회하지 않았어요" desc="기간을 선택하고 조회 버튼을 눌러주세요." />
        )}
      </main>
    </RequireAdmin>
  );
}
