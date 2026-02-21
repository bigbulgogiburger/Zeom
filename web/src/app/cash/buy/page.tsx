'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCashProducts, chargeCash, getWallet } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, EmptyState, InlineError, InlineSuccess, PageTitle } from '../../../components/ui';

type CashProduct = {
  id: number;
  name: string;
  description: string;
  priceKrw: number;
  cashAmount: number;
  minutes: number;
};

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

type PayMethodOption = {
  id: string;
  label: string;
  icon: string;
};

const PAY_METHODS: PayMethodOption[] = [
  { id: 'CARD', label: '신용카드', icon: '💳' },
  { id: 'EASY_PAY', label: '카카오페이', icon: '🟡' },
  { id: 'EASY_PAY', label: '토스페이', icon: '🔵' },
  { id: 'EASY_PAY', label: '네이버페이', icon: '🟢' },
  { id: 'TRANSFER', label: '계좌이체', icon: '🏦' },
];

const MAX_RETRY_COUNT = 3;

export default function CashBuyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [products, setProducts] = useState<CashProduct[]>([]);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [failureReason, setFailureReason] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<number>(0);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await getCashProducts();
      setProducts(data);
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
    setFailureReason('');
    setSelectedProductId(product.id);
    setPaymentStatus('processing');

    try {
      const selectedPaymentMethod = PAY_METHODS[selectedMethod].id;
      await chargeCash(product.cashAmount, selectedPaymentMethod);

      // Refresh wallet balance
      const walletData = await getWallet();
      const balance = walletData.balanceCash ?? walletData.balance ?? 0;
      setNewBalance(balance);

      setFailureCount(0);
      setPaymentStatus('success');
      setSuccessMessage(`충전 완료! 새로운 잔액: ${balance.toLocaleString()}원`);

      setTimeout(() => {
        router.push(returnTo || '/wallet');
      }, 3000);
    } catch (error: unknown) {
      const newCount = failureCount + 1;
      setFailureCount(newCount);
      setPaymentStatus('failed');
      const reason = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.';
      setFailureReason(reason);
      setMessage(reason);
      setSelectedProductId(null);
    }
  }

  function handleRetry() {
    setMessage('');
    setSuccessMessage('');
    setFailureReason('');
    setSelectedProductId(null);
    setPaymentStatus('idle');
    setNewBalance(null);
  }

  const isRetryExhausted = failureCount >= MAX_RETRY_COUNT;

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
                {returnTo ? '잠시 후 이전 페이지로 이동합니다...' : '잠시 후 지갑 페이지로 이동합니다...'}
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
              {failureReason && (
                <div className="text-sm text-[var(--color-text-muted-dark)] max-w-[400px]">
                  {failureReason}
                </div>
              )}
              {failureCount > 1 && !isRetryExhausted && (
                <div className="text-xs text-[var(--color-text-muted-dark)]">
                  실패 횟수: {failureCount}/{MAX_RETRY_COUNT}
                </div>
              )}
              {isRetryExhausted ? (
                <div className="flex flex-col gap-3 items-center">
                  <div className="text-sm text-[var(--color-danger)] font-heading font-bold">
                    결제 시도 횟수를 초과했습니다.
                  </div>
                  <div className="text-sm text-[var(--color-text-muted-dark)]">
                    고객센터에 문의해 주세요.
                  </div>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => router.push('/wallet')}
                      className="border-2 border-[#C9A227]/30 text-[#C9A227] px-6 py-2 text-sm rounded-full bg-transparent cursor-pointer font-heading hover:bg-[#C9A227]/10"
                    >
                      지갑으로 돌아가기
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRetry}
                  className="bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] px-8 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
                >
                  다시 시도하기
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#f9f5ed] border-2 border-[rgba(201,162,39,0.15)] rounded-2xl p-6 text-sm text-[var(--color-text-on-card)] leading-relaxed">
          상담 서비스 이용을 위해 필요한 캐시를 충전하세요. 충전한 캐시는 지갑에 보관되며, 상담 예약 시 자동으로 차감됩니다.
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-base font-heading font-bold text-[var(--color-text-on-dark)] mb-4">
            결제 수단 선택
          </h3>
          <div className="flex gap-3 flex-wrap">
            {PAY_METHODS.map((method, idx) => (
              <button
                key={`${method.id}-${method.label}`}
                onClick={() => setSelectedMethod(idx)}
                disabled={paymentStatus !== 'idle' && paymentStatus !== 'failed'}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 text-sm font-heading transition-all cursor-pointer ${
                  selectedMethod === idx
                    ? 'bg-[#C9A227]/15 border-[#C9A227] text-[#C9A227] font-bold shadow-[0_0_12px_rgba(201,162,39,0.15)]'
                    : 'bg-black/20 border-[rgba(201,162,39,0.15)] text-[var(--color-text-muted-dark)] hover:border-[#C9A227]/40 hover:bg-[#C9A227]/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="text-lg">{method.icon}</span>
                <span>{method.label}</span>
              </button>
            ))}
          </div>
        </div>

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
                        {product.minutes}분
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
                      disabled={selectedProductId === product.id || paymentStatus !== 'idle' || isRetryExhausted}
                      className={`w-full rounded-full py-3 px-6 text-base font-bold min-h-[44px] font-heading border-none cursor-pointer ${
                        selectedProductId === product.id || paymentStatus !== 'idle' || isRetryExhausted
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
            disabled={paymentStatus === 'processing'}
            className="border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full px-6 py-2 text-sm hover:bg-[#C9A227]/10 disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
          >
            지갑으로 돌아가기
          </button>
        </div>

      </main>
    </RequireLogin>
  );
}
