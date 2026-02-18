'use client';

import { useEffect, useState } from 'react';
import {
  getCounselorDashboard,
  getCounselorPortalSettlement,
  requestCounselorSettlement,
} from '@/components/api-client';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  StatCard,
  ConfirmDialog,
  SkeletonCard,
  Pagination,
  ActionButton,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Settlement = {
  id: number;
  periodStart: string;
  periodEnd: string;
  totalSessions: number;
  totalAmount: number;
  commissionRate: number;
  netAmount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type DashboardData = {
  totalEarnings: number;
  completedSessions: number;
  ratingAvg: number;
};

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  REQUESTED: '요청됨',
  CONFIRMED: '확정됨',
  PAID: '지급완료',
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatPeriod(start: string, end: string): string {
  return `${formatDate(start)} ~ ${formatDate(end)}`;
}

export default function CounselorSettlementPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSettlements(page);
  }, [page]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [dashData, settlementData] = await Promise.allSettled([
        getCounselorDashboard(),
        getCounselorPortalSettlement(0, PAGE_SIZE),
      ]);

      if (dashData.status === 'fulfilled') {
        setDashboard(dashData.value);
      }

      if (settlementData.status === 'fulfilled') {
        const data = settlementData.value;
        setSettlements(data.settlements || []);
        setTotalPages(data.totalPages || 1);
      } else {
        setError('정산 내역을 불러올 수 없습니다.');
      }
    } catch {
      setError('정산 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSettlements(p: number) {
    try {
      const data = await getCounselorPortalSettlement(p - 1, PAGE_SIZE);
      setSettlements(data.settlements || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      // keep existing data on pagination error
    }
  }

  async function handleWithdrawRequest() {
    setConfirmOpen(false);
    setRequesting(true);
    setError('');
    setSuccessMsg('');
    try {
      const result = await requestCounselorSettlement();
      setSuccessMsg(result?.message || '출금 요청이 완료되었습니다.');
      loadSettlements(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : '출금 요청 중 오류가 발생했습니다.');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>정산</PageTitle>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="총 수입"
            value={dashboard ? formatAmount(dashboard.totalEarnings) : '-'}
          />
          <StatCard
            title="완료 상담"
            value={dashboard ? `${dashboard.completedSessions}건` : '-'}
          />
          <StatCard
            title="평균 수수료율"
            value="20%"
            hint="플랫폼 수수료"
          />
        </div>
      )}

      {/* Withdraw request */}
      <div className="flex items-center gap-4 flex-wrap">
        <ActionButton
          loading={requesting}
          onClick={() => setConfirmOpen(true)}
        >
          출금 요청
        </ActionButton>
        <InlineError message={error} />
        <InlineSuccess message={successMsg} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="출금 요청"
        message="정산 가능한 금액을 출금 요청하시겠습니까? 요청 후 관리자 승인을 거쳐 지급됩니다."
        confirmLabel="요청하기"
        cancelLabel="취소"
        onConfirm={handleWithdrawRequest}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Settlement history table */}
      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      ) : settlements.length === 0 ? (
        <EmptyState
          title="정산 내역이 없습니다"
          desc="상담 완료 후 정산 내역이 여기에 표시됩니다."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--color-border-card)]">
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">기간</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">상담 건수</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">총 금액</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">수수료율</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">정산액</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-center">상태</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">정산일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.id} className="border-b border-[var(--color-border-card)]/30">
                  <TableCell className="text-sm">{formatPeriod(s.periodStart, s.periodEnd)}</TableCell>
                  <TableCell className="text-sm text-right">{s.totalSessions}건</TableCell>
                  <TableCell className="text-sm text-right">{formatAmount(s.totalAmount)}</TableCell>
                  <TableCell className="text-sm text-right">{(s.commissionRate * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-sm text-right font-bold">{formatAmount(s.netAmount)}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge value={STATUS_LABELS[s.status] || s.status} />
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-text-muted-card)]">{formatDate(s.paidAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
