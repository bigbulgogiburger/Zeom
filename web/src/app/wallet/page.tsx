'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getWallet, getWalletTransactions, exportTransactionsCsv, getTransactionReceiptHtml } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle, StatusBadge } from '../../components/ui';

type Wallet = {
  id: number;
  userId: number;
  balance: number;
  balanceCash: number;
};

type Transaction = {
  id: number;
  type: string;
  amount: number;
  balanceAfter: number;
  refType: string;
  refId: number;
  createdAt: string;
};

type TransactionPage = {
  content: Transaction[];
  totalPages: number;
  totalElements: number;
  number: number;
};

type FilterType = '' | 'CHARGE' | 'CONFIRM' | 'REFUND';
type PeriodPreset = '1w' | '1m' | '3m' | 'custom';

function getDateRange(preset: PeriodPreset): { from: string; to: string } | null {
  if (preset === 'custom') return null;
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case '1w':
      from.setDate(from.getDate() - 7);
      break;
    case '1m':
      from.setMonth(from.getMonth() - 1);
      break;
    case '3m':
      from.setMonth(from.getMonth() - 3);
      break;
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('1m');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [periodTotal, setPeriodTotal] = useState<number | null>(null);
  const [csvExporting, setCsvExporting] = useState(false);

  async function loadWallet() {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch {
      setMessage('지갑 정보를 불러오지 못했습니다.');
    }
  }

  const getFilters = useCallback(() => {
    const filters: { type?: string; from?: string; to?: string } = {};
    if (filterType) filters.type = filterType;

    if (periodPreset === 'custom') {
      if (customFrom) filters.from = customFrom;
      if (customTo) filters.to = customTo;
    } else {
      const range = getDateRange(periodPreset);
      if (range) {
        filters.from = range.from;
        filters.to = range.to;
      }
    }
    return filters;
  }, [filterType, periodPreset, customFrom, customTo]);

  const loadTransactions = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const filters = getFilters();
      const data: TransactionPage = await getWalletTransactions(pageNum, 20, filters);
      setTransactions(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);

      // Calculate period total
      const total = data.content.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      setPeriodTotal(total);
    } catch {
      setMessage('거래 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getFilters]);

  useEffect(() => {
    loadWallet();
    loadTransactions(0);
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    loadTransactions(0);
  }, [filterType, periodPreset, customFrom, customTo, loadTransactions]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'CHARGE': return '충전';
      case 'CONFIRM': return '사용';
      case 'USE': return '사용';
      case 'REFUND': return '환불';
      default: return type;
    }
  };

  async function handleCsvExport() {
    setCsvExporting(true);
    try {
      const filters = getFilters();
      const blob = await exportTransactionsCsv(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage('CSV 내보내기에 실패했습니다.');
    } finally {
      setCsvExporting(false);
    }
  }

  async function handleReceiptDownload(txId: number) {
    try {
      const blob = await getTransactionReceiptHtml(txId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${txId}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage('영수증 다운로드에 실패했습니다.');
    }
  }

  const filterTabs: { label: string; value: FilterType }[] = [
    { label: '전체', value: '' },
    { label: '충전', value: 'CHARGE' },
    { label: '사용', value: 'CONFIRM' },
    { label: '환불', value: 'REFUND' },
  ];

  const periodTabs: { label: string; value: PeriodPreset }[] = [
    { label: '1주', value: '1w' },
    { label: '1개월', value: '1m' },
    { label: '3개월', value: '3m' },
    { label: '직접입력', value: 'custom' },
  ];

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>내 지갑</PageTitle>
        <InlineError message={message} />

        {/* Balance Card */}
        {wallet && (
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-10 text-center max-w-[520px] mx-auto">
            <div className="text-center py-4">
              <div className="text-[#C9A227] text-sm mb-3 font-bold font-heading tracking-wide">
                현재 잔액
              </div>
              <div className="text-5xl font-black text-[#C9A227] mb-8 font-heading">
                {(wallet.balanceCash ?? wallet.balance ?? 0).toLocaleString()}원
              </div>
              <button
                onClick={() => router.push('/cash/buy')}
                className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] rounded-full px-10 py-3.5 font-bold text-base cursor-pointer min-h-[48px] font-heading border-none hover:shadow-[0_4px_20px_rgba(201,162,39,0.2)] transition-all"
              >
                충전하기
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div>
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h3 className="text-xl font-heading font-bold text-[var(--color-text-on-dark)]">
              거래 내역
            </h3>
            <button
              onClick={handleCsvExport}
              disabled={csvExporting}
              className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-5 py-2 text-sm hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent font-heading"
            >
              {csvExporting ? '내보내는 중...' : 'CSV 내보내기'}
            </button>
          </div>

          {/* Filter Tabs - Transaction Type */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilterType(tab.value)}
                className={`rounded-full px-5 py-2 text-sm font-heading border-2 transition-all ${
                  filterType === tab.value
                    ? 'bg-[#C9A227] text-[#0f0d0a] border-[#C9A227] font-bold'
                    : 'bg-transparent text-[#C9A227] border-[#C9A227]/30 hover:bg-[#C9A227]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Period Selection */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            {periodTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setPeriodPreset(tab.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-heading border transition-all ${
                  periodPreset === tab.value
                    ? 'bg-[#C9A227]/20 text-[#C9A227] border-[#C9A227]/50 font-bold'
                    : 'bg-transparent text-[var(--color-text-muted-dark)] border-[rgba(201,162,39,0.15)] hover:bg-[#C9A227]/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {periodPreset === 'custom' && (
              <div className="flex gap-2 items-center ml-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-black/30 border border-[rgba(201,162,39,0.2)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-on-dark)]"
                />
                <span className="text-[var(--color-text-muted-dark)] text-xs">~</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-black/30 border border-[rgba(201,162,39,0.2)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-on-dark)]"
                />
              </div>
            )}
          </div>

          {/* Period Total */}
          {periodTotal !== null && transactions.length > 0 && (
            <div className="bg-black/20 border border-[rgba(201,162,39,0.1)] rounded-xl px-6 py-3 mb-6 flex justify-between items-center">
              <span className="text-sm text-[var(--color-text-muted-dark)]">
                선택 기간 합계
              </span>
              <span className={`text-lg font-bold font-heading ${
                periodTotal >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
              }`}>
                {periodTotal >= 0 ? '+' : ''}{periodTotal.toLocaleString()}원
              </span>
            </div>
          )}

          {loading ? (
            <Card>
              <div className="text-center py-8 text-[var(--color-text-muted-card)]">
                불러오는 중...
              </div>
            </Card>
          ) : transactions.length === 0 ? (
            <EmptyState title="거래 내역이 없습니다" desc="지갑을 충전하여 상담 서비스를 이용해보세요." />
          ) : (
            <>
              <div className="grid gap-5">
                {transactions.map((t) => (
                  <Card key={t.id}>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex gap-2 items-center mb-1">
                          <StatusBadge value={t.type} />
                          <span className="font-bold font-heading">
                            {getTransactionTypeLabel(t.type)}
                          </span>
                        </div>
                        {t.refType && (
                          <div className="text-sm text-[var(--color-text-muted-card)] mt-1">
                            {t.refType}{t.refId ? ` #${t.refId}` : ''}
                          </div>
                        )}
                        <div className="text-xs text-[var(--color-text-muted-card)] mt-2">
                          {new Date(t.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div className="text-right flex items-start gap-3">
                        <div>
                          <div className={`text-lg font-bold font-heading ${
                            t.type === 'CHARGE' || t.type === 'REFUND'
                              ? 'text-[var(--color-success)]'
                              : 'text-[var(--color-danger)]'
                          }`}>
                            {t.type === 'CHARGE' || t.type === 'REFUND' ? '+' : '-'}
                            {Math.abs(t.amount).toLocaleString()}원
                          </div>
                          <div className="text-xs text-[var(--color-text-muted-card)] mt-1">
                            잔액: {t.balanceAfter.toLocaleString()}원
                          </div>
                        </div>
                        <button
                          onClick={() => handleReceiptDownload(t.id)}
                          title="영수증 다운로드"
                          className="bg-transparent border border-[rgba(201,162,39,0.2)] rounded-lg p-2 text-[#C9A227] hover:bg-[#C9A227]/10 transition-all cursor-pointer flex-shrink-0"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6 flex-wrap">
                  <button
                    onClick={() => loadTransactions(page - 1)}
                    disabled={page === 0}
                    className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <span className="px-6 py-2 text-[var(--color-text-muted-dark)] flex items-center">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadTransactions(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </RequireLogin>
  );
}
