'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, startSession } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyStateCard } from '@/components/empty-state';
import { Clock } from 'lucide-react';

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
};

const CANCEL_REASONS = [
  { value: 'SCHEDULE_CHANGE', label: '일정 변경' },
  { value: 'PERSONAL', label: '개인 사정' },
  { value: 'OTHER_COUNSELOR', label: '다른 상담사 선호' },
  { value: 'OTHER', label: '기타' },
] as const;

const MAX_PAYMENT_RETRIES = 3;

type TabKey = 'all' | 'upcoming' | 'in_progress' | 'completed' | 'canceled';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'upcoming', label: '예정' },
  { key: 'in_progress', label: '진행중' },
  { key: 'completed', label: '완료' },
  { key: 'canceled', label: '취소' },
];

function matchesTab(status: string, tab: TabKey): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'upcoming':
      return status === 'BOOKED' || status === 'PAID';
    case 'in_progress':
      return status === 'IN_PROGRESS';
    case 'completed':
      return status === 'COMPLETED';
    case 'canceled':
      return status === 'CANCELED' || status === 'CANCELLED';
    default:
      return true;
  }
}

function getTabEmptyMessage(tab: TabKey): string {
  switch (tab) {
    case 'upcoming':
      return '예정된 상담이 없습니다';
    case 'in_progress':
      return '진행 중인 상담이 없습니다';
    case 'completed':
      return '완료된 상담이 없습니다';
    case 'canceled':
      return '취소된 상담이 없습니다';
    default:
      return '예약 내역이 없습니다';
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function normalizeSlots(b: Booking): BookingSlot[] {
  if (b.slots && b.slots.length > 0) return b.slots;
  if (b.startAt && b.endAt) return [{ slotId: b.slotId ?? 0, startAt: b.startAt, endAt: b.endAt }];
  return [];
}

function groupConsecutiveSlots(slots: BookingSlot[]): { startAt: string; endAt: string }[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const ranges: { startAt: string; endAt: string }[] = [];
  let rangeStart = sorted[0].startAt;
  let rangeEnd = sorted[0].endAt;

  for (let i = 1; i < sorted.length; i++) {
    const slotStart = new Date(sorted[i].startAt).getTime();
    const prevEnd = new Date(rangeEnd).getTime();
    if (slotStart <= prevEnd) {
      rangeEnd = sorted[i].endAt;
    } else {
      ranges.push({ startAt: rangeStart, endAt: rangeEnd });
      rangeStart = sorted[i].startAt;
      rangeEnd = sorted[i].endAt;
    }
  }
  ranges.push({ startAt: rangeStart, endAt: rangeEnd });
  return ranges;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID': return 'default';
    case 'BOOKED': return 'secondary';
    case 'CANCELLED':
    case 'CANCELED':
    case 'PAYMENT_FAILED': return 'destructive';
    case 'COMPLETED': return 'outline';
    default: return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'BOOKED': return '예약됨';
    case 'PAID': return '결제완료';
    case 'CANCELLED':
    case 'CANCELED': return '취소됨';
    case 'COMPLETED': return '완료';
    case 'PAYMENT_FAILED': return '결제실패';
    default: return status;
  }
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

type EntryState =
  | { phase: 'too_early'; minutesUntilEntry: number }
  | { phase: 'entry_available' }
  | { phase: 'in_session' }
  | { phase: 'ended' };

function getEntryState(slots: BookingSlot[], now: number): EntryState {
  if (slots.length === 0) return { phase: 'ended' };

  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const earliestStart = new Date(sorted[0].startAt).getTime();
  const latestEnd = new Date(sorted[sorted.length - 1].endAt).getTime();

  const entryOpenTime = earliestStart - ENTRY_BEFORE_MS;
  const entryCloseTime = latestEnd + ENTRY_AFTER_MS;

  if (now < entryOpenTime) {
    const minutesLeft = Math.ceil((entryOpenTime - now) / 60000);
    return { phase: 'too_early', minutesUntilEntry: minutesLeft };
  }

  if (now >= entryOpenTime && now < earliestStart) {
    return { phase: 'entry_available' };
  }

  if (now >= earliestStart && now <= entryCloseTime) {
    return { phase: 'in_session' };
  }

  return { phase: 'ended' };
}

function canReschedule(slots: BookingSlot[]): boolean {
  if (slots.length === 0) return false;
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const earliestStart = new Date(sorted[0].startAt).getTime();
  const now = Date.now();
  const hoursUntilStart = (earliestStart - now) / (1000 * 60 * 60);
  return hoursUntilStart >= 24;
}

/** Get the earliest slot start time for a booking */
function getEarliestSlotTime(b: Booking): number {
  const slots = normalizeSlots(b);
  if (slots.length === 0) return 0;
  const sorted = [...slots].sort((a, bb) => new Date(a.startAt).getTime() - new Date(bb.startAt).getTime());
  return new Date(sorted[0].startAt).getTime();
}

type DateGroup = 'today' | 'this_week' | 'last_month' | 'older';

function getDateGroup(slotTime: number, now: number): DateGroup {
  const slotDate = new Date(slotTime);
  const nowDate = new Date(now);

  // Today check
  if (
    slotDate.getFullYear() === nowDate.getFullYear() &&
    slotDate.getMonth() === nowDate.getMonth() &&
    slotDate.getDate() === nowDate.getDate()
  ) {
    return 'today';
  }

  // This week: within the same week (Mon-Sun)
  const startOfWeek = new Date(nowDate);
  const dayOfWeek = startOfWeek.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  if (slotTime >= startOfWeek.getTime() && slotTime < endOfWeek.getTime()) {
    return 'this_week';
  }

  // Last month
  const startOfThisMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
  const startOfLastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);

  if (slotTime >= startOfLastMonth.getTime() && slotTime < startOfThisMonth.getTime()) {
    return 'last_month';
  }

  return 'older';
}

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: '오늘',
  this_week: '이번 주',
  last_month: '지난 달',
  older: '이전',
};

