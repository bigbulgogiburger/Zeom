'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, Building2, Smartphone, Wallet as WalletIcon } from 'lucide-react';
import { chargeCash, getWallet } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { RadioCard, SuccessState, WalletChip } from '@/components/design';
import { cn } from '@/lib/utils';

type PackageId = 'p1' | 'p2' | 'p3' | 'p4';

interface CashPackage {
  id: PackageId;
  title: string;
  hours: string; // 예: "60분 5회"
  cashAmount: number; // 결제 금액 (원)
  bonus: number; // 보너스 캐시
  popular?: boolean;
}

const PACKAGES: ReadonlyArray<CashPackage> = [
  { id: 'p1', title: '스타터', hours: '60분 1회', cashAmount: 55_000, bonus: 0 },
  { id: 'p2', title: '베이직', hours: '60분 2회', cashAmount: 110_000, bonus: 10_000 },
  { id: 'p3', title: '인기', hours: '60분 5회', cashAmount: 300_000, bonus: 40_000, popular: true },
  { id: 'p4', title: '프리미엄', hours: '60분 10회', cashAmount: 600_000, bonus: 100_000 },
];

interface PayMethod {
  id: string; // chargeCash 에 전달할 method id
  value: string; // RadioCard value
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PAY_METHODS: ReadonlyArray<PayMethod> = [
  {
    id: 'CARD',
    value: 'card',
    label: '신용/체크 카드',
    description: '국내외 모든 카드 사용 가능',
    icon: <CreditCard size={18} aria-hidden="true" />,
  },
  {
    id: 'TRANSFER',
    value: 'transfer',
    label: '계좌이체',
    description: '실시간 계좌이체',
    icon: <Building2 size={18} aria-hidden="true" />,
  },
  {
    id: 'KAKAOPAY',
    value: 'kakaopay',
    label: '카카오페이',
    description: '간편결제',
    icon: <Smartphone size={18} aria-hidden="true" />,
  },
  {
    id: 'TOSSPAY',
    value: 'tosspay',
    label: '토스페이',
    description: '간편결제',
    icon: <WalletIcon size={18} aria-hidden="true" />,
  },
];

function CashBuyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return'); // 'confirm' | null

  const [selectedPkg, setSelectedPkg] = useState<PackageId>('p2');
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [chargedAmount, setChargedAmount] = useState<number>(0);

  const pkg = useMemo(
    () => PACKAGES.find((p) => p.id === selectedPkg) ?? PACKAGES[0],
    [selectedPkg],
  );

  const totalCash = pkg.cashAmount + pkg.bonus;
  const canPay = agreed && status === 'idle';

  async function handlePay() {
    if (!canPay) return;
    setStatus('processing');
    setErrorMessage('');

    try {
      const method = PAY_METHODS.find((m) => m.value === selectedMethod);
      // PortOne mock 호출 — 보존
      await chargeCash(pkg.cashAmount, method?.id ?? 'CARD');
      try {
        await getWallet();
      } catch {
        // 잔액 조회 실패는 결제 성공에 영향 없음
      }
      setChargedAmount(totalCash);
      // dots 1.4초 후 success 화면 전환
      setTimeout(() => setStatus('success'), 1400);
    } catch (err) {
      setStatus('failed');
      const reason = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.';
      setErrorMessage(reason);
    }
  }

