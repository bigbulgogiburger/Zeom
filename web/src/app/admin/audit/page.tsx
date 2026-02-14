'use client';

import { useState } from 'react';
import { API_BASE } from '../../../components/api';

type Audit = { id: number; userId: number; action: string; targetType: string; targetId: number; createdAt: string };

export default function AdminAuditPage() {
  const [items, setItems] = useState<Audit[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');
    if (!token) return setMessage('관리자 로그인 후 이용해주세요.');

    const r = await fetch(`${API_BASE}/api/v1/admin/audit`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '조회 실패');
    setItems(json);
    setMessage('조회 완료');
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>감사로그(최근 50건)</h2>
      <button onClick={load}>불러오기</button>
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
  );
}
