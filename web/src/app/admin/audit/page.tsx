'use client';

import { useState } from 'react';
import { apiFetch } from '../../../components/api-client';
import { RequireAdmin } from '../../../components/route-guard';

type Audit = { id: number; userId: number; action: string; targetType: string; targetId: number; createdAt: string };

function toIso(dateTimeLocal: string) {
  if (!dateTimeLocal) return '';
  return new Date(dateTimeLocal).toISOString();
}

export default function AdminAuditPage() {
  const [items, setItems] = useState<Audit[]>([]);
  const [message, setMessage] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function buildQuery() {
    const q = new URLSearchParams();
    if (action) q.set('action', action);
    if (from && to) {
      q.set('from', toIso(from));
      q.set('to', toIso(to));
    }
    return q.toString() ? `?${q.toString()}` : '';
  }

  async function load() {
    const r = await apiFetch(`/api/v1/admin/audit${buildQuery()}`, { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '조회 실패');
    setItems(json);
    setMessage(`조회 완료 (${json.length}건)`);
  }

  async function downloadCsv() {
    const r = await apiFetch(`/api/v1/admin/audit/csv${buildQuery()}`);
    if (!r.ok) return setMessage('CSV 다운로드 실패');

    const text = await r.text();
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('CSV 다운로드 완료');
  }

  return (
    <RequireAdmin>
    <main style={{ padding: 24 }}>
      <h2>감사로그(최근 50건)</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="action (예: AUTH_LOGIN)" value={action} onChange={(e) => setAction(e.target.value)} />
        <label>시작 <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>종료 <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button onClick={load}>불러오기</button>
        <button onClick={downloadCsv}>CSV 다운로드</button>
      </div>
      <p>{message}</p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {items.map((a) => (
          <li key={a.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
            <div>#{a.id} {a.action}</div>
            <div>user={a.userId}, target={a.targetType}:{a.targetId}</div>
            <div>{new Date(a.createdAt).toLocaleString('ko-KR')}</div>
          </li>
        ))}
      </ul>
    </main>
    </RequireAdmin>
  );
}
