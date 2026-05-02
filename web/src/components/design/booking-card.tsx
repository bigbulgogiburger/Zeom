import type { ReactNode } from 'react';
import { Video, Mic } from 'lucide-react';
import { Portrait } from './portrait';
import { cn } from '@/lib/utils';

export type BookingChannel = 'video' | 'voice';
export type BookingStatus = 'upcoming' | 'completed' | 'canceled';

interface BookingCardProps {
  portrait: { name: string; imageUrl?: string | null; avatarUrl?: string | null };
  channel: BookingChannel;
  status: BookingStatus;
  dateLabel: string;
  timeLabel: string;
  durationMin?: number;
  price?: number;
  actions?: ReactNode;
  className?: string;
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  upcoming: '예약 확정',
  completed: '완료',
  canceled: '취소',
};

const CHANNEL_LABEL: Record<BookingChannel, string> = {
  video: '화상',
  voice: '음성',
};

export function BookingCard({
  portrait,
  channel,
  status,
  dateLabel,
  timeLabel,
  durationMin = 60,
  price,
  actions,
  className,
}: BookingCardProps) {
  const ChannelIcon = channel === 'video' ? Video : Mic;

  return (
    <article
      className={cn(
        'glow-card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4',
        status === 'canceled' && 'opacity-70',
        className,
      )}
    >
      {/* 좌측: 인물 + 정보 */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Portrait counselor={portrait} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-base font-bold text-text-primary">
              {portrait.name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-2 px-2 py-0.5 text-xs text-text-secondary">
              <ChannelIcon size={11} aria-hidden="true" />
              {CHANNEL_LABEL[channel]}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                status === 'upcoming' && 'bg-gold/15 text-gold',
                status === 'completed' && 'bg-success/15 text-success',
                status === 'canceled' && 'bg-destructive/15 text-destructive',
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-sm text-text-secondary">
            <span className="tabular">{dateLabel}</span>
            {' · '}
            <span className="tabular">{timeLabel}</span>
            {' '}
            <span className="text-text-muted">
              (<span className="tabular">{durationMin}</span>분)
            </span>
            {typeof price === 'number' && (
              <>
                {' · '}
                <span className="tabular text-text-primary">
                  {price.toLocaleString()}
                </span>
                <span className="ml-0.5">원</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* 우측: 액션 슬롯 */}
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
        </div>
      )}
    </article>
  );
}
