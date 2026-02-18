'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { apiFetch } from '../../../components/api-client';
import { ActionButton, Card, EmptyState } from '../../../components/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Slot = { id: number; startAt: string; endAt: string };
type CounselorDetail = { id: number; name: string; specialty: string; intro: string; slots: Slot[] };

const MAX_SLOTS = 3;

function specialtyEmoji(specialty: string): string {
  if (specialty.includes('사주')) return '🔮';
  if (specialty.includes('타로')) return '🃏';
  if (specialty.includes('신점')) return '🪷';
  if (specialty.includes('꿈')) return '🌙';
  if (specialty.includes('궁합')) return '💕';
  return '✨';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function groupSlotsByDate(slots: Slot[]): Map<string, Slot[]> {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const dateKey = formatDate(slot.startAt);
    const existing = groups.get(dateKey) || [];
    existing.push(slot);
    groups.set(dateKey, existing);
  }
  return groups;
}

/** Group consecutive selected slots into time ranges for display */
function groupConsecutiveSlots(slots: Slot[]): { startAt: string; endAt: string }[] {
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

export default function CounselorDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [counselor, setCounselor] = useState<CounselorDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<number>>(new Set());
  const [maxWarning, setMaxWarning] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/counselors/${id}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then(setCounselor)
      .catch(() => setLoadError('상담사 정보를 불러오지 못했습니다.'));
  }, [id]);

  function toggleSlot(slot: Slot) {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
        setMaxWarning('');
      } else {
        if (next.size >= MAX_SLOTS) {
          setMaxWarning(`최대 ${MAX_SLOTS}개 슬롯까지 선택할 수 있습니다.`);
          return prev;
        }
        next.add(slot.id);
        setMaxWarning('');
      }
      return next;
    });
    setShowConfirm(false);
    setBookingError('');
  }

  const selectedSlots = counselor
    ? counselor.slots.filter((s) => selectedSlotIds.has(s.id))
    : [];

  async function handleBook() {
    if (selectedSlots.length === 0 || !counselor) return;
    setBooking(true);
    setBookingError('');

    try {
      const res = await apiFetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counselorId: Number(id), slotIds: selectedSlots.map((s) => s.id) }),
      });
      const json = await res.json();

      if (!res.ok) {
        setBookingError(json.message ?? '예약에 실패했습니다.');
        setBooking(false);
        return;
      }

      setShowConfirm(false);
      setBookingSuccess(true);
      setCounselor((prev) =>
        prev ? { ...prev, slots: prev.slots.filter((s) => !selectedSlotIds.has(s.id)) } : prev
      );

      setTimeout(() => router.push('/bookings/me'), 2000);
    } catch {
      setBookingError('네트워크 오류가 발생했습니다.');
    } finally {
      setBooking(false);
    }
  }

  // Loading error state
  if (loadError) {
    return (
      <main className="p-6 max-w-[800px] mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  // Loading skeleton
  if (!counselor) {
    return (
      <main className="p-6 max-w-[800px] mx-auto">
        <div className="grid gap-3">
          <div className="h-8 w-40 bg-muted rounded" />
          <Card>
            <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-3" />
            <div className="h-5 w-2/5 bg-muted rounded mx-auto mb-2" />
            <div className="h-3.5 w-3/5 bg-muted rounded mx-auto" />
          </Card>
        </div>
      </main>
    );
  }

  // Booking success view
  if (bookingSuccess) {
    return (
      <main className="p-6 max-w-[800px] mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
          예약이 완료되었습니다!
        </h2>
        <p className="text-muted-foreground text-sm">
          내 예약 페이지로 이동합니다...
        </p>
      </main>
    );
  }

  const slotsByDate = groupSlotsByDate(counselor.slots);

  return (
    <main className="p-6 max-w-[800px] mx-auto grid gap-6">
      {/* Counselor Info Header */}
      <Card>
        <div className="flex flex-col items-center text-center gap-3">
          <div className="text-[2.5rem]">
            {specialtyEmoji(counselor.specialty)}
          </div>
          <div>
            <h2 className="m-0 font-heading font-bold text-2xl text-card-foreground">
              {counselor.name}
            </h2>
            <Badge variant="secondary" className="mt-2 font-heading font-bold text-xs rounded-full">
              {counselor.specialty}
            </Badge>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed max-w-[500px]">
            {counselor.intro}
          </p>
        </div>
      </Card>

      {/* Available Slots Section */}
      <div>
        <h3 className="m-0 mb-4 font-heading text-xl text-foreground">
          예약 가능 슬롯
        </h3>

        {counselor.slots.length === 0 ? (
          <EmptyState title="현재 가능한 슬롯이 없어요" desc="다른 상담사 또는 시간대를 확인해주세요." />
        ) : (
          <div className="grid gap-4">
            {Array.from(slotsByDate.entries()).map(([dateLabel, slots]) => (
              <div key={dateLabel}>
                <h4 className="m-0 mb-2 font-heading text-base font-bold text-foreground">
                  {dateLabel}
                </h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
                  {slots.map((s) => {
                    const isSelected = selectedSlotIds.has(s.id);
                    return (
                      <Button
                        key={s.id}
                        variant="outline"
                        onClick={() => toggleSlot(s)}
                        className={cn(
                          'relative p-3 text-center font-heading font-medium text-sm transition-all h-auto',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                            : 'border-border bg-card text-card-foreground'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-1 right-1 text-xs leading-none">
                            ✓
                          </span>
                        )}
                        {formatTime(s.startAt)} ~ {formatTime(s.endAt)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            {maxWarning && (
              <div className="text-yellow-600 text-sm font-medium text-center">
                {maxWarning}
              </div>
            )}

            {selectedSlots.length > 0 && (
              <div className="flex justify-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-primary border-primary font-heading font-bold text-sm rounded-full px-3">
                  {selectedSlots.length}개 슬롯 선택됨 ({selectedSlots.length * 30}분)
                </Badge>
                <Badge variant="secondary" className="font-heading font-bold text-sm rounded-full px-3">
                  상담권 {selectedSlots.length}회 사용
                </Badge>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking CTA */}
      {selectedSlots.length > 0 && !showConfirm && (
        <div className="sticky bottom-4 text-center pt-3">
          <ActionButton
            onClick={() => { setShowConfirm(true); setBookingError(''); }}
            className="w-full max-w-[400px]"
          >
            예약하기 ({selectedSlots.length}개 슬롯)
          </ActionButton>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && selectedSlots.length > 0 && (
        <Card className="border-primary">
          <h3 className="m-0 mb-4 font-heading font-bold text-lg text-center">
            예약 확인
          </h3>

          <div className="grid gap-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">상담사</span>
              <span className="font-bold">{counselor.name}</span>
            </div>

            {groupConsecutiveSlots(selectedSlots).map((range, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">
                  {i === 0 ? '시간' : ''}
                </span>
                <span className="font-bold">
                  {formatDate(range.startAt)} {formatTime(range.startAt)} ~ {formatTime(range.endAt)}
                </span>
              </div>
            ))}

            <div className="border-t border-border pt-2 mt-1 grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 소요시간</span>
                <span className="font-bold">{selectedSlots.length * 30}분</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">사용 상담권</span>
                <span className="font-bold">{selectedSlots.length}회</span>
              </div>
            </div>
          </div>

          {bookingError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}

          <div className={cn('flex gap-2', bookingError && 'mt-2')}>
            <Button
              variant="outline"
              onClick={() => { setShowConfirm(false); setBookingError(''); }}
              disabled={booking}
              className="flex-1 font-heading font-bold"
            >
              취소
            </Button>
            <ActionButton
              onClick={handleBook}
              loading={booking}
              className="flex-1"
            >
              예약 확정
            </ActionButton>
          </div>
        </Card>
      )}
    </main>
  );
}
