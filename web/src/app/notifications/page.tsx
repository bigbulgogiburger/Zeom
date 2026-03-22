'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';
import { EmptyStateCard } from '@/components/empty-state';
import {
  Calendar,
  CreditCard,
  Video,
  Bell,
  Star,
  CheckCheck,
  ChevronRight,
} from 'lucide-react';

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    BOOKING_CONFIRMED: '예약 확정',
    CONSULTATION_REMINDER: '상담 알림',
    CONSULTATION_COMPLETED: '상담 완료',
    REFUND_REQUESTED: '환불 요청',
    REFUND_PROCESSED: '환불 처리',
    SETTLEMENT_PAID: '정산 완료',
    REVIEW_RECEIVED: '새 리뷰',
    NEW_BOOKING: '새 예약',
  };
  return labels[type] || type;
}

function getTypeIcon(type: string) {
  // Map notification types to icon categories
  if (type.includes('BOOKING') || type.includes('NEW_BOOKING')) {
    return Calendar;
  }
  if (type.includes('SETTLEMENT') || type.includes('PAYMENT')) {
    return CreditCard;
  }
  if (type.includes('CONSULTATION') || type.includes('SESSION')) {
    return Video;
  }
  if (type.includes('REVIEW')) {
    return Star;
  }
  return Bell;
}

export default function NotificationsPage() {
  const { me, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/notifications?page=${p}&size=20`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content || []);
        setTotalPages(data.totalPages || 0);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !me) {
      router.push('/login');
      return;
    }
    if (me) {
      fetchNotifications(page);
    }
  }, [me, authLoading, page, fetchNotifications, router]);

  async function handleMarkAsRead(id: number) {
    try {
      await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silently ignore
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAll(true);
    try {
      await apiFetch('/api/v1/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // silently ignore
    } finally {
      setMarkingAll(false);
    }
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      handleMarkAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  }

  if (authLoading) {
    return (
      <main className="max-w-[800px] mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-[hsl(var(--surface))] rounded-lg" />
          <div className="h-20 bg-[hsl(var(--surface))] rounded-xl" />
          <div className="h-20 bg-[hsl(var(--surface))] rounded-xl" />
        </div>
      </main>
    );
  }

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[hsl(var(--text-primary))] font-heading">
          알림
        </h1>
        <div className="flex gap-2">
          {hasUnread && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] transition-colors disabled:opacity-50 bg-transparent border-none cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? '처리 중...' : '모두 읽음 처리'}
            </button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/notification-preferences')}
            className="rounded-full border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--text-secondary))] bg-transparent font-medium hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent text-xs"
          >
            설정
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--surface))]" />
                <div className="flex-1">
                  <div className="h-5 w-2/3 bg-[hsl(var(--surface))] rounded-lg mb-2" />
                  <div className="h-4 w-4/5 bg-[hsl(var(--surface))] rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyStateCard
          icon="📭"
          title="알림이 없습니다"
          description="새로운 알림이 오면 여기에 표시됩니다"
          variant="empty"
        />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map(n => {
              const TypeIcon = getTypeIcon(n.type);

              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`rounded-xl cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    n.isRead
                      ? 'bg-black/20 border border-[hsl(var(--gold)/0.05)]'
                      : 'bg-[hsl(var(--surface-hover))] border-l-2 border border-l-[hsl(var(--gold))] border-[hsl(var(--gold)/0.15)]'
                  }`}
                >
                  <div className="px-5 py-4 flex items-start gap-3">
                    {/* Type icon */}
                    <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold)/0.08)] flex items-center justify-center shrink-0">
                      <TypeIcon className="w-5 h-5 text-[hsl(var(--gold))]" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold font-heading text-[hsl(var(--gold))] uppercase tracking-wider">
                          {typeLabel(n.type)}
                        </span>
                        {!n.isRead && (
                          <span className="block w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />
                        )}
                        <span
                          className="text-[10px] text-[#6b5c4d]"
                          title={formatFullDate(n.createdAt)}
                        >
                          {getRelativeTime(n.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm font-medium ${
                        n.isRead ? 'text-[hsl(var(--text-secondary))]' : 'text-[hsl(var(--text-primary))]'
                      }`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-[#6b5c4d] mt-1 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    {n.link && (
                      <ChevronRight className="w-4 h-4 text-[#6b5c4d] shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--text-secondary))] bg-transparent font-medium hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent disabled:opacity-30"
              >
                이전
              </Button>
              <span className="flex items-center text-sm text-[hsl(var(--text-secondary))] px-3">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--text-secondary))] bg-transparent font-medium hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent disabled:opacity-30"
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
