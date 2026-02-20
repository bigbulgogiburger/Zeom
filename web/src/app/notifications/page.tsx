'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { useAuth } from '@/components/auth-context';
import { Button } from '@/components/ui/button';

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: string;
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString('ko-KR');
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
          <div className="h-8 w-32 bg-[#1a1612] rounded-lg" />
          <div className="h-20 bg-[#1a1612] rounded-xl" />
          <div className="h-20 bg-[#1a1612] rounded-xl" />
        </div>
      </main>
    );
  }

  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <main className="max-w-[800px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
          알림
        </h1>
        <div className="flex gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="rounded-full border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent font-medium hover:border-[#C9A227] hover:text-[#C9A227] hover:bg-transparent text-xs"
            >
              {markingAll ? '처리 중...' : '모두 읽음'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/notification-preferences')}
            className="rounded-full border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent font-medium hover:border-[#C9A227] hover:text-[#C9A227] hover:bg-transparent text-xs"
          >
            설정
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-xl p-5 animate-pulse">
              <div className="h-5 w-2/3 bg-[#1a1612] rounded-lg mb-2" />
              <div className="h-4 w-4/5 bg-[#1a1612] rounded-lg" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8">
          <div className="text-center py-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b5c4d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p className="font-bold font-heading text-xl text-[var(--color-text-on-dark)]">
              알림이 없습니다
            </p>
            <p className="text-[#a49484] text-sm mt-2">
              새로운 알림이 생기면 여기에 표시됩니다.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                  n.isRead
                    ? 'bg-black/20 border-[rgba(201,162,39,0.05)]'
                    : 'bg-[rgba(201,162,39,0.06)] border-[rgba(201,162,39,0.15)]'
                }`}
              >
                <div className="px-5 py-4 flex items-start gap-3">
                  {/* Unread indicator */}
                  <div className="pt-1.5 w-3 flex-shrink-0">
                    {!n.isRead && (
                      <span className="block w-2.5 h-2.5 rounded-full bg-[#C9A227]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold font-heading text-[#C9A227] uppercase tracking-wider">
                        {typeLabel(n.type)}
                      </span>
                      <span className="text-[10px] text-[#6b5c4d]">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${
                      n.isRead ? 'text-[#a49484]' : 'text-[var(--color-text-on-dark)]'
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b5c4d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent font-medium hover:border-[#C9A227] hover:text-[#C9A227] hover:bg-transparent disabled:opacity-30"
              >
                이전
              </Button>
              <span className="flex items-center text-sm text-[#a49484] px-3">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-full border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent font-medium hover:border-[#C9A227] hover:text-[#C9A227] hover:bg-transparent disabled:opacity-30"
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
