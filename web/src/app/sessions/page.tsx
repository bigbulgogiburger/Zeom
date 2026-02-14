'use client';

import { useState } from 'react';
import { apiFetch } from '../../components/api-client';

type SessionItem = {
  id: number;
  deviceId: string;
  deviceName: string;
  expiresAt: string;
  createdAt: string;
};

export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState('');

  async function load() {
    const r = await apiFetch('/api/v1/auth/sessions', { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '조회 실패');
    setItems(json.sessions ?? []);
    setMessage('조회 완료');
  }

  async function revoke(id: number) {
    const r = await apiFetch(`/api/v1/auth/sessions/${id}/revoke`, { method: 'POST' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '세션 해제 실패');
    setMessage('세션 해제 완료');
    await load();
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>내 세션 관리</h2>
      <button onClick={load}>세션 불러오기</button>
      <p>{message}</p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
        {items.map((s) => (
          <li key={s.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 10 }}>
            <div>{s.deviceName} ({s.deviceId})</div>
            <div>생성: {new Date(s.createdAt).toLocaleString('ko-KR')}</div>
            <div>만료: {new Date(s.expiresAt).toLocaleString('ko-KR')}</div>
            <button onClick={() => revoke(s.id)} style={{ marginTop: 6 }}>이 세션 해제</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
