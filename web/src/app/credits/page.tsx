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
      setCredits(data.remaining ?? data.balance ?? 0);
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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <PageTitle>상담권 구매</PageTitle>
          <Link
            href="/credits/history"
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-gold)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            구매 내역 보기 →
          </Link>
        </div>

        <p style={{
          color: 'var(--color-text-muted-dark)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: 'var(--line-height-normal)',
        }}>
          30분 단위 상담권을 구매하고 예약에 사용하세요
        </p>

        {/* Current balance */}
        {credits !== null && (
          <Card>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
            }}>
              <span style={{ fontSize: 'var(--font-size-lg)' }} aria-hidden="true">🎫</span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-bold)',
                fontSize: 'var(--font-size-lg)',
              }}>
                현재 보유 상담권:
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-black)',
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-gold)',
              }}>
                {credits}회
              </span>
            </div>
          </Card>
        )}

        {/* Product cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--spacing-lg)',
        }}>
          {PRODUCTS.map((product) => (
            <Card key={product.id}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) 0',
              }}>
                {/* Discount badge */}
                {product.discount && (
                  <span style={{
                    background: 'var(--color-accent-primary)',
                    color: '#fff',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-bold)',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    {product.discount}
                  </span>
                )}

                {/* Product name */}
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-xl)',
                }}>
                  {product.name}
                </div>

                {/* Duration */}
                <div style={{
                  color: 'var(--color-text-muted-card)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                  {product.duration} 상담
                </div>

                {/* Price */}
                <div style={{
                  color: 'var(--color-gold)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 'var(--font-weight-black)',
                  fontSize: 'var(--font-size-2xl)',
                }}>
                  {product.price.toLocaleString()}원
                </div>

                {/* Buy button */}
                <button
                  onClick={() => setConfirmProduct(product)}
                  disabled={purchasing}
                  style={{
                    width: '100%',
                    background: 'var(--color-gold)',
                    color: 'var(--color-bg-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-bold)',
                    fontFamily: 'var(--font-heading)',
                    cursor: 'pointer',
                    minHeight: '44px',
                    transition: 'background var(--transition-fast)',
                  }}
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
