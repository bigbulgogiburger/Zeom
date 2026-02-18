'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/components/api-client';
import { Card, PageTitle, InlineError, InlineSuccess, EmptyState, SkeletonCard, Pagination, StatusBadge } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ConsultationRecord = {
  sessionId: number;
  bookingId: number;
  customerName: string;
  startedAt: string;
  endedAt: string | null;
  durationSec: number | null;
  endReason: string | null;
  memo: string | null;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number | null): string {
  if (seconds == null) return '-';
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  }
  const m = Math.floor(seconds / 60);
  return m > 0 ? `${m}분` : `${seconds}초`;
}

export default function CounselorRecordsPage() {
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [memoSuccess, setMemoSuccess] = useState<number | null>(null);

  async function loadRecords(p: number) {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/v1/counselor/records?page=${p - 1}&size=20`, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? '상담 기록을 불러올 수 없습니다.');
        return;
      }
      const json = await res.json();
      setRecords(json.records ?? []);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setError('상담 기록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords(page);
  }, [page]);

  function handleEditMemo(record: ConsultationRecord) {
    if (editingId === record.sessionId) {
      setEditingId(null);
      return;
    }
    setEditingId(record.sessionId);
    setMemoText(record.memo ?? '');
    setMemoSuccess(null);
  }

  async function handleSaveMemo(sessionId: number) {
    setSavingMemo(true);
    setMemoSuccess(null);
    try {
      const res = await apiFetch(`/api/v1/counselor/records/${sessionId}/memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memoText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? '메모 저장에 실패했습니다.');
        return;
      }
      setRecords((prev) =>
        prev.map((r) => (r.sessionId === sessionId ? { ...r, memo: memoText } : r))
      );
      setEditingId(null);
      setMemoSuccess(sessionId);
      setTimeout(() => setMemoSuccess(null), 3000);
    } catch {
      setError('메모 저장에 실패했습니다.');
    } finally {
      setSavingMemo(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>상담 기록</PageTitle>
        <div className="flex flex-col gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>상담 기록</PageTitle>

      {error && <InlineError message={error} />}

      {records.length === 0 && !error ? (
        <EmptyState title="상담 기록이 없습니다" desc="아직 완료된 상담이 없습니다." />
      ) : (
        <div className="flex flex-col gap-4">
          {records.map((r) => (
            <Card key={r.sessionId}>
              <div className="flex flex-col gap-3">
                {/* Header: customer + date */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-heading font-bold text-base">
                    {r.customerName}
                  </span>
                  <span className="text-[var(--color-text-muted-card)] text-sm">
                    {formatDateTime(r.startedAt)}
                  </span>
                </div>

                {/* Duration + End reason */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm">
                    <span className="text-[var(--color-text-muted-card)]">소요 시간: </span>
                    <span className="font-bold">{formatDuration(r.durationSec)}</span>
                  </span>
                  {r.endReason && <StatusBadge value={r.endReason} />}
                </div>

                {/* Memo section */}
                <div className="border-t border-[var(--color-border-card)] pt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-heading font-bold text-[var(--color-accent-primary)]">메모</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-heading font-bold text-[var(--color-gold)]"
                      onClick={() => handleEditMemo(r)}
                    >
                      {editingId === r.sessionId ? '닫기' : r.memo ? '메모 수정' : '메모 작성'}
                    </Button>
                  </div>

                  {editingId === r.sessionId ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        placeholder="메모를 입력하세요..."
                        className="bg-[var(--color-bg-card)] border-[var(--color-border-card)] text-sm"
                        rows={3}
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={savingMemo}
                          onClick={() => handleSaveMemo(r.sessionId)}
                          className="bg-[var(--color-gold)] text-[var(--color-bg-primary)] font-heading font-bold hover:bg-[var(--color-gold-hover)]"
                        >
                          {savingMemo ? '저장 중...' : '저장'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--color-text-muted-card)]">
                        {r.memo || '메모 없음'}
                      </p>
                      {memoSuccess === r.sessionId && (
                        <InlineSuccess message="메모가 저장되었습니다." />
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
