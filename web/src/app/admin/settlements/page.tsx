'use client';

import { useEffect, useState, useMemo } from 'react';
import { RequireAdmin } from '@/components/route-guard';
import {
  getAllSettlements,
  confirmAdminSettlement,
  payAdminSettlement,
} from '@/components/api-client';
import {
  Card,
  PageTitle,
  StatCard,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Settlement = {
  id: number;
  sessionId: number;
  counselorId: number;
  counselorName: string;
  customerName: string;
  totalAmount: number;
  platformFee: number;
  counselorAmount: number;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  paidAt?: string;
  creditsUsed?: number;
  durationMinutes?: number;
};

const PAGE_SIZE = 15;
const STATUS_OPTIONS = ['', 'PENDING', 'CONFIRMED', 'PAID'];
const STATUS_LABELS: Record<string, string> = {
  '': '전체',
  PENDING: '대기',
  CONFIRMED: '확정',
  PAID: '지급 완료',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [counselorFilter, setCounselorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Detail modal
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);

  // Confirm dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'confirm' | 'pay';
    settlement: Settlement;
  } | null>(null);

  async function loadSettlements() {
    setLoading(true);
    setError('');
    try {
      const filters: Record<string, any> = {};
      if (statusFilter) filters.status = statusFilter;
      if (dateFrom) filters.from = new Date(dateFrom).toISOString();
      if (dateTo) filters.to = new Date(dateTo).toISOString();
      const data = await getAllSettlements(filters);
      const list: Settlement[] = Array.isArray(data) ? data : data.content || [];
      setSettlements(list);
      setPage(1);
    } catch (err: any) {
      setError(err.message || '정산 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettlements();
  }, []);

  // Client-side filtering by counselor name
  const filtered = useMemo(() => {
    let result = settlements;
    if (counselorFilter.trim()) {
      const q = counselorFilter.trim().toLowerCase();
      result = result.filter((s) => s.counselorName?.toLowerCase().includes(q));
    }
    return result;
  }, [settlements, counselorFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Summary stats
  const summary = useMemo(() => {
    let pending = 0, confirmed = 0, paid = 0, totalAmount = 0;
    for (const s of filtered) {
      if (s.status === 'PENDING') pending++;
      else if (s.status === 'CONFIRMED') confirmed++;
      else if (s.status === 'PAID') paid++;
      totalAmount += s.counselorAmount || 0;
    }
    return { pending, confirmed, paid, total: filtered.length, totalAmount };
  }, [filtered]);

  async function handleConfirm() {
    if (!confirmAction) return;
    setProcessing(true);
    setSuccess('');
    setError('');

    try {
      if (confirmAction.type === 'confirm') {
        await confirmAdminSettlement(confirmAction.settlement.id);
        setSuccess(`정산 #${confirmAction.settlement.id} 확정 완료`);
      } else {
        await payAdminSettlement(confirmAction.settlement.id);
        setSuccess(`정산 #${confirmAction.settlement.id} 지급 완료`);
      }
      setConfirmAction(null);
      await loadSettlements();
    } catch (err: any) {
      setError(err.message || '처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>정산 관리</PageTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
          <SkeletonCard lines={8} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>정산 관리</PageTitle>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <StatCard title="전체" value={`${summary.total}건`} />
          <StatCard title="대기" value={`${summary.pending}건`} hint="확정 필요" />
          <StatCard title="확정" value={`${summary.confirmed}건`} hint="지급 필요" />
          <StatCard title="지급 완료" value={`${summary.paid}건`} />
          <StatCard title="총 정산액" value={formatCurrency(summary.totalAmount)} />
        </div>

        {/* Filters */}
        <Card>
          <div className="flex gap-3 flex-wrap items-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm font-heading min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
              ))}
            </select>

            <input
              placeholder="상담사 이름"
              value={counselorFilter}
              onChange={(e) => { setCounselorFilter(e.target.value); setPage(1); }}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm font-heading min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />

            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              시작
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>

            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              종료
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>

            <ActionButton onClick={loadSettlements}>조회</ActionButton>
          </div>
        </Card>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState title="정산 내역 없음" desc="조건에 맞는 정산 내역이 없습니다." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">상담사</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">고객</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227] text-right">정산액</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">생성일</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s) => (
                  <TableRow key={s.id} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                    <TableCell
                      className="font-mono text-sm cursor-pointer hover:underline text-[#C9A227]"
                      onClick={() => setSelectedSettlement(s)}
                    >
                      #{s.id}
                    </TableCell>
                    <TableCell className="font-medium">{s.counselorName}</TableCell>
                    <TableCell className="text-[#a49484]">{s.customerName}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(s.counselorAmount)}</TableCell>
                    <TableCell><StatusBadge value={s.status} /></TableCell>
                    <TableCell className="text-[#a49484]">{formatDate(s.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {s.status === 'PENDING' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'confirm', settlement: s })}
                            className="rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] hover:from-[#b08d1f] hover:to-[#C9A227] transition-all"
                          >
                            확정
                          </button>
                        )}
                        {s.status === 'CONFIRMED' && (
                          <button
                            onClick={() => setConfirmAction({ type: 'pay', settlement: s })}
                            className="rounded-full bg-green-600 text-white text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] hover:opacity-90 transition-opacity"
                          >
                            지급
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSettlement(s)}
                          className="rounded-full border-2 border-[#C9A227]/30 text-[#C9A227] text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] bg-transparent hover:bg-[#C9A227]/10 transition-colors"
                        >
                          상세
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
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
        )}

        {/* Detail modal */}
        <Dialog open={!!selectedSettlement} onOpenChange={(open) => { if (!open) setSelectedSettlement(null); }}>
          <DialogContent className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl text-[#f9f5ed] max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg text-[#f9f5ed]">
                정산 상세 #{selectedSettlement?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedSettlement && (
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#a49484]">상담사: </span>
                    <span className="font-bold text-[#f9f5ed]">{selectedSettlement.counselorName}</span>
                  </div>
                  <div>
                    <span className="text-[#a49484]">고객: </span>
                    <span className="font-bold text-[#f9f5ed]">{selectedSettlement.customerName}</span>
                  </div>
                </div>

                <div className="border-t border-[rgba(201,162,39,0.15)] pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#a49484]">총액: </span>
                      <span className="font-bold text-[#f9f5ed]">{formatCurrency(selectedSettlement.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[#a49484]">플랫폼 수수료: </span>
                      <span className="text-[#f9f5ed]">{formatCurrency(selectedSettlement.platformFee)}</span>
                    </div>
                    <div>
                      <span className="text-[#a49484]">상담사 정산액: </span>
                      <span className="font-bold text-[#C9A227]">
                        {formatCurrency(selectedSettlement.counselorAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#a49484]">상태: </span>
                      <StatusBadge value={selectedSettlement.status} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[rgba(201,162,39,0.15)] pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#a49484]">세션 ID: </span>
                      <span className="font-mono text-[#f9f5ed]">#{selectedSettlement.sessionId}</span>
                    </div>
                    {selectedSettlement.creditsUsed != null && (
                      <div>
                        <span className="text-[#a49484]">사용 크레딧: </span>
                        <span className="text-[#f9f5ed]">{selectedSettlement.creditsUsed}개</span>
                      </div>
                    )}
                    {selectedSettlement.durationMinutes != null && (
                      <div>
                        <span className="text-[#a49484]">상담 시간: </span>
                        <span className="text-[#f9f5ed]">{selectedSettlement.durationMinutes}분</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-[rgba(201,162,39,0.15)] pt-3">
                  <div className="grid grid-cols-1 gap-1">
                    <div>
                      <span className="text-[#a49484]">생성일: </span>
                      <span className="text-[#f9f5ed]">{formatDateTime(selectedSettlement.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[#a49484]">확정일: </span>
                      <span className="text-[#f9f5ed]">{formatDateTime(selectedSettlement.confirmedAt)}</span>
                    </div>
                    <div>
                      <span className="text-[#a49484]">지급일: </span>
                      <span className="text-[#f9f5ed]">{formatDateTime(selectedSettlement.paidAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons in modal */}
                <div className="flex gap-3 justify-end mt-2">
                  {selectedSettlement.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setConfirmAction({ type: 'confirm', settlement: selectedSettlement });
                        setSelectedSettlement(null);
                      }}
                      className="rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading px-6 py-2.5 hover:from-[#b08d1f] hover:to-[#C9A227] transition-all"
                    >
                      확정
                    </button>
                  )}
                  {selectedSettlement.status === 'CONFIRMED' && (
                    <button
                      onClick={() => {
                        setConfirmAction({ type: 'pay', settlement: selectedSettlement });
                        setSelectedSettlement(null);
                      }}
                      className="rounded-full bg-green-600 text-white font-bold font-heading px-6 py-2.5 hover:opacity-90 transition-opacity"
                    >
                      지급
                    </button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm/Pay dialog */}
        <ConfirmDialog
          open={!!confirmAction}
          title={confirmAction?.type === 'confirm' ? '정산 확정' : '정산 지급'}
          message={confirmAction
            ? confirmAction.type === 'confirm'
              ? `정산 #${confirmAction.settlement.id}을 확정하시겠습니까?\n상담사: ${confirmAction.settlement.counselorName}\n정산액: ${formatCurrency(confirmAction.settlement.counselorAmount)}`
              : `정산 #${confirmAction.settlement.id}을 지급 처리하시겠습니까?\n상담사: ${confirmAction.settlement.counselorName}\n지급액: ${formatCurrency(confirmAction.settlement.counselorAmount)}`
            : ''
          }
          confirmLabel={processing ? '처리 중...' : confirmAction?.type === 'confirm' ? '확정' : '지급'}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      </main>
    </RequireAdmin>
  );
}
