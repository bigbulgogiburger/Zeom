'use client';

import { useMemo, useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { RequireAdmin } from '../../../components/route-guard';
import { ActionButton, Card, EmptyState, InlineError, InlineSuccess, PageTitle, StatusBadge } from '../../../components/ui';

type Audit = { id: number; userId: number; action: string; targetType: string; targetId: number; createdAt: string };

function toIso(dateTimeLocal: string) {
  if (!dateTimeLocal) return '';
  return new Date(dateTimeLocal).toISOString();
}

const PAGE_SIZE = 10;

export default function AdminAuditPage() {
  const [items, setItems] = useState<Audit[]>([]);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function buildQuery() {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (from && to) {
      q.set('from', toIso(from));
      q.set('to', toIso(to));
    }
    return q.toString() ? `?${q.toString()}` : '';
  }

  async function load() {
    setLoading(true);
    setMessage('');
    setSuccess('');
    const r = await apiFetch(`/api/v1/admin/audit${buildQuery()}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setLoading(false);
      return setMessage(json.message ?? '조회 실패');
    }
    setItems(json);
    setPage(1);
    setSuccess(`조회 완료 (${json.length}건)`);
    setLoading(false);
  }

  async function downloadCsv() {
    setLoading(true);
    setMessage('');
    setSuccess('');
    const r = await apiFetch(`/api/v1/admin/audit/csv${buildQuery()}`);
    if (!r.ok) {
      setLoading(false);
      return setMessage('CSV 다운로드 실패');
    }

    const text = await r.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    setSuccess('CSV 다운로드 완료');
    setLoading(false);
  }

  const paged = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page]);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  return (
    <RequireAdmin>
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-md)' }}>
        <PageTitle>감사로그</PageTitle>

        <Card>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
            <input placeholder="action (예: AUTH_LOGIN)" value={action} onChange={(e) => setAction(e.target.value)} />
            <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <ActionButton onClick={load} loading={loading}>불러오기</ActionButton>
            <ActionButton onClick={downloadCsv} loading={loading}>CSV 다운로드</ActionButton>
          </div>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <InlineError message={message} />
            <InlineSuccess message={success} />
          </div>
        </Card>

        {paged.length === 0 ? (
          <EmptyState title="조회 결과가 없어요" desc="필터를 조정하거나 조회를 다시 시도해보세요." />
        ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {paged.map((a) => (
            <Card key={a.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <div><b style={{ fontFamily: 'var(--font-heading)' }}>#{a.id}</b> · {new Date(a.createdAt).toLocaleString('ko-KR')}</div>
                <StatusBadge value={a.action} />
              </div>
              <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-text-muted-card)', fontSize: 'var(--font-size-sm)' }}>user={a.userId}, target={a.targetType}:{a.targetId}</div>
            </Card>
          ))}
        </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <ActionButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</ActionButton>
          <span style={{ fontFamily: 'var(--font-heading)' }}>{page} / {totalPages}</span>
          <ActionButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</ActionButton>
        </div>
      </main>
    </RequireAdmin>
  );
}