  if (status === 'success') {
    return (
      <main className="mx-auto max-w-[880px] px-6 py-12">
        <SuccessState
          icon="check"
          title="충전이 완료되었습니다"
          subtitle={`${chargedAmount.toLocaleString()} 캐시가 지갑에 반영되었습니다`}
          autoNavigateMs={1400}
          onComplete={() => {
            if (returnTo === 'confirm') {
              // 원래 confirm 컨텍스트(counselorId/date/time/channel/price)를 그대로 전달해 복귀
              const sp = new URLSearchParams(searchParams.toString());
              sp.delete('return');
              sp.delete('need');
              const qs = sp.toString();
              router.push(qs ? `/booking/confirm?${qs}` : '/booking/confirm');
            } else {
              router.push('/');
            }
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[880px] px-6 py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="m-0 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
          캐시 충전
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          상담 예약에 사용할 캐시를 충전하세요. 보너스 캐시도 함께 지급됩니다.
        </p>
      </header>

      {/* 패키지 4열 */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PACKAGES.map((p) => {
          const selected = p.id === selectedPkg;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPkg(p.id)}
              aria-pressed={selected}
              className={cn(
                'glow-card relative flex flex-col gap-3 px-5 py-5 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                selected && 'border-gold bg-gold/[0.06]',
              )}
            >
              {p.popular && (
                <span className="absolute -top-2 right-4 rounded-full bg-gradient-to-r from-gold to-gold-soft px-2 py-0.5 text-xs font-heading font-bold text-background">
                  인기
                </span>
              )}
              <span className="font-heading text-sm text-text-secondary">
                {p.title}
              </span>
              <span className="font-heading text-base font-bold text-text-primary">
                {p.hours}
              </span>
              <div className="mt-auto">
                <div className="tabular font-heading text-xl font-bold text-gold">
                  {p.cashAmount.toLocaleString()}원
                </div>
                {p.bonus > 0 && (
                  <div className="tabular mt-1 text-xs text-success">
                    + {p.bonus.toLocaleString()} 보너스
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </section>

      {/* 본문 그리드 */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* 좌: 결제수단 + 약관 */}
        <div className="flex flex-col gap-5">
          <section className="glow-card px-6 py-5">
            <h2 className="mb-4 m-0 font-heading text-base font-bold text-text-primary">
              결제 수단
            </h2>
            <div role="radiogroup" aria-label="결제 수단" className="flex flex-col gap-2">
              {PAY_METHODS.map((m) => (
                <RadioCard
                  key={m.value}
                  name="payment-method"
                  value={m.value}
                  label={m.label}
                  description={m.description}
                  icon={m.icon}
                  selected={selectedMethod === m.value}
                  onSelect={setSelectedMethod}
                />
              ))}
            </div>
          </section>

          <section className="glow-card px-6 py-5">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                  agreed
                    ? 'border-gold bg-gold text-background'
                    : 'border-border-subtle bg-surface-2',
                )}
              >
                {agreed && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="2,6 5,9 10,3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="flex-1 leading-relaxed">
                결제 진행 약관 및 환불 규정에 동의합니다
                <span className="ml-1 text-xs text-gold">[필수]</span>
              </span>
            </label>
          </section>

          {status === 'failed' && errorMessage && (
            <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>

        {/* 우: sticky 주문 요약 */}
        <aside className="lg:sticky lg:top-[88px] lg:self-start">
          <section className="glow-card flex flex-col gap-4 px-6 py-5">
            <div className="flex items-center justify-between">
              <h2 className="m-0 font-heading text-base font-bold text-text-primary">
                주문 요약
              </h2>
              <WalletChip />
            </div>

            <dl className="m-0 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">패키지</dt>
                <dd className="font-heading font-bold text-text-primary">
                  {pkg.title} · {pkg.hours}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">충전 캐시</dt>
                <dd className="tabular font-heading text-text-primary">
                  {pkg.cashAmount.toLocaleString()}원
                </dd>
              </div>
              {pkg.bonus > 0 && (
                <div className="flex justify-between">
                  <dt className="text-text-secondary">보너스</dt>
                  <dd className="tabular font-heading text-success">
                    + {pkg.bonus.toLocaleString()}원
                  </dd>
                </div>
              )}
            </dl>

            <div className="my-1 h-px bg-border-subtle" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-text-secondary">결제 금액</span>
              <span className="tabular font-heading text-[28px] font-bold text-gold">
                {pkg.cashAmount.toLocaleString()}
                <span className="ml-1 text-base font-normal text-text-secondary">원</span>
              </span>
            </div>

            <button
              type="button"
              disabled={!canPay}
              onClick={handlePay}
              className={cn(
                'w-full rounded-full px-6 py-3 text-base font-heading font-bold transition-all',
                canPay
                  ? 'bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[var(--shadow-gold)]'
                  : 'cursor-not-allowed bg-surface-3 text-text-muted',
              )}
            >
              {status === 'processing' ? (
                <span className="inline-flex items-center justify-center gap-2">
                  결제 처리 중<DotPulse />
                </span>
              ) : (
                <>
                  <span className="tabular">{pkg.cashAmount.toLocaleString()}</span>원 결제하기
                </>
              )}
            </button>

            <p className="m-0 text-center text-xs text-text-muted">
              PortOne × KG이니시스 안전 결제
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function DotPulse() {
  return (
    <span className="inline-flex items-center gap-0.5 motion-reduce:hidden" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-pulse rounded-full bg-current"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

export default function CashBuyPage() {
  return (
    <RequireLogin>
      <Suspense fallback={<div className="mx-auto max-w-[880px] px-6 py-10" />}>
        <CashBuyInner />
      </Suspense>
    </RequireLogin>
  );
}
