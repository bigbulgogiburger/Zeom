'use client';

import { useMemo, useState } from 'react';
import { RequireAdmin } from '../../../components/route-guard';
import { apiFetch } from '../../../components/api-client';
import { ActionButton, Card, EmptyState, InlineError, InlineSuccess, PageTitle, StatusBadge } from '../../../components/ui';

type TimelineRow = {
  bookingId: number;
  bookingStatus: string;
  bookingCreatedAt: string;
  userId: number;
  userEmail: string;
  counselorId: number;
  counselorName: string;
  paymentStatus: string;
  paymentId: number | null;
  chatStatus: string;
  chatRoomId: string | null;
  postActionRetryNeeded?: boolean;
};

type PaymentLog = {
  id: number;
  fromStatus: string;
  toStatus: string;
  reason: string;
  createdAt: string;
};

function toIso(dateTimeLocal: string) {
  if (!dateTimeLocal) return '';
  return new Date(dateTimeLocal).toISOString();
}

const PAGE_SIZE = 10;

export default function AdminTimelinePage() {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);

  function buildQuery() {
    const q = new URLSearchParams();
    if (bookingId) q.set('bookingId', bookingId);
    if (bookingStatus) q.set('bookingStatus', bookingStatus);
    if (paymentStatus) q.set('paymentStatus', paymentStatus);
    if (chatStatus) q.set('chatStatus', chatStatus);
    if (from && to) {
      q.set('from', toIso(from));
      q.set('to', toIso(to));
    }
    return q.toString() ? `?${q.toString()}` : '';
  }

  async function loadTimeline() {
    setLoading(true);
    setMessage('');
    setSuccess('');
    const r = await apiFetch(`/api/v1/ops/timeline${buildQuery()}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setLoading(false);
      return setMessage(json.message ?? '타임라인 조회 실패');
    }
    setRows(json);
    setPage(1);
    setSuccess(`조회 완료 (${json.length}건)`);
    setLoading(false);
  }

  async function loadPaymentLogs(paymentId: number) {
    setLoading(true);
    const r = await apiFetch(`/api/v1/payments/${paymentId}/logs`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setLoading(false);
      return setMessage(json.message ?? '결제 로그 조회 실패');
    }
    setSelectedPaymentId(paymentId);
    setPaymentLogs(json);
    setSuccess('결제 상태 전이 로그를 불러왔어요.');
    setLoading(false);
  }

  async function retryPostActions(paymentId: number) {
    setLoading(true);
    setMessage('');
    setSuccess('');
    const r = await apiFetch(`/api/v1/payments/${paymentId}/retry-post-actions`, {
      method: 'POST'
    });
    const json = await r.json();
    if (!r.ok) {
      setLoading(false);
      return setMessage(json.message ?? '후속 처리 재시도 실패');
    }
    setSuccess(`결제 #${paymentId} 후속 처리 재시도 완료`);
    await loadTimeline();
    await loadPaymentLogs(paymentId);
    setLoading(false);
  }

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const t1 = new Date(a.bookingCreatedAt).getTime();
      const t2 = new Date(b.bookingCreatedAt).getTime();
      return sortDesc ? t2 - t1 : t1 - t2;
    });
  }, [rows, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const pagedRows = sortedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>운영 타임라인</PageTitle>

        <Card>
          <div className="flex gap-3 flex-wrap items-end">
            <input
              placeholder="bookingId"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />
            <input
              placeholder="bookingStatus"
              value={bookingStatus}
              onChange={(e) => setBookingStatus(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />
            <input
              placeholder="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />
            <input
              placeholder="chatStatus"
              value={chatStatus}
              onChange={(e) => setChatStatus(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
            />
            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              시작
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>
            <label className="text-sm text-[#a49484] flex items-center gap-1.5">
              종료
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none"
              />
            </label>
            <ActionButton onClick={loadTimeline} loading={loading}>조회</ActionButton>
            <ActionButton
              onClick={() => setSortDesc((v) => !v)}
              className="!bg-transparent border-2 border-[#C9A227]/30 !text-[#C9A227] hover:!bg-[#C9A227]/10"
            >
              정렬: {sortDesc ? '최신순' : '오래된순'}
            </ActionButton>
          </div>
          <div className="mt-3">
            <InlineError message={message} />
            <InlineSuccess message={success} />
          </div>
        </Card>

        {pagedRows.length === 0 ? (
          <EmptyState title="조회 결과가 없어요" desc="필터를 조정하거나 조회를 다시 시도해보세요." />
        ) : (
        <div className="grid gap-6">
          {pagedRows.map((r) => (
            <Card key={r.bookingId}>
              <div className="flex justify-between gap-4 flex-wrap items-center">
                <div className="font-heading">
                  <span className="font-bold text-[#C9A227]">Booking #{r.bookingId}</span>
                  <span className="text-[#a49484] mx-2">·</span>
                  <span className="text-sm">{new Date(r.bookingCreatedAt).toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex gap-1.5">
                  <StatusBadge value={r.bookingStatus} />
                  <StatusBadge value={r.paymentStatus} />
                  <StatusBadge value={r.chatStatus} />
                </div>
              </div>
              <div className="mt-3 text-[#a49484]">
                유저: {r.userEmail} / 상담사: {r.counselorName}
              </div>
              <div className="mt-2 text-[#a49484] text-sm">
                결제ID: {r.paymentId ?? '-'} / 채팅방: {r.chatRoomId ?? '-'}
                {r.postActionRetryNeeded && (
                  <span className="ml-3 text-[#D4A843] font-bold rounded-full bg-[#D4A843]/10 px-2.5 py-0.5 text-xs">재처리 필요</span>
                )}
              </div>
              <div className="flex gap-4 flex-wrap mt-4">
                {r.paymentId && (
                  <ActionButton
                    loading={loading}
                    onClick={() => loadPaymentLogs(r.paymentId!)}
                    className="!bg-transparent border-2 border-[#C9A227]/30 !text-[#C9A227] hover:!bg-[#C9A227]/10 !min-h-[36px] !px-5 !py-1.5 !text-sm"
                  >
                    결제 상태 전이 보기
                  </ActionButton>
                )}
                {r.paymentId && r.postActionRetryNeeded && (
                  <ActionButton
                    loading={loading}
                    onClick={() => retryPostActions(r.paymentId!)}
                    className="!min-h-[36px] !px-5 !py-1.5 !text-sm"
                  >
                    후속 처리 재시도
                  </ActionButton>
                )}
              </div>
            </Card>
          ))}
        </div>
        )}

        <div className="flex gap-4 items-center justify-center pt-2">
          <ActionButton
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="!bg-transparent border-2 border-[#C9A227] !text-[#C9A227] hover:!bg-[#C9A227]/10 !min-h-[36px] !px-5 !py-1.5"
          >
            이전
          </ActionButton>
          <span className="font-heading font-bold text-[#f9f5ed]">{page} / {totalPages}</span>
          <ActionButton
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="!bg-transparent border-2 border-[#C9A227] !text-[#C9A227] hover:!bg-[#C9A227]/10 !min-h-[36px] !px-5 !py-1.5"
          >
            다음
          </ActionButton>
        </div>

        {selectedPaymentId && (
          <Card>
            <h3 className="font-heading font-bold text-lg mb-5">
              <span className="text-[#C9A227]">결제 #{selectedPaymentId}</span> 상태 전이
            </h3>
            <ul className="list-none p-0 grid gap-4">
              {paymentLogs.map((l) => (
                <li key={l.id} className="border border-[rgba(201,162,39,0.15)] rounded-xl p-5 text-sm bg-[rgba(201,162,39,0.02)]">
                  <div>
                    <span className="text-[#a49484]">{l.fromStatus || '(none)'}</span>
                    <span className="mx-2 text-[#C9A227]">&rarr;</span>
                    <span className="font-heading font-bold">{l.toStatus}</span>
                  </div>
                  <div className="mt-1.5 text-[#a49484]">reason: {l.reason}</div>
                  <div className="mt-1 text-[#a49484]">{new Date(l.createdAt).toLocaleString('ko-KR')}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </RequireAdmin>
  );
}
