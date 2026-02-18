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
        <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-md)' }}>
          <PageTitle>정산 관리</PageTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <PageTitle>정산 관리</PageTitle>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="전체" value={`${summary.total}건`} />
          <StatCard title="대기" value={`${summary.pending}건`} hint="확정 필요" />
          <StatCard title="확정" value={`${summary.confirmed}건`} hint="지급 필요" />
          <StatCard title="지급 완료" value={`${summary.paid}건`} />
          <StatCard title="총 정산액" value={formatCurrency(summary.totalAmount)} />
        </div>

        {/* Filters */}
        <Card>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-card)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-on-card)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-sm)',
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
              ))}
            </select>

            <input
              placeholder="상담사 이름"
              value={counselorFilter}
              onChange={(e) => { setCounselorFilter(e.target.value); setPage(1); }}
              style={{
                padding: '6px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-card)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-on-card)',
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-sm)',
              }}
            />

            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted-card)' }}>
              시작
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  marginLeft: '4px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-card)',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-on-card)',
                  fontSize: 'var(--font-size-sm)',
                }}
              />
            </label>

            <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted-card)' }}>
              종료
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  marginLeft: '4px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-card)',
                  background: 'var(--color-bg-card)',
                  color: 'var(--color-text-on-card)',
                  fontSize: 'var(--font-size-sm)',
                }}
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
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">ID</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">상담사</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">고객</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">정산액</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">상태</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">생성일</TableHead>
                  <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell
                      className="font-mono text-sm cursor-pointer hover:underline"
                      style={{ color: 'var(--color-gold)' }}
                      onClick={() => setSelectedSettlement(s)}
                    >
                      #{s.id}
                    </TableCell>
                    <TableCell className="font-medium">{s.counselorName}</TableCell>
                    <TableCell className="text-[var(--color-text-muted-card)]">{s.customerName}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(s.counselorAmount)}</TableCell>
                    <TableCell><StatusBadge value={s.status} /></TableCell>
                    <TableCell className="text-[var(--color-text-muted-card)]">{formatDate(s.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                        {s.status === 'PENDING' && (
                          <ActionButton
                            onClick={() => setConfirmAction({ type: 'confirm', settlement: s })}
                            style={{
                              background: 'var(--color-gold)',
                              color: 'var(--color-bg-primary)',
                              fontSize: 'var(--font-size-sm)',
                              padding: '4px 12px',
                              minHeight: '28px',
                            }}
                          >
                            확정
                          </ActionButton>
                        )}
                        {s.status === 'CONFIRMED' && (
                          <ActionButton
                            onClick={() => setConfirmAction({ type: 'pay', settlement: s })}
                            style={{
                              background: 'var(--color-success)',
                              color: 'white',
                              fontSize: 'var(--font-size-sm)',
                              padding: '4px 12px',
                              minHeight: '28px',
                            }}
                          >
                            지급
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => setSelectedSettlement(s)}
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            padding: '4px 12px',
                            minHeight: '28px',
                          }}
                        >
                          상세
                        </ActionButton>
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
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', justifyContent: 'center' }}>
            <ActionButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</ActionButton>
            <span style={{ fontFamily: 'var(--font-heading)' }}>{page} / {totalPages}</span>
            <ActionButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</ActionButton>
          </div>
        )}

        {/* Detail modal */}
        <Dialog open={!!selectedSettlement} onOpenChange={(open) => { if (!open) setSelectedSettlement(null); }}>
          <DialogContent className="bg-[var(--color-bg-card)] text-[var(--color-text-on-card)] border-[var(--color-border-card)] max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg">
                정산 상세 #{selectedSettlement?.id}
              </DialogTitle>
            </DialogHeader>
            {selectedSettlement && (
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[var(--color-text-muted-card)]">상담사: </span>
                    <span className="font-bold">{selectedSettlement.counselorName}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted-card)]">고객: </span>
                    <span className="font-bold">{selectedSettlement.customerName}</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border-card)',
                    paddingTop: 'var(--spacing-sm)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">총액: </span>
                      <span className="font-bold">{formatCurrency(selectedSettlement.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">플랫폼 수수료: </span>
                      <span>{formatCurrency(selectedSettlement.platformFee)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">상담사 정산액: </span>
                      <span className="font-bold" style={{ color: 'var(--color-gold)' }}>
                        {formatCurrency(selectedSettlement.counselorAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">상태: </span>
                      <StatusBadge value={selectedSettlement.status} />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border-card)',
                    paddingTop: 'var(--spacing-sm)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">세션 ID: </span>
                      <span className="font-mono">#{selectedSettlement.sessionId}</span>
                    </div>
                    {selectedSettlement.creditsUsed != null && (
                      <div>
                        <span className="text-[var(--color-text-muted-card)]">사용 크레딧: </span>
                        <span>{selectedSettlement.creditsUsed}개</span>
                      </div>
                    )}
                    {selectedSettlement.durationMinutes != null && (
                      <div>
                        <span className="text-[var(--color-text-muted-card)]">상담 시간: </span>
                        <span>{selectedSettlement.durationMinutes}분</span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--color-border-card)',
                    paddingTop: 'var(--spacing-sm)',
                  }}
                >
                  <div className="grid grid-cols-1 gap-1">
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">생성일: </span>
                      <span>{formatDateTime(selectedSettlement.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">확정일: </span>
                      <span>{formatDateTime(selectedSettlement.confirmedAt)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-muted-card)]">지급일: </span>
                      <span>{formatDateTime(selectedSettlement.paidAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons in modal */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end', marginTop: 'var(--spacing-sm)' }}>
                  {selectedSettlement.status === 'PENDING' && (
                    <ActionButton
                      onClick={() => {
                        setConfirmAction({ type: 'confirm', settlement: selectedSettlement });
                        setSelectedSettlement(null);
                      }}
                      style={{
                        background: 'var(--color-gold)',
                        color: 'var(--color-bg-primary)',
                      }}
                    >
                      확정
                    </ActionButton>
                  )}
                  {selectedSettlement.status === 'CONFIRMED' && (
                    <ActionButton
                      onClick={() => {
                        setConfirmAction({ type: 'pay', settlement: selectedSettlement });
                        setSelectedSettlement(null);
                      }}
                      style={{
                        background: 'var(--color-success)',
                        color: 'white',
                      }}
                    >
                      지급
                    </ActionButton>
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
