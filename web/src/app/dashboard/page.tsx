'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireAdmin } from '../../components/route-guard';
import { ActionButton, Card, EmptyState, StatCard } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 16);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 16);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

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

  useEffect(() => {
    load().catch(() => {
      setMessage('지표 조회 실패');
      setLoading(false);
    });
  }, []);

  return (
    <RequireAdmin>
      <main className="page-container-wide">
        <h1 className="text-2xl font-bold font-heading text-foreground">운영 대시보드</h1>

        <Card className="mt-4">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div className="grid gap-1">
              <Label className="text-sm font-medium">시작</Label>
              <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm font-medium">종료</Label>
              <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <ActionButton onClick={load} loading={loading}>조회</ActionButton>
          </div>
          <div className="mt-2">
            {message && (
              <Alert variant="destructive" className="mb-2">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mb-2">
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {loading && !summary ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mt-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="skeleton h-[100px]" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 mt-4">
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
