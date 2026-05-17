'use client';

import { Fragment, useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { DenseCard, PageTitle, InlineError, EmptyState, ActionButton } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Slot = { startAt: string; endAt: string; id?: number };

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const TIME_BLOCKS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function formatSlotTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }) + ' ' + d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function CounselorSchedulePage() {
  const [savedSlots, setSavedSlots] = useState<Slot[]>([]);
  const [pendingSlots, setPendingSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const weekStart = new Date();
  const currentDay = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - currentDay + 1);
  weekStart.setHours(0, 0, 0, 0);

  function slotState(dayIndex: number, time: string): 'saved' | 'pending' | 'empty' {
    const target = new Date(weekStart);
    target.setDate(weekStart.getDate() + dayIndex);
    const dateKey = target.toISOString().slice(0, 10);
    const startKey = `${dateKey}T${time}:00`;
    if (pendingSlots.some((slot) => slot.startAt === startKey)) return 'pending';
    if (savedSlots.some((slot) => slot.startAt.slice(0, 16) === startKey.slice(0, 16))) return 'saved';
    return 'empty';
  }

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/counselor/schedule');
      if (!res.ok) throw new Error('스케줄을 불러올 수 없습니다.');
      const data = await res.json();
      setSavedSlots(data.slots || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '스케줄을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  function handleAddSlot() {
    setError('');
    setSuccess('');

    if (!date || !startTime || !endTime) {
      setError('날짜, 시작 시간, 종료 시간을 모두 입력해 주세요.');
      return;
    }

    const startAt = `${date}T${startTime}:00`;
    const endAt = `${date}T${endTime}:00`;

    if (startAt >= endAt) {
      setError('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }

    const duplicate = pendingSlots.some(s => s.startAt === startAt && s.endAt === endAt);
    if (duplicate) {
      setError('이미 추가된 슬롯입니다.');
      return;
    }

    setPendingSlots(prev => [...prev, { startAt, endAt }]);
    setStartTime('');
    setEndTime('');
  }

  function handleRemovePending(index: number) {
    setPendingSlots(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (pendingSlots.length === 0) {
      setError('저장할 슬롯이 없습니다. 슬롯을 추가해 주세요.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/v1/counselor/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: pendingSlots }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '스케줄 저장에 실패했습니다.');
      }
      const data = await res.json();
      setSavedSlots(data.slots || []);
      setPendingSlots([]);
      setSuccess('스케줄이 저장되었습니다.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '스케줄 저장에 실패했습니다.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>스케줄 관리</PageTitle>

      <Alert className="border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 rounded-xl">
        <AlertDescription className="text-sm text-[hsl(var(--text-primary))]">
          스케줄을 저장하면 기존의 미래 슬롯이 모두 새 슬롯으로 교체됩니다. 신중하게 설정해 주세요.
        </AlertDescription>
      </Alert>

      {/* Add slot form */}
      <DenseCard>
        <h3 className="font-heading font-bold text-lg text-[hsl(var(--gold))] mb-4">
          슬롯 추가
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm text-[hsl(var(--text-secondary))]">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-[160px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl text-[hsl(var(--text-primary))]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm text-[hsl(var(--text-secondary))]">시작 시간</Label>
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-[130px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl text-[hsl(var(--text-primary))]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm text-[hsl(var(--text-secondary))]">종료 시간</Label>
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-[130px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl text-[hsl(var(--text-primary))]"
            />
          </div>
          <Button
            onClick={handleAddSlot}
            className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] rounded-full px-8 py-3 font-heading font-bold"
          >
            슬롯 추가
          </Button>
        </div>
      </DenseCard>

      <InlineError message={error} />
      {success && (
        <div role="status" className="text-[hsl(var(--success))] text-sm font-medium">
          {success}
        </div>
      )}

      <DenseCard>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-heading text-base font-bold text-[hsl(var(--text-primary))]">
            주간 슬롯
          </h3>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-secondary))]">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[hsl(var(--gold))]" /> 저장됨</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-[hsl(var(--warning))]" /> 대기</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="grid min-w-[720px] grid-cols-[72px_repeat(7,1fr)] gap-px rounded-md border border-[hsl(var(--border-subtle))] bg-[hsl(var(--border-subtle))]">
            <div className="bg-[hsl(var(--surface-3))] p-2 text-xs font-heading text-[hsl(var(--text-secondary))]">시간</div>
            {WEEKDAY_LABELS.map((label, dayIndex) => (
              <div key={label} className="bg-[hsl(var(--surface-3))] p-2 text-center text-xs font-heading font-bold text-[hsl(var(--text-primary))]">
                {label}
                <span className="ml-1 tabular-nums text-[hsl(var(--text-secondary))]">
                  {new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayIndex).getDate()}
                </span>
              </div>
            ))}
            {TIME_BLOCKS.map((time) => (
              <Fragment key={time}>
                <div key={`${time}-label`} className="bg-[hsl(var(--surface-3))] p-2 text-xs tabular-nums text-[hsl(var(--text-secondary))]">
                  {time}
                </div>
                {WEEKDAY_LABELS.map((label, dayIndex) => {
                  const state = slotState(dayIndex, time);
                  return (
                    <button
                      key={`${label}-${time}`}
                      type="button"
                      aria-pressed={state !== 'empty'}
                      className={`h-9 bg-[hsl(var(--surface))] text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] ${
                        state === 'saved'
                          ? 'text-[hsl(var(--gold))] shadow-[inset_0_0_0_1px_hsl(var(--gold))]'
                          : state === 'pending'
                          ? 'text-[hsl(var(--warning))] shadow-[inset_0_0_0_1px_hsl(var(--warning))]'
                          : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--surface-hover))]'
                      }`}
                    >
                      {state === 'empty' ? '빈 슬롯' : state === 'saved' ? '예약 가능' : '저장 대기'}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </DenseCard>

      {/* Pending slots to save */}
      {pendingSlots.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading font-bold text-lg text-[hsl(var(--text-primary))]">
            저장 대기 슬롯 ({pendingSlots.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSlots.map((slot, idx) => (
              <DenseCard key={idx}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {formatSlotTime(slot.startAt)}
                    </div>
                    <div className="text-[hsl(var(--text-secondary))] text-xs">
                      ~ {formatSlotTime(slot.endAt)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePending(idx)}
                    className="text-[hsl(var(--dancheong))] hover:text-[hsl(var(--dancheong))] font-heading font-bold text-xs hover:bg-[hsl(var(--dancheong))]/10"
                  >
                    삭제
                  </Button>
                </div>
              </DenseCard>
            ))}
          </div>
          <div className="flex justify-end">
            <ActionButton loading={saving} onClick={handleSave}>
              스케줄 저장
            </ActionButton>
          </div>
        </div>
      )}

      {/* Current saved schedule */}
      <div className="flex flex-col gap-3">
        <h3 className="font-heading font-bold text-lg text-[hsl(var(--text-primary))]">
          현재 등록된 스케줄
        </h3>
        {loading ? (
          <DenseCard>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 w-1/3 bg-[hsl(var(--surface))] rounded" />
                  <div className="h-4 w-1/4 bg-[hsl(var(--surface))] rounded" />
                </div>
              ))}
            </div>
          </DenseCard>
        ) : savedSlots.length === 0 ? (
          <EmptyState
            title="등록된 스케줄이 없습니다"
            desc="위에서 슬롯을 추가하고 저장해 주세요."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSlots.map((slot, idx) => (
              <DenseCard key={slot.id ?? idx}>
                <div className="font-heading font-bold text-sm">
                  {formatSlotTime(slot.startAt)}
                </div>
                <div className="text-[hsl(var(--text-secondary))] text-xs">
                  ~ {formatSlotTime(slot.endAt)}
                </div>
              </DenseCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
