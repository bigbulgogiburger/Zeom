'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { Card, PageTitle, InlineError, EmptyState, ActionButton } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Slot = { startAt: string; endAt: string; id?: number };

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

      <Alert className="border-[var(--color-gold)] bg-[var(--color-gold)]/10">
        <AlertDescription className="text-sm text-[var(--color-text-on-card)]">
          스케줄을 저장하면 기존의 미래 슬롯이 모두 새 슬롯으로 교체됩니다. 신중하게 설정해 주세요.
        </AlertDescription>
      </Alert>

      {/* Add slot form */}
      <Card>
        <h3 className="font-heading font-bold text-lg text-[var(--color-accent-primary)] mb-4">
          슬롯 추가
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm">날짜</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-[160px] bg-white border-[var(--color-border-card)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm">시작 시간</Label>
            <Input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-[130px] bg-white border-[var(--color-border-card)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-heading font-medium text-sm">종료 시간</Label>
            <Input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-[130px] bg-white border-[var(--color-border-card)]"
            />
          </div>
          <Button
            onClick={handleAddSlot}
            className="bg-[var(--color-accent-primary)] text-[var(--color-text-on-dark)] font-heading font-bold hover:bg-[var(--color-accent-primary)]/90"
          >
            슬롯 추가
          </Button>
        </div>
      </Card>

      <InlineError message={error} />
      {success && (
        <div role="status" className="text-[var(--color-success)] text-sm font-medium">
          {success}
        </div>
      )}

      {/* Pending slots to save */}
      {pendingSlots.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading font-bold text-lg text-[var(--color-text-on-dark)]">
            저장 대기 슬롯 ({pendingSlots.length}개)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingSlots.map((slot, idx) => (
              <Card key={idx}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-heading font-bold text-sm">
                      {formatSlotTime(slot.startAt)}
                    </div>
                    <div className="text-[var(--color-text-muted-card)] text-xs">
                      ~ {formatSlotTime(slot.endAt)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePending(idx)}
                    className="text-[var(--color-danger)] hover:text-[var(--color-danger)] font-heading font-bold text-xs"
                  >
                    삭제
                  </Button>
                </div>
              </Card>
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
        <h3 className="font-heading font-bold text-lg text-[var(--color-text-on-dark)]">
          현재 등록된 스케줄
        </h3>
        {loading ? (
          <Card>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 w-1/3 bg-[var(--color-bg-secondary)] rounded" />
                  <div className="h-4 w-1/4 bg-[var(--color-bg-secondary)] rounded" />
                </div>
              ))}
            </div>
          </Card>
        ) : savedSlots.length === 0 ? (
          <EmptyState
            title="등록된 스케줄이 없습니다"
            desc="위에서 슬롯을 추가하고 저장해 주세요."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSlots.map((slot, idx) => (
              <Card key={slot.id ?? idx}>
                <div className="font-heading font-bold text-sm">
                  {formatSlotTime(slot.startAt)}
                </div>
                <div className="text-[var(--color-text-muted-card)] text-xs">
                  ~ {formatSlotTime(slot.endAt)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
