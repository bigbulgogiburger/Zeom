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
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>감사로그</PageTitle>

        <Card>
          <div className="flex gap-3 items-end flex-wrap">
            <input
              placeholder="action (예: AUTH_LOGIN)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />
            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              시작
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>
            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              종료
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>
            <ActionButton onClick={load} loading={loading}>불러오기</ActionButton>
            <ActionButton
              onClick={downloadCsv}
              loading={loading}
              className="!bg-transparent border-2 border-[#C9A227]/30 !text-[#C9A227] hover:!bg-[#C9A227]/10"
            >
              CSV 다운로드
            </ActionButton>
          </div>
          <div className="mt-3">
            <InlineError message={message} />
            <InlineSuccess message={success} />
          </div>
        </Card>

        {paged.length === 0 ? (
          <EmptyState title="조회 결과가 없어요" desc="필터를 조정하거나 조회를 다시 시도해보세요." />
        ) : (
        <div className="grid gap-6">
          {paged.map((a) => (
            <Card key={a.id}>
              <div className="flex justify-between gap-4 flex-wrap items-center">
                <div className="font-heading font-bold">
                  <span className="text-[#C9A227]">#{a.id}</span>
                  <span className="text-[#a49484] mx-2">·</span>
                  <span className="text-sm font-normal">{new Date(a.createdAt).toLocaleString('ko-KR')}</span>
                </div>
                <StatusBadge value={a.action} />
              </div>
              <div className="mt-3 text-[#a49484] text-sm">
                user={a.userId}, target={a.targetType}:{a.targetId}
              </div>
            </Card>
          ))}
        </div>
        )}

        <div className="flex gap-4 items-center justify-center pt-2">
          <ActionButton
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="!bg-transparent border-2 border-[#C9A227] !text-[#C9A227] hover:!bg-[#C9A227]/10 !min-h-[36px] !px-5 !py-1.5"
          >
            이전
          </ActionButton>
          <span className="font-heading font-bold text-[#f9f5ed]">{page} / {totalPages}</span>
          <ActionButton
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="!bg-transparent border-2 border-[#C9A227] !text-[#C9A227] hover:!bg-[#C9A227]/10 !min-h-[36px] !px-5 !py-1.5"
          >
            다음
          </ActionButton>
        </div>
      </main>
    </RequireAdmin>
  );
}
