'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCreditBalance, getWallet, getCashProducts, purchaseCredit } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, EmptyState, InlineError, InlineSuccess, PageTitle } from '../../../components/ui';

type CashProduct = {
  id: number;
  name: string;
  description: string;
  priceKrw: number;
  cashAmount: number;
  durationMinutes: number;
  active: boolean;
};

type PurchaseStatus = 'idle' | 'purchasing' | 'success' | 'failed';

export default function CreditBuyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const needed = searchParams.get('needed') ? parseInt(searchParams.get('needed')!, 10) : null;
  const returnTo = searchParams.get('returnTo') || '/wallet';

  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [products, setProducts] = useState<CashProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('idle');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [creditData, walletData, productData] = await Promise.all([
        getCreditBalance().catch(() => null),
        getWallet().catch(() => null),
        getCashProducts().catch(() => null),
      ]);
      if (creditData !== null) {
        setCreditBalance(creditData.balance ?? creditData.credits ?? 0);
      }
      if (walletData !== null) {
        setCashBalance(walletData.balanceCash ?? walletData.balance ?? 0);
      }
      if (productData !== null) {
        setProducts(productData.filter((p: CashProduct) => p.active));
      } else {
        setMessage('상품 목록을 불러오지 못했습니다.');
      }
    } catch {
      setMessage('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getCreditUnits(product: CashProduct): number {
    return Math.floor(product.durationMinutes / 30) || 1;
  }

  async function handlePurchase(product: CashProduct) {
    setMessage('');
    setSuccessMessage('');

    if (cashBalance !== null && cashBalance < product.priceKrw) {
      router.push(`/cash/buy?returnTo=/credits/buy${needed ? `?needed=${needed}&returnTo=${encodeURIComponent(returnTo)}` : ''}`);
      return;
    }

    setSelectedProductId(product.id);
    setPurchaseStatus('purchasing');

    try {
      await purchaseCredit(product.id);

      const [creditData, walletData] = await Promise.all([
        getCreditBalance().catch(() => null),
        getWallet().catch(() => null),
      ]);
      if (creditData !== null) {
        setCreditBalance(creditData.balance ?? creditData.credits ?? 0);
      }
      if (walletData !== null) {
        setCashBalance(walletData.balanceCash ?? walletData.balance ?? 0);
      }

      setPurchaseStatus('success');
      setSuccessMessage(`상담권 ${getCreditUnits(product)}회 구매 완료!`);

      setTimeout(() => {
        router.push(returnTo);
      }, 2000);
    } catch (error: any) {
      setPurchaseStatus('failed');
      setMessage(error.message || '상담권 구매에 실패했습니다.');
      setSelectedProductId(null);
    }
  }

  function handleRetry() {
    setMessage('');
    setSuccessMessage('');
    setSelectedProductId(null);
    setPurchaseStatus('idle');
  }

  if (purchaseStatus === 'success') {
    return (
      <RequireLogin>
        <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 grid gap-8">
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-12">
            <div className="text-center flex flex-col gap-6 items-center">
              <div className="text-6xl animate-bounce">
                &#127916;&#10024;
              </div>
              <div className="text-2xl font-black font-heading bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
                구매 완료!
              </div>
              {creditBalance !== null && (
                <div className="text-lg text-[var(--color-text-on-dark)]">
                  보유 상담권: <span className="font-bold text-[#C9A227]">
                    {creditBalance}회
                  </span>
                </div>
              )}
              <InlineSuccess message={successMessage} />
              <div className="text-sm text-[var(--color-text-muted-dark)] mt-4">
                잠시 후 이동합니다...
              </div>
            </div>
          </div>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 grid gap-8">
        <PageTitle>상담권 구매</PageTitle>
        <InlineError message={message} />
        <InlineSuccess message={successMessage} />

        {/* Needed credits notice */}
        {needed !== null && needed > 0 && (
          <div className="bg-[#C9A227]/10 border border-[#C9A227]/30 rounded-2xl p-5 text-sm text-[#C9A227] font-heading">
            예약에 필요한 상담권: <span className="font-bold">{needed}회</span>
            {creditBalance !== null && creditBalance < needed && (
              <span className="ml-2 text-[var(--color-danger)]">
                (부족: {needed - creditBalance}회)
              </span>
            )}
          </div>
        )}

        {/* Balance summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-6 text-center">
            <div className="text-sm text-[var(--color-text-muted-dark)] mb-2 font-heading">
              보유 상담권
            </div>
            <div className="text-3xl font-black text-[#C9A227] font-heading">
              {creditBalance !== null ? `${creditBalance}회` : '-'}
            </div>
          </div>
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-6 text-center">
            <div className="text-sm text-[var(--color-text-muted-dark)] mb-2 font-heading">
              보유 캐시
            </div>
            <div className="text-3xl font-black text-[#C9A227] font-heading">
              {cashBalance !== null ? `${cashBalance.toLocaleString()}원` : '-'}
            </div>
          </div>
        </div>

        {/* Failure state */}
        {purchaseStatus === 'failed' && (
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8">
            <div className="text-center flex flex-col gap-4 items-center">
              <div className="text-4xl">&#9888;&#65039;</div>
              <div className="text-lg font-bold text-[var(--color-danger)] font-heading">
                구매 실패
              </div>
              <button
                onClick={handleRetry}
                className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] px-8 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
              >
                다시 시도하기
              </button>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="bg-[#f9f5ed] border-2 border-[rgba(201,162,39,0.15)] rounded-2xl p-6 text-sm text-[var(--color-text-on-card)] leading-relaxed">
          보유한 캐시로 상담권을 구매할 수 있습니다. 상담권 1회는 30분 상담에 해당하며, 예약 시 자동으로 차감됩니다.
        </div>

        {/* Product cards */}
        {loading ? (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] rounded-2xl p-6 min-h-[180px] flex items-center justify-center">
                <div className="text-center text-[var(--color-text-muted-card)]">
                  불러오는 중...
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="이용 가능한 상품이 없습니다" desc="잠시 후 다시 시도해주세요." />
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {products.map((product) => {
              const units = getCreditUnits(product);
              const insufficient = cashBalance !== null && cashBalance < product.priceKrw;

              return (
                <Card key={product.id}>
                  <div className="flex flex-col gap-4 min-h-[180px]">
                    <div>
                      <h3 className="m-0 mb-2 text-lg font-bold text-[var(--color-text-on-card)] font-heading">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="m-0 mb-2 text-sm text-[var(--color-text-muted-card)] leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2 py-4 border-t border-b border-[var(--color-border-card)]">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted-card)]">상담권</span>
                        <span className="font-bold text-[var(--color-accent-primary)] font-heading">
                          {units}회
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted-card)]">상담 시간</span>
                        <span className="font-bold text-[var(--color-accent-primary)] font-heading">
                          {product.durationMinutes}분
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="text-2xl font-black text-center mb-4 text-[#C9A227] font-heading">
                        {product.priceKrw.toLocaleString()}원
                      </div>
                      {insufficient ? (
                        <button
                          onClick={() => router.push(`/cash/buy?returnTo=/credits/buy${needed ? `?needed=${needed}&returnTo=${encodeURIComponent(returnTo)}` : ''}`)}
                          className="w-full rounded-full py-3 px-6 text-base font-bold min-h-[44px] font-heading border-2 border-[#C9A227]/30 text-[#C9A227] bg-transparent cursor-pointer hover:bg-[#C9A227]/10"
                        >
                          캐시 충전하기
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePurchase(product)}
                          disabled={selectedProductId === product.id || purchaseStatus !== 'idle'}
                          className={`w-full rounded-full py-3 px-6 text-base font-bold min-h-[44px] font-heading border-none cursor-pointer ${
                            selectedProductId === product.id || purchaseStatus !== 'idle'
                              ? 'bg-[var(--color-border-dark)] text-[var(--color-text-muted-dark)] cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a]'
                          }`}
                        >
                          {selectedProductId === product.id ? '처리 중...' : '구매하기'}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Back button */}
        <div className="mt-4">
          <button
            onClick={() => router.push(returnTo)}
            disabled={purchaseStatus === 'purchasing'}
            className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent font-heading"
          >
            돌아가기
          </button>
        </div>
      </main>
    </RequireLogin>
  );
}
