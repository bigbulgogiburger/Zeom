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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <PageTitle>내 지갑</PageTitle>
        <InlineError message={message} />

        {/* Balance Card */}
        {wallet && (
          <Card>
            <div style={{ textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
              <div style={{
                color: 'var(--color-gold)',
                fontSize: 'var(--font-size-sm)',
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'var(--font-heading)',
              }}>
                현재 잔액
              </div>
              <div style={{
                fontSize: 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-black)',
                color: 'var(--color-gold)',
                marginBottom: 'var(--spacing-lg)',
                fontFamily: 'var(--font-heading)',
              }}>
                {(wallet.balanceCash ?? wallet.balance ?? 0).toLocaleString()}원
              </div>
              <button
                onClick={() => router.push('/cash/buy')}
                style={{
                  background: 'var(--color-gold)',
                  color: 'var(--color-bg-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md) var(--spacing-xl)',
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-bold)',
                  cursor: 'pointer',
                  minHeight: '44px',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                💳 충전하기
              </button>
            </div>
          </Card>
        )}

        {/* Transaction History */}
        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            marginBottom: 'var(--spacing-md)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-weight-bold)',
          }}>
            거래 내역
          </h3>
          {loading ? (
            <Card>
              <div style={{
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--color-text-muted-card)',
              }}>
                불러오는 중...
              </div>
            </Card>
          ) : transactions.length === 0 ? (
            <EmptyState title="거래 내역이 없습니다" desc="지갑을 충전하여 상담 서비스를 이용해보세요." />
          ) : (
            <>
              <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
                {transactions.map((t) => (
                  <Card key={t.id}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-md)',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{
                          display: 'flex',
                          gap: 'var(--spacing-sm)',
                          alignItems: 'center',
                          marginBottom: 'var(--spacing-xs)',
                        }}>
                          <StatusBadge value={t.type} />
                          <span style={{
                            fontWeight: 'var(--font-weight-bold)',
                            fontFamily: 'var(--font-heading)',
                          }}>
                            {getTransactionTypeLabel(t.type)}
                          </span>
                        </div>
                        {t.refType && (
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-muted-card)',
                            marginTop: 'var(--spacing-xs)',
                          }}>
                            {t.refType}{t.refId ? ` #${t.refId}` : ''}
                          </div>
                        )}
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted-card)',
                          marginTop: 'var(--spacing-sm)',
                        }}>
                          {new Date(t.createdAt).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontSize: 'var(--font-size-lg)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: t.type === 'CHARGE' || t.type === 'REFUND'
                            ? 'var(--color-success)'
                            : 'var(--color-danger)',
                          fontFamily: 'var(--font-heading)',
                        }}>
                          {t.type === 'CHARGE' || t.type === 'REFUND' ? '+' : '-'}
                          {Math.abs(t.amount).toLocaleString()}원
                        </div>
                        <div style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted-card)',
                          marginTop: 'var(--spacing-xs)',
                        }}>
                          잔액: {t.balanceAfter.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 'var(--spacing-sm)',
                  marginTop: 'var(--spacing-lg)',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => loadTransactions(page - 1)}
                    disabled={page === 0}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      opacity: page === 0 ? 0.6 : 1,
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ← 이전
                  </button>
                  <span style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    color: 'var(--color-text-muted-dark)',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => loadTransactions(page + 1)}
                    disabled={page >= totalPages - 1}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      opacity: page >= totalPages - 1 ? 0.6 : 1,
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    다음 →
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
