'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import {
  Card,
  EmptyState,
  InlineError,
  PageTitle,
  StatusBadge,
} from '../../components/ui';
import { cn } from '@/lib/utils';

type Consultation = {
  id: number;
  reservationId: number;
  counselorName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  status: string;
  hasReview: boolean;
};

type FilterValue = 'all' | 'active' | 'completed';

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '진행중' },
  { value: 'completed', label: '완료' },
];

const ACTIVE_STATUSES = new Set(['ACTIVE', 'IN_PROGRESS', 'WAITING', 'STARTED']);
const COMPLETED_STATUSES = new Set(['COMPLETED', 'ENDED']);

function isActive(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

function isCompleted(status: string): boolean {
  return COMPLETED_STATUSES.has(status);
}

export default function ConsultationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFilter =
    (searchParams.get('status') as FilterValue | null) ?? 'all';
  const [filter, setFilter] = useState<FilterValue>(
    FILTERS.some((f) => f.value === initialFilter) ? initialFilter : 'all',
  );
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  async function loadConsultations() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiFetch('/api/v1/consultations/me', { cache: 'no-store' });
      if (!res.ok) {
        const json = await res.json();
        setMessage(json.message || '상담 내역을 불러올 수 없습니다.');
        setLoadError(true);
        setConsultations([]);
        return;
      }
      const data = await res.json();
      setConsultations(data);
      setMessage('');
    } catch {
      setMessage('상담 내역을 불러오는 중 오류가 발생했습니다.');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConsultations();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'active') return consultations.filter((c) => isActive(c.status));
    if (filter === 'completed')
      return consultations.filter((c) => isCompleted(c.status));
    return consultations;
  }, [consultations, filter]);

  function formatDuration(minutes: number) {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
    }
    return `${minutes}분`;
  }

  function changeFilter(value: FilterValue) {
    setFilter(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'all') next.delete('status');
    else next.set('status', value);
    const qs = next.toString();
    router.replace(qs ? `/consultations?${qs}` : '/consultations', { scroll: false });
  }

  function handleTabKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') {
      return;
    }
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowLeft') next = (idx - 1 + FILTERS.length) % FILTERS.length;
    else if (e.key === 'ArrowRight') next = (idx + 1) % FILTERS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = FILTERS.length - 1;
    const target = FILTERS[next];
    changeFilter(target.value);
    const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      'button[role="tab"]',
    );
    buttons?.[next]?.focus();
  }

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>상담 내역</PageTitle>
        <InlineError message={message} />

        {/* Status filter Seg */}
        <div
          role="tablist"
          aria-label="상담 상태 필터"
          className="inline-flex bg-[hsl(var(--surface))] rounded-full p-1 border border-[hsl(var(--gold)/0.15)]"
        >
          {FILTERS.map((f, i) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              tabIndex={filter === f.value ? 0 : -1}
              onClick={() => changeFilter(f.value)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
              className={cn(
                'px-4 py-1.5 text-sm font-heading font-bold rounded-full transition-colors',
                filter === f.value
                  ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))]'
                  : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[hsl(var(--text-secondary))]">
              불러오는 중...
            </div>
          </Card>
        ) : loadError ? (
          <EmptyState
            icon="!"
            title="잠시 문제가 발생했습니다"
            desc="상담 내역을 불러오지 못했습니다. 다시 시도해주세요."
            variant="error"
            actionLabel="다시 시도"
            onAction={() => loadConsultations()}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="size-5" aria-hidden />}
            title={
              filter === 'all'
                ? '아직 상담 내역이 없습니다'
                : filter === 'active'
                ? '진행 중인 상담이 없습니다'
                : '완료된 상담이 없습니다'
            }
            desc={
              filter === 'all'
                ? '상담사를 둘러보고 첫 상담을 시작해보세요.'
                : '상태 필터를 바꿔 다른 상담을 확인할 수 있어요.'
            }
            actionLabel={filter === 'all' ? '첫 상담 시작하기' : undefined}
            actionHref={filter === 'all' ? '/counselors' : undefined}
          />
        ) : (
          <div className="grid gap-6">
            {filtered.map((c) => (
              <Card key={c.id}>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex gap-2 items-center mb-2 flex-wrap">
                      <h3 className="m-0 text-lg font-bold font-heading">
                        {c.counselorName}
                      </h3>
                      <StatusBadge value={c.status} />
                    </div>

                    <div className="grid gap-1 text-sm text-[hsl(var(--text-secondary))] tabular-nums">
                      <div>
                        <span>시작: </span>
                        <span>{new Date(c.startedAt).toLocaleString('ko-KR')}</span>
                      </div>
                      {c.endedAt && (
                        <div>
                          <span>종료: </span>
                          <span>{new Date(c.endedAt).toLocaleString('ko-KR')}</span>
                        </div>
                      )}
                      <div>
                        <span>시간: </span>
                        <span className="font-medium">
                          {formatDuration(c.durationMinutes)}
                        </span>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'mt-4 px-4 py-2 rounded-full text-xs font-medium inline-block',
                        c.hasReview
                          ? 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]'
                          : 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
                      )}
                    >
                      {c.hasReview ? '리뷰 작성 완료' : '리뷰 작성 대기'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    {!c.hasReview && c.status === 'COMPLETED' && (
                      <button
                        onClick={() => router.push(`/consultation/${c.id}/review`)}
                        className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] px-6 py-2 text-sm rounded-full border-none cursor-pointer font-bold font-heading"
                      >
                        리뷰 작성
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
