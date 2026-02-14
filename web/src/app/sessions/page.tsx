'use client';

import { useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState, InlineError, PageTitle } from '../../components/ui';

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
    <RequireLogin>
      <main style={{ padding: 24, display: 'grid', gap: 12 }}>
        <PageTitle>내 세션 관리</PageTitle>
        <div>
          <button onClick={load} style={{ minHeight: 40, padding: '0 12px' }}>세션 불러오기</button>
        </div>
        <InlineError message={message} />

        {items.length === 0 ? (
          <EmptyState title="세션 정보가 없어요" desc="세션 불러오기 버튼을 눌러 최신 상태를 확인하세요." />
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {items.map((s) => (
              <Card key={s.id}>
                <div style={{ fontWeight: 700 }}>{s.deviceName}</div>
                <div style={{ color: '#94a3b8' }}>{s.deviceId}</div>
                <div style={{ marginTop: 8 }}>생성: {new Date(s.createdAt).toLocaleString('ko-KR')}</div>
                <div>만료: {new Date(s.expiresAt).toLocaleString('ko-KR')}</div>
                <button onClick={() => revoke(s.id)} style={{ marginTop: 8, minHeight: 40, padding: '0 12px' }}>
                  이 세션 해제
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
