'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCounselorBookings } from '@/components/api-client';
import { DenseCard, PageTitle, InlineError, EmptyState, StatusBadge, StatCard } from '@/components/ui';
import { Pagination } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Booking = {
  id: number;
  customerName: string;
  customerEmail: string;
  startTime: string;
  endTime: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
};

type BookingsResponse = {
  bookings: Booking[];
  totalPages: number;
  totalElements: number;
};

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'BOOKED', label: 'BOOKED' },
  { value: 'PAID', label: 'PAID' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELED', label: 'CANCELED' },
];

const PAGE_SIZE = 20;

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function CounselorBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [page, setPage] = useState(1);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { date?: string; status?: string; page: number; size: number } = {
        page: page - 1,
        size: PAGE_SIZE,
      };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data: BookingsResponse = await getCounselorBookings(params);
      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '예약 목록을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter, statusFilter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDateFilter(e.target.value);
    setPage(1);
  }

  const confirmedCount = bookings.filter(b => b.status === 'BOOKED' || b.status === 'PAID').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>예약 내역</PageTitle>

      {/* Filter bar */}
      <DenseCard>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex rounded-md border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface-3))] p-1">
            {(['week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`h-8 rounded px-3 text-sm font-heading font-bold transition-colors ${
                  viewMode === mode
                    ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))]'
                    : 'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))]'
                }`}
              >
                {mode === 'week' ? '주간' : '월간'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium font-heading text-[hsl(var(--text-primary))] whitespace-nowrap">
              날짜
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="w-[160px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl text-[hsl(var(--text-primary))]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium font-heading text-[hsl(var(--text-primary))] whitespace-nowrap">
              상태
            </label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl text-[hsl(var(--text-primary))]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(dateFilter || statusFilter !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFilter(''); setStatusFilter('ALL'); setPage(1); }}
              className="text-sm font-heading text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]"
            >
              필터 초기화
            </Button>
          )}
        </div>
      </DenseCard>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard dense title="전체 예약" value={`${totalElements}건`} />
        <StatCard dense title="확정됨" value={`${confirmedCount}건`} hint="BOOKED + PAID" />
        <StatCard dense title="완료" value={`${completedCount}건`} />
      </div>

      <InlineError message={error} />

      {/* Bookings table */}
      {loading ? (
        <DenseCard>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 w-1/5 bg-[hsl(var(--surface))] rounded" />
                <div className="h-4 w-1/4 bg-[hsl(var(--surface))] rounded" />
                <div className="h-4 w-1/6 bg-[hsl(var(--surface))] rounded" />
                <div className="h-4 w-1/12 bg-[hsl(var(--surface))] rounded" />
                <div className="h-4 w-1/5 bg-[hsl(var(--surface))] rounded" />
              </div>
            ))}
          </div>
        </DenseCard>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="예약 내역이 없습니다"
          desc="조건에 맞는 예약이 없거나, 아직 예약이 등록되지 않았습니다."
        />
      ) : (
        <DenseCard className="overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[hsl(var(--surface))]">
              <TableRow className="border-[hsl(var(--gold)/0.15)]">
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">고객명</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">예약시간</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">상태</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">크레딧</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">예약일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => (
                <TableRow key={booking.id} className="h-10 border-[hsl(var(--gold)/0.15)] odd:bg-[hsl(var(--surface-3))/0.35]">
                  <TableCell className="font-bold font-heading">{booking.customerName}</TableCell>
                  <TableCell className="text-sm text-[hsl(var(--text-secondary))] tabular-nums">
                    {formatDateTime(booking.startTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={booking.status} />
                  </TableCell>
                  <TableCell className="font-heading tabular-nums">{booking.creditsUsed ?? '-'}</TableCell>
                  <TableCell className="text-sm text-[hsl(var(--text-secondary))] tabular-nums">
                    {formatDate(booking.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </DenseCard>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
