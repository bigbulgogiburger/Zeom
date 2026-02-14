'use client';

import { useState } from 'react';
import { RequireAdmin } from '../../../components/route-guard';
import { apiFetch } from '../../../components/api-client';

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

export default function AdminTimelinePage() {
  const [rows, setRows] = useState<TimelineRow[]>([]);
  const [message, setMessage] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [chatStatus, setChatStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

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
    const r = await apiFetch(`/api/v1/ops/timeline${buildQuery()}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '타임라인 조회 실패');
    setRows(json);
    setMessage(`조회 완료 (${json.length}건)`);
  }

  async function loadPaymentLogs(paymentId: number) {
    const r = await apiFetch(`/api/v1/payments/${paymentId}/logs`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '결제 로그 조회 실패');
    setSelectedPaymentId(paymentId);
    setPaymentLogs(json);
  }

  return (
    <RequireAdmin>
      <main style={{ padding: 24 }}>
        <h2>운영 타임라인</h2>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input placeholder="bookingId" value={bookingId} onChange={(e) => setBookingId(e.target.value)} />
          <input placeholder="bookingStatus" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)} />
          <input placeholder="paymentStatus" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} />
          <input placeholder="chatStatus" value={chatStatus} onChange={(e) => setChatStatus(e.target.value)} />
          <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button onClick={loadTimeline}>조회</button>
        </div>

        <p>{message}</p>

        <div style={{ display: 'grid', gap: 8 }}>
          {rows.map((r) => (
            <div key={r.bookingId} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
              <div><b>Booking #{r.bookingId}</b> ({r.bookingStatus})</div>
              <div>유저: {r.userEmail} / 상담사: {r.counselorName}</div>
              <div>결제: {r.paymentStatus} {r.paymentId ? `(id=${r.paymentId})` : ''}</div>
              <div>채팅: {r.chatStatus} {r.chatRoomId ? `(room=${r.chatRoomId})` : ''}</div>
              <div>생성: {new Date(r.bookingCreatedAt).toLocaleString('ko-KR')}</div>
              {r.paymentId && <button onClick={() => loadPaymentLogs(r.paymentId)}>결제 상태 전이 보기</button>}
            </div>
          ))}
        </div>

        {selectedPaymentId && (
          <section style={{ marginTop: 20 }}>
            <h3>결제 #{selectedPaymentId} 상태 전이</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
              {paymentLogs.map((l) => (
                <li key={l.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
                  <div>{l.fromStatus || '(none)'} → <b>{l.toStatus}</b></div>
                  <div>reason: {l.reason}</div>
                  <div>{new Date(l.createdAt).toLocaleString('ko-KR')}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </RequireAdmin>
  );
}
