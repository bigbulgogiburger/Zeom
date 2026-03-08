'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import ChatRoom from './ChatRoom';

type SessionInfo = {
  sessionId: number;
  bookingId: number;
  currentUserId: number;
  startedAt: string;
  durationMinutes: number;
  counselorName: string;
};

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        // Load booking info to get counselor name and session details
        const [bookingRes, meRes] = await Promise.all([
          apiFetch(`/api/v1/bookings/${bookingId}`, { cache: 'no-store' }),
          apiFetch('/api/v1/auth/me', { cache: 'no-store' }),
        ]);

        if (!bookingRes.ok) throw new Error('예약 정보를 불러올 수 없습니다.');
        if (!meRes.ok) throw new Error('사용자 정보를 불러올 수 없습니다.');

        const booking = await bookingRes.json();
        const me = await meRes.json();

        // Get consultation session for this booking
        const sessionRes = await apiFetch(`/api/v1/consultations/my`, { cache: 'no-store' });
        if (!sessionRes.ok) throw new Error('상담 세션 정보를 불러올 수 없습니다.');
        const sessions = await sessionRes.json();

        // Find the session for this booking
        const session = Array.isArray(sessions)
          ? sessions.find((s: { reservationId: number }) => s.reservationId === Number(bookingId))
          : null;

        if (!session) throw new Error('이 예약에 대한 상담 세션을 찾을 수 없습니다.');

        setSessionInfo({
          sessionId: session.id,
          bookingId: Number(bookingId),
          currentUserId: me.id,
          startedAt: session.startedAt || new Date().toISOString(),
          durationMinutes: session.durationSec ? Math.ceil(session.durationSec / 60) : 30,
          counselorName: booking.counselorName || booking.counselor?.name || '상담사',
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '로딩 실패');
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [bookingId]);

  return (
    <RequireLogin>
      {loading ? (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-[var(--color-text-muted-dark)] text-sm">상담 채팅을 준비하는 중...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <div className="text-[var(--color-danger)] text-sm font-medium">{error}</div>
          <button
            onClick={() => router.push('/consultations')}
            className="px-6 py-2.5 rounded-full border border-[rgba(201,162,39,0.3)] text-[var(--color-gold)] font-heading font-bold text-sm hover:bg-[rgba(201,162,39,0.1)] transition-colors"
          >
            상담 목록으로 돌아가기
          </button>
        </div>
      ) : sessionInfo ? (
        <ChatRoom
          bookingId={sessionInfo.bookingId}
          sessionId={sessionInfo.sessionId}
          currentUserId={sessionInfo.currentUserId}
          startedAt={sessionInfo.startedAt}
          durationMinutes={sessionInfo.durationMinutes}
          counselorName={sessionInfo.counselorName}
        />
      ) : null}
    </RequireLogin>
  );
}
