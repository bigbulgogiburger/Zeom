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
        <main style={{
          padding: 'var(--spacing-xl)',
          display: 'grid',
          gap: 'var(--spacing-lg)',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-3xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-lg)',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '4rem',
                animation: 'bounce 1s ease-in-out',
              }}>
                💰✨
              </div>
              <div style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-black)',
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-gold)',
              }}>
                충전 완료!
              </div>
              {newBalance !== null && (
                <div style={{
                  fontSize: 'var(--font-size-lg)',
                  color: 'var(--color-text-on-card)',
                }}>
                  새로운 잔액: <span style={{
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--color-gold)',
                  }}>
                    {newBalance.toLocaleString()}원
                  </span>
                </div>
              )}
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted-card)',
                marginTop: 'var(--spacing-md)',
              }}>
                잠시 후 지갑 페이지로 이동합니다...
              </div>
            </div>
          </Card>
        </main>
      </RequireLogin>
    );
  }

  return (
    <RequireLogin>
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <PageTitle>캐시 충전</PageTitle>
        <InlineError message={message} />
        <InlineSuccess message={successMessage} />

        {paymentStatus === 'failed' && (
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              alignItems: 'center',
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-danger)',
                fontFamily: 'var(--font-heading)',
              }}>
                결제 실패
              </div>
              <button
                onClick={handleRetry}
                style={{
                  background: 'var(--color-gold)',
                  color: 'var(--color-bg-primary)',
                  padding: 'var(--spacing-sm) var(--spacing-xl)',
                  fontSize: 'var(--font-size-sm)',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'var(--font-weight-bold)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                다시 시도
              </button>
            </div>
          </Card>
        )}

        <div style={{
          background: 'var(--color-bg-card)',
          border: `2px solid var(--color-border-card)`,
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-on-card)',
          lineHeight: 'var(--line-height-normal)',
        }}>
          💡 상담 서비스 이용을 위해 필요한 캐시를 충전하세요. 충전한 캐시는 지갑에 보관되며, 상담 예약 시 자동으로 차감됩니다.
        </div>

        {loading || paymentStatus === 'preparing' ? (
          <div style={{
            display: 'grid',
            gap: 'var(--spacing-lg)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                border: `2px solid var(--color-border-card)`,
                background: 'var(--color-bg-card)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--spacing-lg)',
                minHeight: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  textAlign: 'center',
                  color: 'var(--color-text-muted-card)',
                }}>
                  {paymentStatus === 'preparing' ? (
                    <>
                      <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>🪷</div>
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
          <Card>
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-3xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
              alignItems: 'center',
            }}>
              <div style={{
                fontSize: '3rem',
                animation: 'spin 2s linear infinite',
              }}>
                🪷
              </div>
              <div style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-gold)',
                fontFamily: 'var(--font-heading)',
              }}>
                결제 처리 중...
              </div>
              <div style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted-card)',
              }}>
                잠시만 기다려 주세요
              </div>
            </div>
          </Card>
        ) : products.length === 0 ? (
          <EmptyState title="이용 가능한 상품이 없습니다" desc="잠시 후 다시 시도해주세요." />
        ) : (
          <div style={{
            display: 'grid',
            gap: 'var(--spacing-lg)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
          }}>
            {products.map((product) => (
              <Card key={product.id}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                  minHeight: '180px'
                }}>
                  <div>
                    <h3 style={{
                      margin: '0 0 var(--spacing-sm) 0',
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--color-text-on-card)',
                      fontFamily: 'var(--font-heading)',
                    }}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p style={{
                        margin: '0 0 var(--spacing-sm) 0',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-muted-card)',
                        lineHeight: 'var(--line-height-normal)',
                      }}>
                        {product.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-md) 0',
                    borderTop: `1px solid var(--color-border-card)`,
                    borderBottom: `1px solid var(--color-border-card)`,
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-sm)',
                    }}>
                      <span style={{ color: 'var(--color-text-muted-card)' }}>상담 시간</span>
                      <span style={{
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-accent-primary)',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        {product.durationMinutes}분
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--font-size-sm)',
                    }}>
                      <span style={{ color: 'var(--color-text-muted-card)' }}>충전 캐시</span>
                      <span style={{
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--color-gold)',
                        fontFamily: 'var(--font-heading)',
                      }}>
                        {product.cashAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-black)',
                      textAlign: 'center',
                      marginBottom: 'var(--spacing-md)',
                      color: 'var(--color-gold)',
                      fontFamily: 'var(--font-heading)',
                    }}>
                      {product.priceKrw.toLocaleString()}원
                    </div>
                    <button
                      onClick={() => handlePurchase(product)}
                      disabled={selectedProductId === product.id || paymentStatus !== 'idle'}
                      style={{
                        width: '100%',
                        background: selectedProductId === product.id || paymentStatus !== 'idle'
                          ? 'var(--color-border-dark)'
                          : 'var(--color-gold)',
                        color: selectedProductId === product.id || paymentStatus !== 'idle'
                          ? 'var(--color-text-muted-dark)'
                          : 'var(--color-bg-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--spacing-md) var(--spacing-lg)',
                        fontSize: 'var(--font-size-base)',
                        fontWeight: 'var(--font-weight-bold)',
                        cursor: selectedProductId === product.id || paymentStatus !== 'idle' ? 'not-allowed' : 'pointer',
                        minHeight: '44px',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {selectedProductId === product.id ? '처리 중...' : '구매하기'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'var(--spacing-md)' }}>
          <button
            onClick={() => router.push('/wallet')}
            disabled={paymentStatus === 'processing' || paymentStatus === 'preparing'}
            style={{
              background: 'transparent',
              color: 'var(--color-gold)',
              border: `1px solid var(--color-border-dark)`,
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              fontSize: 'var(--font-size-sm)',
              cursor: paymentStatus === 'processing' || paymentStatus === 'preparing' ? 'not-allowed' : 'pointer',
              opacity: paymentStatus === 'processing' || paymentStatus === 'preparing' ? 0.5 : 1,
            }}
          >
            ← 지갑으로 돌아가기
          </button>
        </div>

        {/* CSS Animations */}
        <style jsx>{`
          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }
        `}</style>
      </main>
    </RequireLogin>
  );
}
