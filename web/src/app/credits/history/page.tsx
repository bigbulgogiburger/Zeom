'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCreditHistory } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, EmptyState, PageTitle, StatusBadge } from '../../../components/ui';

type UsageItem = {
  bookingId: number | null;
  unitsUsed: number;
  usedAt: string;
};

type CreditHistoryItem = {
  id: number;
  totalUnits: number;
  remainingUnits: number;
  productId: number | null;
  purchasedAt: string;
  usages: UsageItem[];
};

type CreditHistoryResponse = {
  items: CreditHistoryItem[];
};

export default function CreditHistoryPage() {
  const [items, setItems] = useState<CreditHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadHistory() {
    setLoading(true);
    setError('');
    try {
      const data: CreditHistoryResponse = await getCreditHistory();
      setItems(data.items || []);
    } catch {
      setError('이용 내역을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <RequireLogin>
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <PageTitle>상담권 이용 내역</PageTitle>
          <Link
            href="/credits"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gold)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            ← 상담권 구매
          </Link>
        </div>

        {error && (
          <div role="alert" style={{
            color: 'var(--color-danger)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
          }}>
            {error}
          </div>
        )}

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
        ) : items.length === 0 ? (
          <EmptyState title="이용 내역이 없습니다" desc="상담권을 구매하면 내역이 표시됩니다." />
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-sm)' }}>
            {items.map((item) => (
              <Card key={item.id}>
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
                      <StatusBadge value={item.remainingUnits > 0 ? 'ACTIVE' : 'USED'} />
                      <span style={{
                        fontWeight: 'var(--font-weight-bold)',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        상담권 #{item.id}
                      </span>
                    </div>
                    {item.usages.length > 0 && (
                      <div style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-muted-card)',
                        marginTop: 'var(--spacing-xs)',
                      }}>
                        {item.usages.length}건 사용
                        {item.usages.some(u => u.bookingId) && (
                          <> (예약 #{item.usages.find(u => u.bookingId)?.bookingId})</>
                        )}
                      </div>
                    )}
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted-card)',
                      marginTop: 'var(--spacing-sm)',
                    }}>
                      구매일: {new Date(item.purchasedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                      fontFamily: 'var(--font-heading)',
                      color: item.remainingUnits > 0
                        ? 'var(--color-success)'
                        : 'var(--color-text-muted-card)',
                    }}>
                      {item.remainingUnits} / {item.totalUnits}회
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-muted-card)',
                      marginTop: 'var(--spacing-xs)',
                    }}>
                      잔여 / 전체
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
