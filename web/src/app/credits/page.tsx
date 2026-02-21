'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCreditBalance, purchaseCredit } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, ConfirmDialog, PageTitle } from '../../components/ui';
import { useToast } from '../../components/toast';

type CreditProduct = {
  id: number;
  name: string;
  units: number;
  duration: string;
  price: number;
  discount?: string;
};

const PRODUCTS: CreditProduct[] = [
  { id: 1, name: '상담권 1회', units: 1, duration: '30분', price: 33000 },
  { id: 2, name: '상담권 2회', units: 2, duration: '60분', price: 60000, discount: '10% 할인' },
  { id: 3, name: '상담권 3회', units: 3, duration: '90분', price: 85000, discount: '14% 할인' },
];

export default function CreditsPage() {
  const { toast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmProduct, setConfirmProduct] = useState<CreditProduct | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  async function loadCredits() {
    try {
      const data = await getCreditBalance();
      setCredits(data.remainingCredits ?? 0);
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    loadCredits();
  }, []);

  async function handlePurchase() {
    if (!confirmProduct) return;
    setPurchasing(true);
    try {
      await purchaseCredit(confirmProduct.id);
      toast(`상담권 ${confirmProduct.units}회가 충전되었습니다!`, 'success');
      setConfirmProduct(null);
      await loadCredits();
    } catch (err) {
      toast(err instanceof Error ? err.message : '구매에 실패했습니다.', 'error');
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <PageTitle>상담권 구매</PageTitle>
          <Link
            href="/credits/history"
            className="text-sm text-[#C9A227] font-medium hover:underline"
          >
            구매 내역 보기
          </Link>
        </div>

        <p className="text-[var(--color-text-muted-dark)] text-sm leading-relaxed">
          30분 단위 상담권을 구매하고 예약에 사용하세요
        </p>

        {/* Current balance */}
        {credits !== null && (
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-6">
            <div className="flex items-center justify-center gap-4 py-3">
              <span className="text-lg" aria-hidden="true">&#127915;</span>
              <span className="font-heading font-bold text-lg">
                현재 보유 상담권:
              </span>
              <span className="font-heading font-black text-3xl text-[#C9A227]">
                {credits}회
              </span>
            </div>
          </div>
        )}

        {/* Product cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {PRODUCTS.map((product) => (
            <Card key={product.id}>
              <div className="flex flex-col items-center text-center gap-4 py-4">
                {/* Discount badge */}
                {product.discount && (
                  <span className="bg-[var(--color-accent-primary)] text-white px-4 py-1 rounded-full text-xs font-bold font-heading">
                    {product.discount}
                  </span>
                )}

                {/* Product name */}
                <div className="font-heading font-bold text-xl">
                  {product.name}
                </div>

                {/* Duration */}
                <div className="text-[var(--color-text-muted-card)] text-sm">
                  {product.duration} 상담
                </div>

                {/* Price */}
                <div className="text-[#C9A227] font-heading font-black text-2xl">
                  {product.price.toLocaleString()}원
                </div>

                {/* Buy button */}
                <button
                  onClick={() => setConfirmProduct(product)}
                  disabled={purchasing}
                  className="w-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] border-none rounded-full py-3 px-8 text-base font-bold font-heading cursor-pointer min-h-[44px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  구매하기
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={!!confirmProduct}
          title="상담권 구매"
          message={
            confirmProduct
              ? `상담권 ${confirmProduct.units}회를 구매하시겠습니까? 지갑에서 ${confirmProduct.price.toLocaleString()}원이 차감됩니다.`
              : ''
          }
          confirmLabel={purchasing ? '처리 중…' : '구매하기'}
          cancelLabel="취소"
          onConfirm={handlePurchase}
          onCancel={() => { if (!purchasing) setConfirmProduct(null); }}
        />
      </main>
    </RequireLogin>
  );
}
