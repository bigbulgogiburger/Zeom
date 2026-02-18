'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCounselorTodayBookings, startSession } from '@/components/api-client';
import { Card, PageTitle, InlineError, EmptyState, StatusBadge, ActionButton } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Booking = {
  id: number;
  customerName: string;
  startTime: string;
  endTime: string;
  status: string;
  sessionType?: string;
  durationMinutes?: number;
};

export default function CounselorDashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setLoading(true);
    setError('');
    try {
      const data = await getCounselorTodayBookings();
      setBookings(Array.isArray(data) ? data : data.content || []);
    } catch (err: any) {
      setError(err.message || '오늘 상담 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSession(bookingId: number) {
    setStartingId(bookingId);
    try {
      await startSession(String(bookingId));
      router.push(`/counselor/consultation/${bookingId}`);
    } catch (err: any) {
      setError(err.message || '상담실 입장에 실패했습니다.');
      setStartingId(null);
    }
  }

  function formatTime(isoString: string) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }

  const now = new Date();
  const upcomingBookings = bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="flex flex-col space-y-8 max-w-[1000px] mx-auto w-full">
      <PageTitle>대시보드</PageTitle>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card>
          <div className="text-[#C9A227] text-sm font-medium mb-1 font-heading">
            오늘 전체 상담
          </div>
          <div className="text-2xl font-black leading-tight font-heading text-[#f9f5ed]">
            {bookings.length}건
          </div>
        </Card>
        <Card>
          <div className="text-[#C9A227] text-sm font-medium mb-1 font-heading">
            대기 중
          </div>
          <div className="text-2xl font-black leading-tight font-heading text-[#f9f5ed]">
            {upcomingBookings.length}건
          </div>
        </Card>
        <Card>
          <div className="text-[#C9A227] text-sm font-medium mb-1 font-heading">
            완료
          </div>
          <div className="text-2xl font-black leading-tight font-heading text-[#f9f5ed]">
            {completedBookings.length}건
          </div>
        </Card>
      </div>

      <InlineError message={error} />

      {/* Today's bookings */}
      <div>
        <h3 className="text-lg font-bold font-heading text-[#f9f5ed] mb-4">
          오늘 상담 목록
        </h3>

        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <div className="animate-pulse flex items-center gap-4">
                  <div className="h-10 w-10 bg-[#1a1612] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-[#1a1612] rounded" />
                    <div className="h-3 w-1/4 bg-[#1a1612] rounded" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            title="오늘 예정된 상담이 없습니다"
            desc="새로운 예약이 들어오면 여기에 표시됩니다."
          />
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <Card key={booking.id}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold font-heading text-base">
                        {booking.customerName}
                      </span>
                      <StatusBadge value={booking.status} />
                    </div>
                    <div className="text-sm text-[#a49484]">
                      {formatTime(booking.startTime)} ~ {formatTime(booking.endTime)}
                      {booking.durationMinutes && ` (${booking.durationMinutes}분)`}
                    </div>
                  </div>

                  {(booking.status === 'BOOKED' || booking.status === 'PAID') && (
                    <ActionButton
                      loading={startingId === booking.id}
                      onClick={() => handleStartSession(booking.id)}
                    >
                      상담실 입장
                    </ActionButton>
                  )}

                  {booking.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={() => router.push(`/counselor/consultation/${booking.id}`)}
                      className="bg-green-600 text-white font-heading font-bold rounded-full hover:bg-green-700"
                    >
                      상담 중 - 입장
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
