'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Mic, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Portrait,
  ProgressSteps,
  WalletChip,
  SuccessState,
} from '@/components/design';
import { useWallet } from '@/hooks/useWallet';
import { RequireLogin } from '@/components/route-guard';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'select', label: '상담사 선택' },
  { key: 'time', label: '시간 선택' },
  { key: 'confirm', label: '예약 확인' },
  { key: 'pay', label: '결제' },
] as const;

interface BookingDraft {
  counselorId: string;
  counselorName: string;
  speciality: string;
  channel: 'video' | 'voice';
  date: string; // ISO date
  time: string; // HH:mm
  durationMin: number;
  price: number;
}

const FALLBACK_DRAFT: BookingDraft = {
  counselorId: 'demo',
  counselorName: '천지연 도사',
  speciality: '연애·재회',
  channel: 'video',
  date: '2026-04-27',
  time: '20:00',
  durationMin: 60,
  price: 45_000,
};

function formatDateLabel(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  } catch {
    return iso;
  }
}

function ConfirmInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { balance, refresh } = useWallet();

  const draft: BookingDraft = useMemo(() => {
    const counselorId = params.get('counselorId') ?? FALLBACK_DRAFT.counselorId;
    const counselorName = params.get('counselorName') ?? FALLBACK_DRAFT.counselorName;
    const date = params.get('date') ?? FALLBACK_DRAFT.date;
    const time = params.get('time') ?? FALLBACK_DRAFT.time;
    const channel = (params.get('channel') === 'voice' ? 'voice' : 'video') as
      | 'video'
      | 'voice';
    const priceParam = Number(params.get('price') ?? FALLBACK_DRAFT.price);
    const price = Number.isFinite(priceParam) ? priceParam : FALLBACK_DRAFT.price;
    return {
      counselorId,
      counselorName,
      speciality: params.get('speciality') ?? FALLBACK_DRAFT.speciality,
      channel,
      date,
      time,
      durationMin: 60,
      price,
    };
  }, [params]);

  const [agreedRefund, setAgreedRefund] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const walletAvailable = balance ?? 0;
  const insufficient = walletAvailable < draft.price;
  const shortage = Math.max(0, draft.price - walletAvailable);
  const remainAfter = Math.max(0, walletAvailable - draft.price);

  const allAgreed = agreedRefund && agreedPrivacy;
  const canSubmit = !insufficient && allAgreed && !submitting;

  // 캐시 충전 후 복귀 시 잔액 자동 갱신
  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleConfirm() {
    if (!canSubmit) return;
    setSubmitting(true);
    // 실제 결제/예약 API는 ZEOM-22 범위. 여기는 클라이언트 확인 화면.
    setTimeout(() => {
      setSuccess(true);
      toast.success('예약이 확정되었습니다');
      setTimeout(() => {
        router.push('/bookings/me');
      }, 900);
    }, 900);
  }

  if (success) {
    return (
      <main className="mx-auto max-w-[720px] px-6 py-10">
        <SuccessState
          icon="check"
          title="예약이 확정되었습니다"
          subtitle="예약 내역으로 이동합니다."
        />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[720px] px-6 py-8 sm:py-10">
      <div className="mb-6">
        <ProgressSteps steps={STEPS} current={2} />
      </div>

      <header className="mb-8">
        <h1 className="m-0 font-heading text-2xl font-bold text-text-primary sm:text-3xl">
          예약을 확인해주세요
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          예약 정보와 결제 금액이 맞는지 확인 후 예약을 확정해주세요.
        </p>
      </header>

      {/* 예약 정보 카드 */}
      <section className="glow-card mb-5 px-6 py-5">
        <div className="flex items-center gap-4">
          <Portrait
            counselor={{ name: draft.counselorName }}
            size="xl"
            className="!h-[72px] !w-[72px]"
          />
          <div className="flex flex-1 flex-col gap-1">
            <span className="font-heading text-lg font-bold text-text-primary">
              {draft.counselorName}
            </span>
            <span className="text-sm text-text-secondary">{draft.speciality}</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary">
            {draft.channel === 'video' ? (
              <Video size={12} aria-hidden="true" />
            ) : (
              <Mic size={12} aria-hidden="true" />
            )}
            {draft.channel === 'video' ? '화상' : '음성'}
          </span>
        </div>

        <div className="my-5 h-px bg-border-subtle" />

        <dl className="grid grid-cols-2 gap-y-4 text-sm">
          <div>
            <dt className="mb-1 text-xs text-text-muted">날짜</dt>
            <dd className="tabular font-heading font-bold text-text-primary">
              {formatDateLabel(draft.date)}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-text-muted">시간</dt>
            <dd className="tabular font-heading font-bold text-text-primary">
              {draft.time}{' '}
              <span className="font-normal text-text-secondary">
                ({draft.durationMin}분)
              </span>
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-text-muted">방식</dt>
            <dd className="font-heading font-bold text-text-primary">
              {draft.channel === 'video' ? '화상 상담' : '음성 상담'}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-text-muted">입장</dt>
            <dd className="font-heading font-bold text-text-primary">
              시작 5분 전부터
            </dd>
          </div>
        </dl>
      </section>

      {/* 결제 카드 */}
      <section className="glow-card mb-5 px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 font-heading text-base font-bold text-text-primary">
            결제
          </h2>
          <WalletChip />
        </div>

        <ul className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
          <li className="flex items-center justify-between">
            <span className="text-text-secondary">상담료</span>
            <span className="tabular font-heading text-text-primary">
              {draft.price.toLocaleString()}원
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-text-secondary">보유 캐시 차감</span>
            <span className="tabular font-heading text-text-primary">
              − {Math.min(walletAvailable, draft.price).toLocaleString()}원
            </span>
          </li>
          <li className="my-1 h-px bg-border-subtle" aria-hidden="true" />
          <li className="flex items-center justify-between">
            <span className="text-text-secondary">차감 후 잔액</span>
            <span className="tabular font-heading font-bold text-gold">
              {remainAfter.toLocaleString()}원
            </span>
          </li>
        </ul>

        {insufficient && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-warning"
              aria-hidden="true"
            />
            <div className="flex flex-1 flex-col gap-2">
              <p className="m-0 text-sm text-text-primary">
                캐시가 <span className="tabular font-bold">{shortage.toLocaleString()}</span>원 부족해요
              </p>
              <Link
                href={(() => {
                  // 충전 후 confirm 복귀 시 원래 예약 컨텍스트(counselorId/date/time/channel/price)를 보존하여
                  // 사용자가 동일 화면 상태로 돌아올 수 있게 한다.
                  const sp = new URLSearchParams(params?.toString() ?? '');
                  sp.set('return', 'confirm');
                  sp.set('need', String(shortage));
                  return `/cash/buy?${sp.toString()}`;
                })()}
                className="inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-gold to-gold-soft px-4 py-1.5 text-xs font-heading font-bold text-background hover:no-underline"
              >
                캐시 충전하기
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* 약관 카드 */}
      <section className="glow-card mb-6 px-6 py-5">
        <h2 className="mb-3 m-0 font-heading text-base font-bold text-text-primary">
          약관 동의
        </h2>
        <div className="flex flex-col gap-3">
          <AgreeCheckbox
            checked={agreedRefund}
            onChange={setAgreedRefund}
            label="환불 정책에 동의합니다"
            required
          />
          <AgreeCheckbox
            checked={agreedPrivacy}
            onChange={setAgreedPrivacy}
            label="개인정보 처리방침에 동의합니다"
            required
          />
        </div>
      </section>

      {/* Footer */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-border-subtle bg-surface-2 px-5 py-3 text-sm font-heading font-bold text-text-primary transition-colors hover:bg-surface-hover"
        >
          이전
        </button>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleConfirm}
          className={cn(
            'flex-1 rounded-full px-6 py-3 text-base font-heading font-bold transition-all',
            canSubmit
              ? 'bg-gradient-to-r from-gold to-gold-soft text-background hover:shadow-[var(--shadow-gold)]'
              : 'cursor-not-allowed bg-surface-3 text-text-muted',
          )}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              처리 중<DotPulse />
            </span>
          ) : (
            <>
              <span className="tabular">{draft.price.toLocaleString()}</span>원 캐시 예약 확정
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function AgreeCheckbox({
  checked,
  onChange,
  label,
  required,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-text-primary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          checked
            ? 'border-gold bg-gold text-background'
            : 'border-border-subtle bg-surface-2',
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="2,6 5,9 10,3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1">
        {label}
        {required && <span className="ml-1 text-xs text-gold">[필수]</span>}
      </span>
    </label>
  );
}

function DotPulse() {
  return (
    <span className="inline-flex items-center gap-0.5 motion-reduce:hidden" aria-hidden="true">
      {[0, 160, 320].map((delay) => (
        <span
          key={delay}
          className="h-1 w-1 animate-pulse rounded-full bg-current"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

export default function BookingConfirmPage() {
  return (
    <RequireLogin>
      <Suspense fallback={<div className="mx-auto max-w-[720px] px-6 py-10" />}>
        <ConfirmInner />
      </Suspense>
    </RequireLogin>
  );
}
