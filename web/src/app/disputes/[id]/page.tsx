'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, FileText } from 'lucide-react';
import { apiFetch } from '../../../components/api-client';
import { RequireLogin } from '../../../components/route-guard';
import { Card, InlineError, PageTitle } from '../../../components/ui';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { cn } from '@/lib/utils';

type DisputeDetail = {
  id: number;
  reservationId: number;
  category: string;
  description: string;
  status: string;
  resolution: string | null;
  resolutionType: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Speaker = 'user' | 'counselor' | 'admin' | 'system';

type ThreadEntry = {
  id: string;
  speaker: Speaker;
  speakerLabel: string;
  body: string;
  at: string;
};

type TimelineEntry = {
  id: string;
  label: string;
  at: string;
  variant: 'pending' | 'active' | 'done';
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: '접수됨',
    className: 'bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning))]',
  },
  IN_REVIEW: {
    label: '검토중',
    className: 'bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold))]',
  },
  RESOLVED: {
    label: '해결됨',
    className: 'bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]',
  },
};

const CATEGORY_MAP: Record<string, string> = {
  SERVICE_ISSUE: '서비스 문제',
  BILLING_ISSUE: '결제 문제',
  COUNSELOR_ISSUE: '상담사 문제',
  OTHER: '기타',
};

const RESOLUTION_TYPE_MAP: Record<string, string> = {
  REFUND: '환불 처리',
  CREDIT: '보상 크레딧 지급',
  WARNING: '상담사 경고',
  DISMISS: '기각',
};

const SPEAKER_STYLE: Record<
  Speaker,
  { label: string; border: string; bg: string; text: string }
