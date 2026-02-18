'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, startSession } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type BookingSlot = { slotId: number; startAt: string; endAt: string };

type Booking = {
  id: number;
  counselorName: string;
  counselorId: number;
  slots: BookingSlot[];
  status: string;
  creditsUsed: number;
  slotId?: number;
  startAt?: string;
  endAt?: string;
};

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
    case 'CANCELLED': return 'destructive';
    case 'COMPLETED': return 'outline';
    default: return 'secondary';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'BOOKED': return '예약됨';
    case 'PAID': return '결제완료';
    case 'CANCELLED': return '취소됨';
    case 'COMPLETED': return '완료';
    default: return status;
  }
}

const ENTRY_BEFORE_MS = 5 * 60 * 1000;  // 5 minutes before start
const ENTRY_AFTER_MS = 10 * 60 * 1000;  // 10 minutes after end

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

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [enteringId, setEnteringId] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  // Real-time countdown: update every second
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    setLoading(true);
    const r = await apiFetch('/api/v1/bookings/me', { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setMessage(json.message ?? '조회 실패');
      setLoading(false);
      return;
    }
    setBookings(json);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setMessage('조회 실패');
      setLoading(false);
    });
  }, []);

  async function cancelBooking(id: number) {
    const r = await apiFetch(`/api/v1/bookings/${id}/cancel`, { method: 'POST' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '취소 실패');

    setMessage('예약이 취소되었습니다.');
    await load();
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
          <Button variant="secondary" disabled className="rounded-full border-2 border-[#C9A227]/30 text-[#C9A227]">
            {state.minutesUntilEntry}분 후 입장 가능
          </Button>
        );
      case 'entry_available':
        return (
          <Button
            variant="default"
            disabled={enteringId === b.id}
            onClick={() => enterSession(b.id)}
            className="rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold"
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
          <Button variant="outline" disabled className="rounded-full border-2 border-[#C9A227]/30 text-[#C9A227]">
            상담 종료
          </Button>
        );
    }
  }

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <h1 className="text-3xl font-black tracking-tight font-heading text-foreground">내 예약</h1>

        {message && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-[120px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <Card>
            <CardContent>
              <div className="font-bold text-lg">예약 내역이 없어요</div>
              <div className="text-muted-foreground text-sm mt-1">
                아직 예약이 없습니다.{' '}
                <Link href="/counselors" className="text-primary underline">
                  상담사 둘러보기
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {bookings.map((b) => {
              const slots = normalizeSlots(b);
              const slotCount = slots.length;
              const ranges = groupConsecutiveSlots(slots);

              return (
                <Card key={b.id}>
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{b.counselorName}</span>
                        {slotCount > 1 && (
                          <Badge variant="outline" className="text-xs">
                            30분 x {slotCount}회
                          </Badge>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(b.status)}>
                        {getStatusLabel(b.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-muted-foreground text-sm grid gap-0.5">
                      {ranges.map((range, i) => (
                        <div key={i}>
                          {formatDate(range.startAt)} {formatTime(range.startAt)} ~ {formatTime(range.endAt)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  {(b.status === 'BOOKED' || b.status === 'PAID') && (
                    <CardFooter className="gap-2 flex-wrap">
                      {renderEntryButton(b, slots)}
                      {b.status === 'BOOKED' && (
                        <Button
                          variant="destructive"
                          onClick={() => cancelBooking(b.id)}
                          className="rounded-full"
                        >
                          예약 취소
                        </Button>
                      )}
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
