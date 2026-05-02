'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, startSession } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookingCard,
  EmptyState,
  Seg,
  type BookingChannel,
  type BookingStatus,
  type SegItem,
} from '@/components/design';
import { cn } from '@/lib/utils';

type BookingSlot = { slotId: number; startAt: string; endAt: string };

type Booking = {
  id: number;
  counselorName: string;
  counselorId: number;
  slots: BookingSlot[];
  status: string;
  creditsUsed: number;
  cancelReason?: string;
  paymentRetryCount?: number;
  slotId?: number;
  startAt?: string;
  endAt?: string;
  channel?: BookingChannel;
  price?: number;
  reviewSubmitted?: boolean;
};

const CANCEL_REASONS = [
  { value: 'SCHEDULE_CHANGE', label: '일정 변경' },
  { value: 'PERSONAL', label: '개인 사정' },
  { value: 'OTHER_COUNSELOR', label: '다른 상담사 선호' },
  { value: 'OTHER', label: '기타' },
] as const;

const MAX_PAYMENT_RETRIES = 3;

type TabKey = 'upcoming' | 'completed' | 'canceled';

function matchesTab(status: string, tab: TabKey): boolean {
  switch (tab) {
    case 'upcoming':
      return status === 'BOOKED' || status === 'PAID' || status === 'IN_PROGRESS' || status === 'PAYMENT_FAILED';
    case 'completed':
      return status === 'COMPLETED';
    case 'canceled':
      return status === 'CANCELED' || status === 'CANCELLED';
    default:
      return false;
  }
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTimeRangeLabel(startAt: string, endAt: string) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(s)} — ${fmt(e)}`;
}

function normalizeSlots(b: Booking): BookingSlot[] {
  if (b.slots && b.slots.length > 0) return b.slots;
  if (b.startAt && b.endAt) return [{ slotId: b.slotId ?? 0, startAt: b.startAt, endAt: b.endAt }];
  return [];
}

function totalDurationMin(slots: BookingSlot[]): number {
  if (slots.length === 0) return 60;
  const sorted = [...slots].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  const start = new Date(sorted[0].startAt).getTime();
  const end = new Date(sorted[sorted.length - 1].endAt).getTime();
  return Math.max(30, Math.round((end - start) / 60000));
}

function getCancelPolicyInfo(slots: BookingSlot[]): { refundRate: number; message: string } | null {
  if (slots.length === 0) return null;
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const earliestStart = new Date(sorted[0].startAt).getTime();
  const now = Date.now();
  const hoursUntilStart = (earliestStart - now) / (1000 * 60 * 60);

  if (hoursUntilStart >= 24) {
    return { refundRate: 100, message: '24시간 이전 취소: 전액 환불' };
  } else if (hoursUntilStart >= 12) {
    return { refundRate: 50, message: '12~24시간 전 취소: 50% 환불' };
  } else {
    return { refundRate: 0, message: '12시간 이내 취소: 환불 불가' };
  }
}

const ENTRY_BEFORE_MS = 5 * 60 * 1000;
const ENTRY_AFTER_MS = 10 * 60 * 1000;

type EntryPhase = 'too_early' | 'entry_available' | 'in_session' | 'ended';

function getEntryPhase(slots: BookingSlot[], now: number): { phase: EntryPhase; minutesUntilEntry?: number } {
  if (slots.length === 0) return { phase: 'ended' };
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const earliestStart = new Date(sorted[0].startAt).getTime();
  const latestEnd = new Date(sorted[sorted.length - 1].endAt).getTime();
  const entryOpen = earliestStart - ENTRY_BEFORE_MS;
  const entryClose = latestEnd + ENTRY_AFTER_MS;

  if (now < entryOpen) {
    return { phase: 'too_early', minutesUntilEntry: Math.ceil((entryOpen - now) / 60000) };
  }
  if (now < earliestStart) return { phase: 'entry_available' };
  if (now <= entryClose) return { phase: 'in_session' };
  return { phase: 'ended' };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOtherText, setCancelOtherText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const r = await apiFetch('/api/v1/bookings/me', { cache: 'no-store' });
      const json = await r.json();
      if (!r.ok) {
        toast.error(json.message ?? '예약 목록 조회에 실패했습니다.');
        setLoadError(true);
        return;
      }
      setBookings(json);
    } catch {
      toast.error('예약 목록을 불러오지 못했습니다.');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { upcoming: 0, completed: 0, canceled: 0 };
    for (const b of bookings) {
      if (matchesTab(b.status, 'upcoming')) counts.upcoming++;
      else if (matchesTab(b.status, 'completed')) counts.completed++;
      else if (matchesTab(b.status, 'canceled')) counts.canceled++;
    }
    return counts;
  }, [bookings]);

  const filteredBookings = useMemo(
    () =>
      bookings
        .filter((b) => matchesTab(b.status, activeTab))
        .sort((a, b) => {
          const ta = new Date(normalizeSlots(a)[0]?.startAt ?? 0).getTime();
          const tb = new Date(normalizeSlots(b)[0]?.startAt ?? 0).getTime();
          return activeTab === 'upcoming' ? ta - tb : tb - ta;
        }),
    [bookings, activeTab],
  );

  function openCancelModal(bookingId: number) {
    setCancelBookingId(bookingId);
    setCancelReason('');
    setCancelOtherText('');
    setCancelModalOpen(true);
  }

  async function confirmCancel() {
    if (cancelBookingId === null) return;
    setCancelling(true);

    const reasonValue =
      cancelReason === 'OTHER' && cancelOtherText.trim()
        ? `OTHER: ${cancelOtherText.trim()}`
        : cancelReason || undefined;

    const body = reasonValue ? JSON.stringify({ reason: reasonValue }) : undefined;

    try {
      const r = await apiFetch(`/api/v1/bookings/${cancelBookingId}/cancel`, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      const json = await r.json();
      if (!r.ok) {
        toast.error(json.message ?? '취소 실패');
        setCancelModalOpen(false);
        return;
      }
      toast.success('예약이 취소되었습니다 · 100% 환불 예정');
      setCancelModalOpen(false);
      await load();
    } finally {
      setCancelling(false);
    }
  }

  async function retryPayment(bookingId: number) {
    setRetryingId(bookingId);
    try {
      const r = await apiFetch(`/api/v1/bookings/${bookingId}/retry-payment`, { method: 'PUT' });
      const json = await r.json();
      if (!r.ok) {
        toast.error(json.message ?? '결제 재시도에 실패했습니다.');
        return;
      }
      toast.success('결제를 다시 시도할 수 있습니다.');
      await load();
    } catch {
      toast.error('결제 재시도 중 오류가 발생했습니다.');
    } finally {
      setRetryingId(null);
    }
  }

  async function enterSession(bookingId: number) {
    setEnteringId(bookingId);
    try {
      const session = await startSession(String(bookingId));
      router.push(`/consultation/${session.id ?? bookingId}/waiting`);
    } catch {
      toast.error('입장 중 오류가 발생했습니다.');
    } finally {
      setEnteringId(null);
    }
  }

  function renderUpcomingActions(b: Booking, slots: BookingSlot[]) {
    if (b.status === 'PAYMENT_FAILED') {
      const retryCount = b.paymentRetryCount ?? 0;
      const exhausted = retryCount >= MAX_PAYMENT_RETRIES;
      if (exhausted) {
        return (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => router.push('/support')}
          >
            고객센터 문의
          </Button>
        );
      }
      return (
        <Button
          variant="gold-grad"
          size="sm"
          className="rounded-full"
          disabled={retryingId === b.id}
          onClick={() => retryPayment(b.id)}
        >
          {retryingId === b.id ? '처리 중...' : '결제 재시도'}
        </Button>
      );
    }

    const entry = getEntryPhase(slots, now);
    const canCancel = b.status === 'BOOKED' || b.status === 'PAID';

    let entryBtn: React.ReactNode = null;
    if (entry.phase === 'too_early') {
      entryBtn = (
        <Button variant="secondary" size="sm" disabled className="rounded-full">
          <span className="tabular">{entry.minutesUntilEntry}</span>분 후 입장
        </Button>
      );
    } else if (entry.phase === 'entry_available' || entry.phase === 'in_session') {
      entryBtn = (
        <Button
          variant="gold-grad"
          size="sm"
          className="rounded-full"
          disabled={enteringId === b.id}
          onClick={() => enterSession(b.id)}
        >
          {enteringId === b.id ? '입장 중...' : '대기실 입장'}
        </Button>
      );
    } else if (entry.phase === 'ended') {
      entryBtn = (
        <Button variant="secondary" size="sm" disabled className="rounded-full">
          상담 종료
        </Button>
      );
    }

    return (
      <>
        {canCancel && (
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full"
            onClick={() => openCancelModal(b.id)}
          >
            취소
          </Button>
        )}
        {entryBtn}
      </>
    );
  }

  function renderCompletedActions(b: Booking) {
    if (b.reviewSubmitted) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
          후기 작성됨
        </span>
      );
    }
    return (
      <Button
        variant="gold-grad"
        size="sm"
        className="rounded-full"
        onClick={() => router.push(`/consultation/${b.id}/review`)}
      >
        후기 작성
      </Button>
    );
  }

  function renderBooking(b: Booking) {
    const slots = normalizeSlots(b);
    const first = slots[0];
    const last = slots[slots.length - 1];
    const dateLabel = first ? formatDateLabel(first.startAt) : '';
    const timeLabel = first && last ? formatTimeRangeLabel(first.startAt, last.endAt) : '';
    const duration = totalDurationMin(slots);
    const channel: BookingChannel = b.channel ?? 'video';
    const status: BookingStatus =
      b.status === 'COMPLETED'
        ? 'completed'
        : b.status === 'CANCELED' || b.status === 'CANCELLED'
          ? 'canceled'
          : 'upcoming';

    let actions: React.ReactNode = null;
    if (status === 'upcoming') actions = renderUpcomingActions(b, slots);
    else if (status === 'completed') actions = renderCompletedActions(b);

    return (
      <BookingCard
        key={b.id}
        portrait={{ name: b.counselorName }}
        channel={channel}
        status={status}
        dateLabel={dateLabel}
        timeLabel={timeLabel}
        durationMin={duration}
        price={b.price}
        actions={actions}
      />
    );
  }

  const segItems: ReadonlyArray<SegItem<TabKey>> = [
    { key: 'upcoming', label: '예정', count: tabCounts.upcoming },
    { key: 'completed', label: '완료', count: tabCounts.completed },
    { key: 'canceled', label: '취소', count: tabCounts.canceled },
  ];

  const cancelBooking =
    cancelBookingId !== null ? bookings.find((b) => b.id === cancelBookingId) : null;
  const cancelSlots = cancelBooking ? normalizeSlots(cancelBooking) : [];
  const cancelPolicy = cancelSlots.length > 0 ? getCancelPolicyInfo(cancelSlots) : null;

  return (
    <RequireLogin>
      <main className="mx-auto max-w-[960px] px-6 py-8 sm:px-8 sm:py-10">
        <header className="mb-6">
          <h1 className="m-0 font-heading text-3xl font-bold text-text-primary">예약 관리</h1>
          <p className="mt-2 text-sm text-text-secondary">
            예정된 상담과 지난 상담 내역을 확인할 수 있습니다.
          </p>
        </header>

        {/* 상단 줄: Seg + 새 상담 예약 */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Seg<TabKey>
            items={segItems}
            value={activeTab}
            onChange={setActiveTab}
            ariaLabel="예약 상태 필터"
          />
          <Link
            href="/counselors"
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-gold"
          >
            + 새 상담 예약
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="glow-card h-[100px] animate-pulse" aria-hidden="true" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            variant="error"
            icon="!"
            title="잠시 문제가 발생했습니다"
            body="예약 목록을 불러오지 못했습니다. 다시 시도해주세요."
            cta={{ label: '다시 시도', onClick: () => load() }}
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon="🪷"
            title={
              activeTab === 'upcoming'
                ? '예정된 상담이 없습니다'
                : activeTab === 'completed'
                  ? '완료된 상담이 없습니다'
                  : '취소한 상담이 없습니다'
            }
            body={
              activeTab === 'upcoming' ? '마음 편한 시간에 상담사를 만나보세요' : undefined
            }
            cta={
              activeTab === 'upcoming'
                ? { label: '상담사 찾기', href: '/counselors' }
                : undefined
            }
          />
        ) : (
          <div className="stagger-container visible flex flex-col gap-3">{filteredBookings.map((b) => renderBooking(b))}</div>
        )}

        {/* Cancel Modal */}
        <Dialog
          open={cancelModalOpen}
          onOpenChange={(open) => {
            if (!open) setCancelModalOpen(false);
          }}
        >
          <DialogContent className="max-w-[420px] rounded-2xl border-border-subtle bg-surface text-text-primary">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg font-bold">예약 취소</DialogTitle>
              <DialogDescription className="text-sm text-text-secondary">
                취소 사유를 선택해주세요.
              </DialogDescription>
            </DialogHeader>

            {cancelPolicy && (
              <div
                className={cn(
                  'rounded-xl border px-4 py-3 text-sm',
                  cancelPolicy.refundRate === 100 && 'border-success/30 bg-success/10 text-success',
                  cancelPolicy.refundRate === 50 && 'border-warning/30 bg-warning/10 text-warning',
                  cancelPolicy.refundRate === 0 &&
                    'border-destructive/30 bg-destructive/10 text-destructive',
                )}
              >
                <p className="m-0 font-heading font-bold">{cancelPolicy.message}</p>
                {cancelPolicy.refundRate < 100 && (
                  <p className="mt-1 text-xs opacity-80">
                    {cancelPolicy.refundRate === 0
                      ? '이 시간대에는 취소 시 환불이 불가합니다.'
                      : '결제 금액의 50%만 돌려받으실 수 있습니다.'}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 py-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setCancelReason(r.value)}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-left text-sm font-heading transition-colors',
                    cancelReason === r.value
                      ? 'border-gold bg-gold/10 font-bold text-gold'
                      : 'border-border-subtle text-text-primary hover:border-gold/30',
                  )}
                >
                  {r.label}
                </button>
              ))}

              {cancelReason === 'OTHER' && (
                <textarea
                  value={cancelOtherText}
                  onChange={(e) => setCancelOtherText(e.target.value)}
                  placeholder="취소 사유를 입력해주세요..."
                  className="mt-2 min-h-[80px] w-full resize-none rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              )}
            </div>

            <DialogFooter className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="rounded-full"
              >
                닫기
              </Button>
              <Button
                variant="danger"
                onClick={confirmCancel}
                disabled={cancelling}
                className="rounded-full"
              >
                {cancelling ? '취소 중...' : '예약 취소'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </RequireLogin>
  );
}
