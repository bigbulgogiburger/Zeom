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
      <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-lg)' }}>
        <PageTitle>운영 타임라인</PageTitle>

        <Card>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
            <input placeholder="bookingStatus" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} />
            <input placeholder="paymentStatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} />
            <input placeholder="chatStatus" value={chatStatus} onChange={(e) => setChatStatus(e.target.value)} />
            <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
            <ActionButton onClick={loadTimeline} loading={loading}>조회</ActionButton>
            <ActionButton onClick={() => setSortDesc((v) => !v)}>정렬: {sortDesc ? '최신순' : '오래된순'}</ActionButton>
          </div>
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <InlineError message={message} />
            <InlineSuccess message={success} />
          </div>
        </Card>

        {pagedRows.length === 0 ? (
          <EmptyState title="조회 결과가 없어요" desc="필터를 조정하거나 조회를 다시 시도해보세요." />
        ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {pagedRows.map((r) => (
            <Card key={r.bookingId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <div><b style={{ fontFamily: 'var(--font-heading)' }}>Booking #{r.bookingId}</b> · {new Date(r.bookingCreatedAt).toLocaleString('ko-KR')}</div>
                <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                  <StatusBadge value={r.bookingStatus} />
                  <StatusBadge value={r.paymentStatus} />
                  <StatusBadge value={r.chatStatus} />
                </div>
              </div>
              <div style={{ marginTop: 'var(--spacing-sm)', color: 'var(--color-text-muted-card)' }}>
                유저: {r.userEmail} / 상담사: {r.counselorName}
              </div>
              <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-muted-card)', fontSize: 'var(--font-size-sm)' }}>
                결제ID: {r.paymentId ?? '-'} / 채팅방: {r.chatRoomId ?? '-'}
                {r.postActionRetryNeeded && (
                  <span style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--color-warning)', fontWeight: 'var(--font-weight-bold)' }}>재처리 필요</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {r.paymentId && <ActionButton style={{ marginTop: 'var(--spacing-sm)' }} loading={loading} onClick={() => loadPaymentLogs(r.paymentId)}>결제 상태 전이 보기</ActionButton>}
                {r.paymentId && r.postActionRetryNeeded && (
                  <ActionButton style={{ marginTop: 'var(--spacing-sm)' }} loading={loading} onClick={() => retryPostActions(r.paymentId!)}>후속 처리 재시도</ActionButton>
                )}
              </div>
            </Card>
          ))}
        </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <ActionButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</ActionButton>
          <span style={{ fontFamily: 'var(--font-heading)' }}>{page} / {totalPages}</span>
          <ActionButton disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</ActionButton>
        </div>

        {selectedPaymentId && (
          <Card>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-heading)' }}>결제 #{selectedPaymentId} 상태 전이</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 'var(--spacing-sm)' }}>
              {paymentLogs.map((l) => (
                <li key={l.id} style={{
                  border: '1px solid var(--color-border-card)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                  fontSize: 'var(--font-size-sm)',
                }}>
                  <div>{l.fromStatus || '(none)'} → <b style={{ fontFamily: 'var(--font-heading)' }}>{l.toStatus}</b></div>
                  <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-muted-card)' }}>reason: {l.reason}</div>
                  <div style={{ marginTop: 'var(--spacing-xs)', color: 'var(--color-text-muted-card)' }}>{new Date(l.createdAt).toLocaleString('ko-KR')}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </RequireAdmin>
  );
}