const DATE_GROUP_ORDER: DateGroup[] = ['today', 'this_week', 'last_month', 'older'];

/** Compute countdown text for bookings within 24 hours */
function getCountdownText(slots: BookingSlot[], now: number): string | null {
  if (slots.length === 0) return null;
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const earliestStart = new Date(sorted[0].startAt).getTime();
  const diffMs = earliestStart - now;

  if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) return null;

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 후 시작`;
  }
  return `${minutes}분 후 시작`;
}

/** Counselor avatar with initial */
function CounselorAvatar({ name }: { name: string }) {
  const initial = name.charAt(0);
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--dancheong)/0.1)] flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-bold text-[hsl(var(--gold))]">{initial}</span>
    </div>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOtherText, setCancelOtherText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Update time every 60 seconds for countdown (also used by entry state)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const r = await apiFetch('/api/v1/bookings/me', { cache: 'no-store' });
      const json = await r.json();
      if (!r.ok) {
        setMessage(json.message ?? '조회 실패');
        setLoadError(true);
        setLoading(false);
        return;
      }
      setBookings(json);
      setMessage('');
    } catch {
      setMessage('예약 목록을 불러오지 못했습니다.');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Compute tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: bookings.length,
      upcoming: 0,
      in_progress: 0,
      completed: 0,
      canceled: 0,
    };
    for (const b of bookings) {
      if (matchesTab(b.status, 'upcoming')) counts.upcoming++;
      if (matchesTab(b.status, 'in_progress')) counts.in_progress++;
      if (matchesTab(b.status, 'completed')) counts.completed++;
      if (matchesTab(b.status, 'canceled')) counts.canceled++;
    }
    return counts;
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => matchesTab(b.status, activeTab));
  }, [bookings, activeTab]);

  // Group filtered bookings by date
  const groupedBookings = useMemo(() => {
    const groups: Record<DateGroup, Booking[]> = {
      today: [],
      this_week: [],
      last_month: [],
      older: [],
    };

    for (const b of filteredBookings) {
      const slotTime = getEarliestSlotTime(b);
      const group = slotTime > 0 ? getDateGroup(slotTime, now) : 'older';
      groups[group].push(b);
    }

    return groups;
  }, [filteredBookings, now]);

  function openCancelModal(bookingId: number) {
    setCancelBookingId(bookingId);
    setCancelReason('');
    setCancelOtherText('');
    setCancelModalOpen(true);
  }

  async function confirmCancel() {
    if (cancelBookingId === null) return;
    setCancelling(true);

    const reasonValue = cancelReason === 'OTHER' && cancelOtherText.trim()
      ? `OTHER: ${cancelOtherText.trim()}`
      : cancelReason || undefined;

    const body = reasonValue ? JSON.stringify({ reason: reasonValue }) : undefined;

    const r = await apiFetch(`/api/v1/bookings/${cancelBookingId}/cancel`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body,
    });
    const json = await r.json();
    setCancelling(false);

    if (!r.ok) {
      setMessage(json.message ?? '취소 실패');
      setCancelModalOpen(false);
      return;
    }

    setMessage('예약이 취소되었습니다.');
    setCancelModalOpen(false);
    await load();
  }

  async function retryPayment(bookingId: number) {
    setRetryingId(bookingId);
    setMessage('');
    try {
      const r = await apiFetch(`/api/v1/bookings/${bookingId}/retry-payment`, {
        method: 'PUT',
      });
      const json = await r.json();
      if (!r.ok) {
        setMessage(json.message ?? '결제 재시도에 실패했습니다.');
        return;
      }
      setMessage('결제를 다시 시도할 수 있습니다.');
      await load();
    } catch {
      setMessage('결제 재시도 중 오류가 발생했습니다.');
    } finally {
      setRetryingId(null);
    }
  }

  async function enterSession(bookingId: number) {
    setEnteringId(bookingId);
    try {
      const session = await startSession(String(bookingId));
      router.push(`/consultation/${session.id ?? bookingId}`);
    } catch {
      setMessage('입장 중 오류가 발생했습니다.');
    } finally {
      setEnteringId(null);
    }
  }

  function renderEntryButton(b: Booking, slots: BookingSlot[]) {
    if (b.status !== 'PAID') return null;

    const state = getEntryState(slots, now);

    switch (state.phase) {
      case 'too_early':
        return (
          <Button variant="secondary" disabled className="rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))]">
            {state.minutesUntilEntry}분 후 입장 가능
          </Button>
        );
      case 'entry_available':
        return (
          <Button
            variant="default"
            disabled={enteringId === b.id}
            onClick={() => enterSession(b.id)}
            className="rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold"
          >
            {enteringId === b.id ? '입장 중...' : '입장 가능'}
          </Button>
        );
      case 'in_session':
        return (
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 rounded-full font-bold"
            disabled={enteringId === b.id}
            onClick={() => enterSession(b.id)}
          >
            {enteringId === b.id ? '입장 중...' : '상담 중 (입장하기)'}
          </Button>
        );
      case 'ended':
        return (
          <Button variant="outline" disabled className="rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))]">
            상담 종료
          </Button>
        );
    }
  }

  function renderPaymentFailedActions(b: Booking) {
    if (b.status !== 'PAYMENT_FAILED') return null;

    const retryCount = b.paymentRetryCount ?? 0;
    const exhausted = retryCount >= MAX_PAYMENT_RETRIES;

    return (
      <div className="space-y-3">
        <div className="bg-[hsl(var(--dancheong))]/10 border border-[hsl(var(--dancheong))]/20 rounded-xl px-4 py-3 text-sm">
          <p className="text-[hsl(var(--dancheong))] font-bold font-heading mb-1">
            결제에 실패했습니다
          </p>
          <p className="text-muted-foreground text-xs">
            {exhausted
              ? '결제 재시도 횟수를 초과했습니다.'
              : `재시도 횟수: ${retryCount}/${MAX_PAYMENT_RETRIES}`}
          </p>
        </div>
        {exhausted ? (
          <Button
            variant="outline"
            className="rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] w-full"
            onClick={() => router.push('/support')}
          >
            고객센터 문의
          </Button>
        ) : (
          <Button
            variant="default"
            className="rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold w-full"
            disabled={retryingId === b.id}
            onClick={() => retryPayment(b.id)}
          >
            {retryingId === b.id ? '처리 중...' : '다시 시도'}
          </Button>
        )}
      </div>
    );
  }

  function renderCountdown(b: Booking, slots: BookingSlot[]) {
    if (b.status !== 'BOOKED' && b.status !== 'PAID') return null;
    const text = getCountdownText(slots, now);
    if (!text) return null;

    return (
      <div className="flex items-center gap-1.5 mt-1">
        <Clock className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
        <span className="text-sm text-[hsl(var(--gold))] font-medium">{text}</span>
      </div>
    );
  }

  function renderBookingCard(b: Booking) {
    const slots = normalizeSlots(b);
    const slotCount = slots.length;
    const ranges = groupConsecutiveSlots(slots);
    const showReschedule = b.status === 'BOOKED' && canReschedule(slots);

    return (
      <Card key={b.id}>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <CounselorAvatar name={b.counselorName} />
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{b.counselorName}</span>
                {slotCount > 1 && (
                  <Badge variant="outline" className="text-xs">
                    30분 x {slotCount}회
                  </Badge>
                )}
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(b.status)}>
              {getStatusLabel(b.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-muted-foreground text-sm grid gap-0.5 ml-[52px]">
            {ranges.map((range, i) => (
              <div key={i}>
                {formatDate(range.startAt)} {formatTime(range.startAt)} ~ {formatTime(range.endAt)}
              </div>
            ))}
          </div>
          <div className="ml-[52px]">
            {renderCountdown(b, slots)}
          </div>
          {b.cancelReason && (b.status === 'CANCELED' || b.status === 'CANCELLED') && (
            <div className="mt-2 text-xs text-muted-foreground ml-[52px]">
              취소 사유: {b.cancelReason}
            </div>
          )}
          {renderPaymentFailedActions(b)}
        </CardContent>
        {(b.status === 'BOOKED' || b.status === 'PAID') && (
          <CardFooter className="gap-2 flex-wrap">
            {renderEntryButton(b, slots)}
            {showReschedule && (
              <Button
                variant="outline"
                onClick={() => router.push(`/counselors/${b.counselorId}`)}
                className="rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))]"
              >
                예약 변경
              </Button>
            )}
            {b.status === 'BOOKED' && (
              <Button
                variant="destructive"
                onClick={() => openCancelModal(b.id)}
                className="rounded-full"
              >
                예약 취소
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }

  const cancelBooking = cancelBookingId !== null
    ? bookings.find((b) => b.id === cancelBookingId)
    : null;
  const cancelSlots = cancelBooking ? normalizeSlots(cancelBooking) : [];
  const cancelPolicy = cancelSlots.length > 0 ? getCancelPolicyInfo(cancelSlots) : null;

  // Check if there are any date groups with bookings
  const hasGroupedBookings = filteredBookings.length > 0;

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <h1 className="text-3xl font-black tracking-tight font-heading text-foreground">내 예약</h1>

        {message && (
          <Alert variant={message.includes('취소되었습니다') || message.includes('다시 시도') ? 'default' : 'destructive'}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {/* Status Tab Filter */}
        {!loading && !loadError && bookings.length > 0 && (
          <div className="inline-flex items-center rounded-full bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] p-1 gap-0.5 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = tabCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] font-bold'
                      : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]'
                  }`}
                >
                  {tab.label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-[120px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyStateCard
            icon="!"
            title="잠시 문제가 발생했습니다"
            description="예약 목록을 불러오지 못했습니다. 다시 시도해주세요."
            variant="error"
            actionLabel="다시 시도"
            onAction={() => load()}
          />
        ) : bookings.length === 0 ? (
          <EmptyStateCard
            icon="📅"
            title="예약 내역이 없어요"
            description="아직 예약이 없습니다. 상담사를 둘러보고 예약해보세요."
            actionLabel="상담사 둘러보기"
            actionHref="/counselors"
          />
        ) : !hasGroupedBookings ? (
          /* Empty state per filtered tab */
          <EmptyStateCard
            title={getTabEmptyMessage(activeTab)}
            description={activeTab === 'upcoming' ? '상담사를 둘러보고 새로운 상담을 예약해보세요.' : undefined}
            actionLabel={activeTab === 'upcoming' ? '상담사 둘러보기' : undefined}
            actionHref={activeTab === 'upcoming' ? '/counselors' : undefined}
          />
        ) : (
          <div className="space-y-2">
            {DATE_GROUP_ORDER.map((groupKey) => {
              const groupBookings = groupedBookings[groupKey];
              if (groupBookings.length === 0) return null;

              return (
                <div key={groupKey}>
                  <h2 className="text-sm font-bold text-[hsl(var(--text-secondary))] mb-3 mt-6">
                    {DATE_GROUP_LABELS[groupKey]}
                  </h2>
                  <div className="grid gap-4">
                    {groupBookings.map((b) => renderBookingCard(b))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancel Reason Modal */}
        <Dialog open={cancelModalOpen} onOpenChange={(open) => { if (!open) setCancelModalOpen(false); }}>
          <DialogContent className="bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] border-[hsl(var(--gold)/0.15)] rounded-2xl max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-lg">
                예약 취소
              </DialogTitle>
              <DialogDescription className="text-[hsl(var(--text-secondary))] text-sm leading-normal">
                취소 사유를 선택해주세요.
              </DialogDescription>
            </DialogHeader>

            {/* Cancel policy info */}
            {cancelPolicy && (
              <div className={`rounded-xl px-4 py-3 text-sm border ${
                cancelPolicy.refundRate === 100
                  ? 'bg-green-900/20 border-green-700/30 text-green-400'
                  : cancelPolicy.refundRate === 50
                    ? 'bg-yellow-900/20 border-yellow-700/30 text-yellow-400'
                    : 'bg-red-900/20 border-red-700/30 text-red-400'
              }`}>
                <p className="font-bold font-heading">{cancelPolicy.message}</p>
                {cancelPolicy.refundRate < 100 && (
                  <p className="text-xs mt-1 opacity-80">
                    {cancelPolicy.refundRate === 0
                      ? '이 시간대에는 취소 시 환불이 불가합니다.'
                      : '환불 금액의 50%만 돌려받으실 수 있습니다.'}
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-3 py-2">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setCancelReason(r.value)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm font-heading ${
                    cancelReason === r.value
                      ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] font-bold'
                      : 'border-[hsl(var(--gold)/0.15)] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}

              {cancelReason === 'OTHER' && (
                <textarea
                  value={cancelOtherText}
                  onChange={(e) => setCancelOtherText(e.target.value)}
                  placeholder="취소 사유를 입력해주세요..."
                  className="mt-2 w-full min-h-[80px] rounded-xl border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] px-4 py-3 text-sm placeholder:text-[hsl(var(--text-secondary))]/50 focus:ring-2 focus:ring-[hsl(var(--gold))]/30 focus:border-[hsl(var(--gold))]/40 resize-none"
                />
              )}
            </div>

            <DialogFooter className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="border-2 border-[hsl(var(--border-subtle))] text-[hsl(var(--text-primary))] bg-transparent font-heading font-bold hover:bg-[hsl(var(--surface-hover))]"
              >
                닫기
              </Button>
              <Button
                onClick={confirmCancel}
                disabled={cancelling}
                className="bg-[hsl(var(--dancheong))] text-white hover:bg-[hsl(var(--dancheong))]/90 font-heading font-bold"
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
