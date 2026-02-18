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
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <PageTitle>상담권 이용 내역</PageTitle>
          <Link
            href="/credits"
            className="text-sm text-[#C9A227] font-medium hover:underline"
          >
            ← 상담권 구매
          </Link>
        </div>

        {error && (
          <div role="alert" className="text-[#8B0000] text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[var(--color-text-muted-card)]">
              불러오는 중...
            </div>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState title="이용 내역이 없습니다" desc="상담권을 구매하면 내역이 표시됩니다." />
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <Card key={item.id}>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2 items-center mb-1">
                      <StatusBadge value={item.remainingUnits > 0 ? 'ACTIVE' : 'USED'} />
                      <span className="font-bold font-heading">
                        상담권 #{item.id}
                      </span>
                    </div>
                    {item.usages.length > 0 && (
                      <div className="text-sm text-[var(--color-text-muted-card)] mt-1">
                        {item.usages.length}건 사용
                        {item.usages.some(u => u.bookingId) && (
                          <> (예약 #{item.usages.find(u => u.bookingId)?.bookingId})</>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-muted-card)] mt-2">
                      구매일: {new Date(item.purchasedAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold font-heading ${
                      item.remainingUnits > 0
                        ? 'text-green-500'
                        : 'text-[var(--color-text-muted-card)]'
                    }`}>
                      {item.remainingUnits} / {item.totalUnits}회
                    </div>
                    <div className="text-xs text-[var(--color-text-muted-card)] mt-1">
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
