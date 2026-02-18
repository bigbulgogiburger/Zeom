'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCounselorBookings } from '@/components/api-client';
import { Card, PageTitle, InlineError, EmptyState, StatusBadge, StatCard } from '@/components/ui';
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
      <Card>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium font-heading text-[#f9f5ed] whitespace-nowrap">
              날짜
            </label>
            <Input
              type="date"
              value={dateFilter}
              onChange={handleDateChange}
              className="w-[160px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium font-heading text-[#f9f5ed] whitespace-nowrap">
              상태
            </label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[150px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed]">
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
              className="text-sm font-heading text-[#a49484] hover:text-[#C9A227]"
            >
              필터 초기화
            </Button>
          )}
        </div>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="전체 예약" value={`${totalElements}건`} />
        <StatCard title="확정됨" value={`${confirmedCount}건`} hint="BOOKED + PAID" />
        <StatCard title="완료" value={`${completedCount}건`} />
      </div>

      <InlineError message={error} />

      {/* Bookings table */}
      {loading ? (
        <Card>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-4 w-1/5 bg-[#1a1612] rounded" />
                <div className="h-4 w-1/4 bg-[#1a1612] rounded" />
                <div className="h-4 w-1/6 bg-[#1a1612] rounded" />
                <div className="h-4 w-1/12 bg-[#1a1612] rounded" />
                <div className="h-4 w-1/5 bg-[#1a1612] rounded" />
              </div>
            ))}
          </div>
        </Card>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="예약 내역이 없습니다"
          desc="조건에 맞는 예약이 없거나, 아직 예약이 등록되지 않았습니다."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[rgba(201,162,39,0.15)]">
                <TableHead className="font-heading font-bold text-[#C9A227]">고객명</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227]">예약시간</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227]">크레딧</TableHead>
                <TableHead className="font-heading font-bold text-[#C9A227]">예약일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => (
                <TableRow key={booking.id} className="border-[rgba(201,162,39,0.15)]">
                  <TableCell className="font-bold font-heading">{booking.customerName}</TableCell>
                  <TableCell className="text-sm text-[#a49484]">
                    {formatDateTime(booking.startTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={booking.status} />
                  </TableCell>
                  <TableCell className="font-heading">{booking.creditsUsed ?? '-'}</TableCell>
                  <TableCell className="text-sm text-[#a49484]">
                    {formatDate(booking.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
