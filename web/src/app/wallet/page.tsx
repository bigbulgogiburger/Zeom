'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWallet, getWalletTransactions } from '../../components/api-client';
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

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadWallet() {
    try {
      const data = await getWallet();
      setWallet(data);
    } catch {
      setMessage('지갑 정보를 불러오지 못했습니다.');
    }
  }

  async function loadTransactions(pageNum: number) {
    setLoading(true);
    try {
      const data: TransactionPage = await getWalletTransactions(pageNum);
      setTransactions(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch {
      setMessage('거래 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWallet();
    loadTransactions(0);
  }, []);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'CHARGE': return '충전';
      case 'USE': return '사용';
      case 'REFUND': return '환불';
      default: return type;
    }
  };

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
          <h3 className="text-xl mb-6 font-heading font-bold text-[var(--color-text-on-dark)]">
            거래 내역
          </h3>
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
                      <div className="text-right">
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
