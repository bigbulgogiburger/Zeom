'use client';

import { useEffect, useState } from 'react';
import {
  getCounselorDashboard,
  getCounselorPortalSettlement,
  requestCounselorSettlement,
  getCounselorBankAccount,
  registerCounselorBankAccount,
  updateCounselorBankAccount,
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

type BankAccount = {
  id: number;
  counselorId: number;
  bankCode: string;
  accountNumberMasked: string;
  holderName: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string | null;
};

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<string, string> = {
  PENDING: '대기',
  REQUESTED: '요청됨',
  CONFIRMED: '확정됨',
  PAID: '지급완료',
};

const BANK_CODES: { code: string; name: string }[] = [
  { code: '004', name: 'KB국민은행' },
  { code: '011', name: 'NH농협은행' },
  { code: '020', name: '우리은행' },
  { code: '081', name: '하나은행' },
  { code: '088', name: '신한은행' },
  { code: '003', name: 'IBK기업은행' },
  { code: '023', name: 'SC제일은행' },
  { code: '027', name: '한국씨티은행' },
  { code: '032', name: '부산은행' },
  { code: '034', name: '광주은행' },
  { code: '035', name: '제주은행' },
  { code: '037', name: '전북은행' },
  { code: '039', name: '경남은행' },
  { code: '045', name: '새마을금고' },
  { code: '048', name: '신협' },
  { code: '071', name: '우체국' },
  { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' },
  { code: '089', name: '케이뱅크' },
];

function getBankName(code: string): string {
  return BANK_CODES.find((b) => b.code === code)?.name || code;
}

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

  // Bank account state
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankAccountLoading, setBankAccountLoading] = useState(true);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankCode, setBankCode] = useState('004');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [bankError, setBankError] = useState('');
  const [bankSuccess, setBankSuccess] = useState('');
  const [bankSaving, setBankSaving] = useState(false);

  useEffect(() => {
    loadData();
    loadBankAccount();
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

  async function loadBankAccount() {
    setBankAccountLoading(true);
    try {
      const data = await getCounselorBankAccount();
      setBankAccount(data);
    } catch {
      // No account registered or error
      setBankAccount(null);
    } finally {
      setBankAccountLoading(false);
    }
  }

  async function handleBankAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBankError('');
    setBankSuccess('');
    setBankSaving(true);

    try {
      if (bankAccount) {
        await updateCounselorBankAccount({ bankCode, accountNumber, holderName });
        setBankSuccess('계좌 정보가 수정되었습니다.');
      } else {
        await registerCounselorBankAccount({ bankCode, accountNumber, holderName });
        setBankSuccess('계좌가 등록되었습니다.');
      }
      await loadBankAccount();
      setShowBankForm(false);
      setAccountNumber('');
    } catch (err) {
      setBankError(err instanceof Error ? err.message : '계좌 처리 중 오류가 발생했습니다.');
    } finally {
      setBankSaving(false);
    }
  }

  function handleEditBankAccount() {
    if (bankAccount) {
      setBankCode(bankAccount.bankCode);
      setHolderName(bankAccount.holderName);
      setAccountNumber('');
    }
    setShowBankForm(true);
    setBankError('');
    setBankSuccess('');
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

      {/* Bank Account Section */}
      <Card>
        <h3 className="text-lg font-heading font-bold text-[#C9A227] mb-4">
          정산 계좌
        </h3>
        {bankAccountLoading ? (
          <div className="text-sm text-[var(--color-text-muted-card)]">불러오는 중...</div>
        ) : bankAccount && !showBankForm ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm text-[var(--color-text-muted-card)] mb-1">은행</div>
                <div className="font-bold font-heading">{getBankName(bankAccount.bankCode)}</div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm text-[var(--color-text-muted-card)] mb-1">계좌번호</div>
                <div className="font-bold font-heading font-mono">{bankAccount.accountNumberMasked}</div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm text-[var(--color-text-muted-card)] mb-1">예금주</div>
                <div className="font-bold font-heading">{bankAccount.holderName}</div>
              </div>
              <button
                onClick={handleEditBankAccount}
                className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-5 py-2 text-sm hover:bg-[#C9A227]/10 bg-transparent font-heading cursor-pointer"
              >
                변경
              </button>
            </div>
            <InlineSuccess message={bankSuccess} />
          </div>
        ) : (
          <form onSubmit={handleBankAccountSubmit} className="flex flex-col gap-4">
            {!bankAccount && (
              <div className="text-sm text-[var(--color-text-muted-card)] mb-2">
                정산금을 받을 계좌를 등록해 주세요.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[var(--color-text-muted-card)] mb-1">은행</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  required
                  className="w-full border-2 border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] rounded-xl px-4 py-3 text-sm text-[var(--color-text-on-card)] font-heading"
                >
                  {BANK_CODES.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-muted-card)] mb-1">계좌번호</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9-]/g, ''))}
                  required
                  placeholder="숫자만 입력"
                  className="w-full border-2 border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] rounded-xl px-4 py-3 text-sm text-[var(--color-text-on-card)] font-heading"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-muted-card)] mb-1">예금주명</label>
                <input
                  type="text"
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  required
                  placeholder="예금주명"
                  className="w-full border-2 border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] rounded-xl px-4 py-3 text-sm text-[var(--color-text-on-card)] font-heading"
                />
              </div>
            </div>
            <InlineError message={bankError} />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={bankSaving}
                className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] rounded-full px-8 py-2.5 text-sm font-bold font-heading border-none cursor-pointer disabled:opacity-50"
              >
                {bankSaving ? '저장 중...' : (bankAccount ? '계좌 수정' : '계좌 등록')}
              </button>
              {showBankForm && bankAccount && (
                <button
                  type="button"
                  onClick={() => {
                    setShowBankForm(false);
                    setBankError('');
                  }}
                  className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm bg-transparent cursor-pointer font-heading hover:bg-[#C9A227]/10"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        )}
      </Card>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
        <div className="flex flex-col gap-6">
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
              <TableRow className="border-b border-[rgba(201,162,39,0.15)]">
                <TableHead className="font-heading font-bold text-[#C9A227]">기간</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227] text-right">상담 건수</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227] text-right">총 금액</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227] text-right">수수료율</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227] text-right">정산액</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227] text-center">상태</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227]">정산일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((s) => (
                <TableRow key={s.id} className="border-b border-[rgba(201,162,39,0.1)]">
                  <TableCell className="text-sm">{formatPeriod(s.periodStart, s.periodEnd)}</TableCell>
                  <TableCell className="text-sm text-right">{s.totalSessions}건</TableCell>
                  <TableCell className="text-sm text-right">{formatAmount(s.totalAmount)}</TableCell>
                  <TableCell className="text-sm text-right">{(s.commissionRate * 100).toFixed(0)}%</TableCell>
                  <TableCell className="text-sm text-right font-bold">{formatAmount(s.netAmount)}</TableCell>
                  <TableCell className="text-center">
                    <StatusBadge value={STATUS_LABELS[s.status] || s.status} />
                  </TableCell>
                  <TableCell className="text-sm text-[#a49484]">{formatDate(s.paidAt)}</TableCell>
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