> = {
  user: {
    label: '나',
    border: 'border-l-[hsl(var(--text-primary))]',
    bg: 'bg-[hsl(var(--text-primary)/0.05)]',
    text: 'text-[hsl(var(--text-primary))]',
  },
  counselor: {
    label: '상담사',
    border: 'border-l-[hsl(var(--jade))]',
    bg: 'bg-[hsl(var(--jade)/0.08)]',
    text: 'text-[hsl(var(--jade))]',
  },
  admin: {
    label: '관리자',
    border: 'border-l-[hsl(var(--gold))]',
    bg: 'bg-[hsl(var(--gold)/0.08)]',
    text: 'text-[hsl(var(--gold))]',
  },
  system: {
    label: '시스템',
    border: 'border-l-[hsl(var(--text-secondary))]',
    bg: 'bg-[hsl(var(--surface))]',
    text: 'text-[hsl(var(--text-secondary))]',
  },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeDetail | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    let alive = true;
    async function loadDispute() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/v1/disputes/${params.id}`, {
          cache: 'no-store',
        });
        if (!alive) return;
        if (!res.ok) {
          const json = await res.json();
          setMessage(json.message || '분쟁 정보를 불러올 수 없습니다.');
          return;
        }
        setDispute(await res.json());
      } catch {
        if (alive) setMessage('분쟁 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadDispute();
    return () => {
      alive = false;
    };
  }, [params.id]);

  const timeline: TimelineEntry[] = useMemo(() => {
    if (!dispute) return [];
    const entries: TimelineEntry[] = [
      {
        id: 'created',
        label: '분쟁 접수',
        at: dispute.createdAt,
        variant: 'done',
      },
    ];
    if (dispute.status === 'IN_REVIEW' || dispute.status === 'RESOLVED') {
      entries.push({
        id: 'review',
        label: '관리자 검토 시작',
        at: dispute.updatedAt,
        variant: dispute.status === 'IN_REVIEW' ? 'active' : 'done',
      });
    }
    if (dispute.status === 'RESOLVED' && dispute.resolvedAt) {
      entries.push({
        id: 'resolved',
        label: '해결 완료',
        at: dispute.resolvedAt,
        variant: 'done',
      });
    } else {
      entries.push({
        id: 'pending',
        label: '해결 대기',
        at: '',
        variant: 'pending',
      });
    }
    return entries;
  }, [dispute]);

  const thread: ThreadEntry[] = useMemo(() => {
    if (!dispute) return [];
    const out: ThreadEntry[] = [
      {
        id: 'user-desc',
        speaker: 'user',
        speakerLabel: SPEAKER_STYLE.user.label,
        body: dispute.description,
        at: dispute.createdAt,
      },
    ];
    if (dispute.status === 'IN_REVIEW') {
      out.push({
        id: 'sys-review',
        speaker: 'system',
        speakerLabel: SPEAKER_STYLE.system.label,
        body: '관리자가 분쟁을 검토 중입니다.',
        at: dispute.updatedAt,
      });
    }
    if (dispute.status === 'RESOLVED') {
      if (dispute.resolutionNote) {
        out.push({
          id: 'admin-note',
          speaker: 'admin',
          speakerLabel: SPEAKER_STYLE.admin.label,
          body: dispute.resolutionNote,
          at: dispute.resolvedAt ?? dispute.updatedAt,
        });
      }
      if (dispute.resolutionType) {
        out.push({
          id: 'sys-resolution',
          speaker: 'system',
          speakerLabel: SPEAKER_STYLE.system.label,
          body: `처리 결과: ${RESOLUTION_TYPE_MAP[dispute.resolutionType] || dispute.resolutionType}`,
          at: dispute.resolvedAt ?? dispute.updatedAt,
        });
      }
    }
    return out;
  }, [dispute]);

  return (
    <RequireLogin>
      <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            onClick={() => router.push('/disputes')}
            className="text-[hsl(var(--gold))] font-heading font-bold gap-1 px-2"
          >
            <ChevronLeft className="size-4" aria-hidden /> 목록
          </Button>
          <PageTitle>분쟁 상세</PageTitle>
        </div>

        <InlineError message={message} />

        {loading ? (
          <Card>
            <div className="text-center py-8 text-[hsl(var(--text-secondary))]">
              불러오는 중...
            </div>
          </Card>
        ) : dispute ? (
          <div className="space-y-6">
            <Card>
              <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="m-0 text-xl font-bold font-heading">
                    {CATEGORY_MAP[dispute.category] || dispute.category}
                  </h3>
                  {(() => {
                    const statusInfo = STATUS_MAP[dispute.status] || {
                      label: dispute.status,
                      className: '',
                    };
                    return (
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-heading font-bold text-xs rounded-full',
                          statusInfo.className,
                        )}
                      >
                        {statusInfo.label}
                      </Badge>
                    );
                  })()}
                </div>

                <div className="grid gap-2 text-sm tabular-nums">
                  <div>
                    <span className="text-[hsl(var(--text-secondary))]">예약 번호: </span>
                    <span className="font-bold">{dispute.reservationId}</span>
                  </div>
                  <div>
                    <span className="text-[hsl(var(--text-secondary))]">접수일: </span>
                    <span>{formatDateTime(dispute.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline — left dot column + right card */}
            <Card>
              <h3 className="m-0 mb-6 text-lg font-bold font-heading">처리 진행</h3>
              <ol className="grid grid-cols-[28px_1fr] gap-x-4">
                {timeline.map((entry, idx) => {
                  const isLast = idx === timeline.length - 1;
                  return (
                    <li key={entry.id} className="contents">
                      {/* Dot column */}
                      <div className="flex flex-col items-center">
                        <span
                          aria-hidden
                          className={cn(
                            'w-3 h-3 rounded-full mt-1.5 shrink-0',
                            entry.variant === 'done' && 'bg-[hsl(var(--gold))]',
                            entry.variant === 'active' &&
                              'bg-[hsl(var(--gold)/0.5)] ring-2 ring-[hsl(var(--gold))]',
                            entry.variant === 'pending' && 'bg-[hsl(var(--border-subtle))]',
                          )}
                        />
                        {!isLast && (
                          <span
                            aria-hidden
                            className="w-px flex-1 min-h-6 bg-[hsl(var(--border-subtle))] my-1"
                          />
                        )}
                      </div>

                      {/* Body column */}
                      <div className={cn('pb-6', isLast && 'pb-0')}>
                        <div
                          className={cn(
                            'font-bold font-heading text-sm',
                            entry.variant === 'pending'
                              ? 'text-[hsl(var(--text-secondary))]'
                              : 'text-[hsl(var(--text-primary))]',
                          )}
                        >
                          {entry.label}
                        </div>
                        {entry.at && (
                          <div className="text-xs text-[hsl(var(--text-secondary))] mt-1 tabular-nums">
                            {formatDateTime(entry.at)}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            {/* Thread — 3 speaker colors */}
            <Card>
              <h3 className="m-0 mb-6 text-lg font-bold font-heading">대화 기록</h3>
              <div className="grid gap-4">
                {thread.map((entry) => {
                  const style = SPEAKER_STYLE[entry.speaker];
                  return (
                    <article
                      key={entry.id}
                      className={cn(
                        'rounded-xl px-4 py-3 border-l-4 grid gap-1',
                        style.bg,
                        style.border,
                      )}
                    >
                      <header className="flex items-center justify-between gap-3 flex-wrap">
                        <span
                          className={cn(
                            'font-heading font-bold text-sm',
                            style.text,
                          )}
                        >
                          {entry.speakerLabel}
                        </span>
                        <time className="text-xs text-[hsl(var(--text-secondary))] tabular-nums">
                          {formatDateTime(entry.at)}
                        </time>
                      </header>
                      <p className="m-0 whitespace-pre-wrap text-sm text-[hsl(var(--text-primary))]">
                        {entry.body}
                      </p>
                    </article>
                  );
                })}
              </div>
            </Card>

            {/* Attachments — placeholder section (백엔드 미지원) */}
            <Card variant="surface">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <FileText
                    className="size-5 text-[hsl(var(--text-secondary))]"
                    aria-hidden
                  />
                  <div>
                    <div className="text-sm font-bold font-heading">첨부 파일</div>
                    <div className="text-xs text-[hsl(var(--text-secondary))]">
                      현재 분쟁에는 첨부 파일이 없습니다.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </main>
    </RequireLogin>
  );
}
