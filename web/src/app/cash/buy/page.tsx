'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as PortOne from '@portone/browser-sdk/v2';
import { getCashProducts, preparePayment, confirmPayment, getWallet } from '../../../components/api-client';
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

type PaymentStatus = 'idle' | 'preparing' | 'processing' | 'success' | 'failed';

export default function CashBuyPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CashProduct[]>([]);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getCashProducts();
      setProducts(data.filter((p: CashProduct) => p.active));
    } catch {
      setMessage('상품 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handlePurchase(product: CashProduct) {
    setMessage('');
    setSuccessMessage('');
    setSelectedProductId(product.id);
    setPaymentStatus('preparing');

    try {
      // Step 1: Prepare payment from backend
      const prepareData = await preparePayment(product.id);
      const { paymentId, storeId } = prepareData;

      // Step 2: Call PortOne payment
      setPaymentStatus('processing');
      const response = await PortOne.requestPayment({
        storeId: storeId,
        paymentId: paymentId,
        orderName: product.name,
        totalAmount: product.priceKrw,
        currency: 'KRW',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || 'channel-key-test',
        payMethod: 'CARD',
      });

      if (response?.code != null) {
        // Payment failed
        setPaymentStatus('failed');
        setMessage(`결제 실패: ${response.message || '알 수 없는 오류'}`);
        setSelectedProductId(null);
        return;
      }

      // Step 3: Confirm payment with backend
      await confirmPayment(paymentId, response.paymentId);

      // Step 4: Refresh wallet balance
      const walletData = await getWallet();
      setNewBalance(walletData.balanceCash ?? walletData.balance ?? 0);

      // Success!
      setPaymentStatus('success');
      setSuccessMessage(`충전 완료! 새로운 잔액: ${(walletData.balanceCash ?? walletData.balance ?? 0).toLocaleString()}원`);

      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/wallet');
      }, 3000);

    } catch (error: any) {
      setPaymentStatus('failed');
      setMessage(error.message || '결제 처리 중 오류가 발생했습니다.');
      setSelectedProductId(null);
    }
  }

  function handleRetry() {
    setMessage('');
    setSuccessMessage('');
    setSelectedProductId(null);
    setPaymentStatus('idle');
    setNewBalance(null);
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <RequireLogin>
        <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 grid gap-8">
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-12">
            <div className="text-center flex flex-col gap-6 items-center">
              <div className="text-6xl animate-bounce">
                &#128176;&#10024;
              </div>
              <div className="text-2xl font-black font-heading bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
                충전 완료!
              </div>
              {newBalance !== null && (
                <div className="text-lg text-[var(--color-text-on-dark)]">
                  새로운 잔액: <span className="font-bold text-[#C9A227]">
                    {newBalance.toLocaleString()}원
                  </span>
                </div>
              )}
              <div className="text-sm text-[var(--color-text-muted-dark)] mt-4">
                잠시 후 지갑 페이지로 이동합니다...
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
        <PageTitle>캐시 충전</PageTitle>
        <InlineError message={message} />
        <InlineSuccess message={successMessage} />

        {paymentStatus === 'failed' && (
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8">
            <div className="text-center flex flex-col gap-4 items-center">
              <div className="text-4xl">&#9888;&#65039;</div>
              <div className="text-lg font-bold text-[var(--color-danger)] font-heading">
                결제 실패
              </div>
              <button
                onClick={handleRetry}
                className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] px-8 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        <div className="bg-[#f9f5ed] border-2 border-[rgba(201,162,39,0.15)] rounded-2xl p-6 text-sm text-[var(--color-text-on-card)] leading-relaxed">
          상담 서비스 이용을 위해 필요한 캐시를 충전하세요. 충전한 캐시는 지갑에 보관되며, 상담 예약 시 자동으로 차감됩니다.
        </div>

        {loading || paymentStatus === 'preparing' ? (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-2 border-[rgba(201,162,39,0.15)] bg-[#f9f5ed] rounded-2xl p-6 min-h-[180px] flex items-center justify-center">
                <div className="text-center text-[var(--color-text-muted-card)]">
                  {paymentStatus === 'preparing' ? (
                    <>
                      <div className="text-4xl mb-2">&#129463;</div>
                      <div>결제 준비 중...</div>
                    </>
                  ) : (
                    '불러오는 중...'
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : paymentStatus === 'processing' ? (
          <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-12">
            <div className="text-center flex flex-col gap-4 items-center">
              <div className="text-5xl animate-spin">
                &#129463;
              </div>
              <div className="text-lg font-bold text-[#C9A227] font-heading">
                결제 처리 중...
              </div>
              <div className="text-sm text-[var(--color-text-muted-dark)]">
                잠시만 기다려 주세요
              </div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <EmptyState title="이용 가능한 상품이 없습니다" desc="잠시 후 다시 시도해주세요." />
        ) : (
          <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
            {products.map((product) => (
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
                      <span className="text-[var(--color-text-muted-card)]">상담 시간</span>
                      <span className="font-bold text-[var(--color-accent-primary)] font-heading">
                        {product.durationMinutes}분
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-muted-card)]">충전 캐시</span>
                      <span className="font-bold text-[#C9A227] font-heading">
                        {product.cashAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <div className="text-2xl font-black text-center mb-4 text-[#C9A227] font-heading">
                      {product.priceKrw.toLocaleString()}원
                    </div>
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={selectedProductId === product.id || paymentStatus !== 'idle'}
                      className={`w-full rounded-full py-3 px-6 text-base font-bold min-h-[44px] font-heading border-none cursor-pointer ${
                        selectedProductId === product.id || paymentStatus !== 'idle'
                          ? 'bg-[var(--color-border-dark)] text-[var(--color-text-muted-dark)] cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a]'
                      }`}
                    >
                      {selectedProductId === product.id ? '처리 중...' : '구매하기'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => router.push('/wallet')}
            disabled={paymentStatus === 'processing' || paymentStatus === 'preparing'}
            className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
          >
            지갑으로 돌아가기
          </button>
        </div>

      </main>
    </RequireLogin>
  );
}
