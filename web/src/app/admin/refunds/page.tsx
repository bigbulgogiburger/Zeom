'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
  Pagination,
  ConfirmDialog,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type RefundItem = {
  id: number;
  reservationId: number;
  userId: number;
  customerName: string;
  amount: number;
  reason: string;
  status: string;
  adminNote: string;
  createdAt: string;
};

const PAGE_SIZE = 20;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

function getElapsedTime(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 24) return `${hours}시간`;
  const days = Math.floor(hours / 24);
  return `${days}일`;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processing, setProcessing] = useState(false);

  const [actionTarget, setActionTarget] = useState<{ refund: RefundItem; action: 'approve' | 'reject' } | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const loadRefunds = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(p - 1));
      params.set('size', String(PAGE_SIZE));
      const query = params.toString();

      const res = await apiFetch(`/api/v1/admin/refunds?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '환불 목록을 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setRefunds(json.content || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      setError('환불 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRefunds(page);
  }, [page, loadRefunds]);

  async function handleAction() {
    if (!actionTarget) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/refunds/${actionTarget.refund.id}/${actionTarget.action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '처리에 실패했습니다.');
      } else {
        setSuccess(
          actionTarget.action === 'approve'
            ? `환불 #${actionTarget.refund.id}을 승인했습니다.`
            : `환불 #${actionTarget.refund.id}을 거절했습니다.`
        );
        setActionTarget(null);
        setAdminNote('');
        loadRefunds(page);
      }
    } catch {
      setError('처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading && refunds.length === 0) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>환불 관리</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>환불 관리</PageTitle>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Filters */}
        <Card>
          <div className="flex gap-3 items-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:outline-none"
            >
              <option value="">상태: 전체</option>
              <option value="REQUESTED">요청</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
            </select>
            <ActionButton onClick={() => loadRefunds(page)} loading={loading}>
              새로고침
            </ActionButton>
          </div>
        </Card>

        {refunds.length === 0 ? (
          <EmptyState title="환불 요청이 없습니다" desc="필터를 조정해보세요." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">고객명</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">금액</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">사유</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">경과</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">요청일</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds.map((r) => (
                  <TableRow key={r.id} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                    <TableCell className="font-mono text-sm">#{r.id}</TableCell>
                    <TableCell className="font-medium">{r.customerName}</TableCell>
                    <TableCell className="font-heading font-bold">{formatCurrency(r.amount)}</TableCell>
                    <TableCell className="text-[#a49484] max-w-[200px] truncate">{r.reason}</TableCell>
                    <TableCell><StatusBadge value={r.status} /></TableCell>
                    <TableCell className="text-[#a49484] font-mono text-sm">
                      {getElapsedTime(r.createdAt)}
                    </TableCell>
                    <TableCell className="text-[#a49484]">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'REQUESTED' && (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setActionTarget({ refund: r, action: 'approve' }); setAdminNote(''); }}
                            disabled={processing}
                            className="rounded-full bg-[#C9A227] text-[#0f0d0a] text-sm font-bold font-heading px-3 py-1.5 min-h-[28px] hover:bg-[#b08d1f] transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => { setActionTarget({ refund: r, action: 'reject' }); setAdminNote(''); }}
                            disabled={processing}
                            className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-3 py-1.5 min-h-[28px] hover:bg-[#6d0000] transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Action dialog */}
        {actionTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-[var(--color-bg-card)] border border-[rgba(201,162,39,0.15)] rounded-2xl p-6 max-w-[420px] w-full mx-4 space-y-4">
              <h3 className="font-heading font-bold text-lg">
                환불 {actionTarget.action === 'approve' ? '승인' : '거절'}
              </h3>
              <p className="text-[#a49484] text-sm">
                환불 #{actionTarget.refund.id} ({actionTarget.refund.customerName}) - {formatCurrency(actionTarget.refund.amount)}
              </p>
              <textarea
                placeholder="관리자 메모 (선택)"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[80px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setActionTarget(null); setAdminNote(''); }}
                  className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-5 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAction}
                  disabled={processing}
                  className={`rounded-full text-sm font-bold font-heading px-5 py-2 transition-colors disabled:opacity-50 ${
                    actionTarget.action === 'approve'
                      ? 'bg-[#C9A227] text-[#0f0d0a] hover:bg-[#b08d1f]'
                      : 'bg-[#8B0000] text-white hover:bg-[#6d0000]'
                  }`}
                >
                  {processing ? '처리 중...' : actionTarget.action === 'approve' ? '승인' : '거절'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAdmin>
  );
}
