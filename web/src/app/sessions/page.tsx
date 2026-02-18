'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../components/api-client';
import { RequireLogin } from '../../components/route-guard';
import { Card, EmptyState } from '../../components/ui';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type SessionItem = {
  id: number;
  deviceId: string;
  deviceName: string;
  expiresAt: string;
  createdAt: string;
};

function deviceEmoji(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) return '\uD83D\uDCF1';
  return '\uD83D\uDDA5\uFE0F';
}

export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await apiFetch('/api/v1/auth/sessions', { cache: 'no-store' });
    const json = await r.json();
    if (!r.ok) {
      setMessage(json.message ?? '조회 실패');
      setLoading(false);
      return;
    }
    setItems(json.sessions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setMessage('조회 실패');
      setLoading(false);
    });
  }, []);

  async function revoke(id: number) {
    const r = await apiFetch(`/api/v1/auth/sessions/${id}/revoke`, { method: 'POST' });
    const json = await r.json();
    if (!r.ok) return setMessage(json.message ?? '세션 해제 실패');
    setMessage('세션 해제 완료');
    await load();
  }

  return (
    <RequireLogin>
      <main className="max-w-[1000px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <h1 className="text-3xl font-black tracking-tight font-heading text-foreground">내 세션 관리</h1>

        {message && (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="skeleton h-[100px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="세션 정보가 없어요" desc="활성 세션이 없습니다." />
        ) : (
          <div className="grid gap-6">
            {items.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{deviceEmoji(s.deviceName)}</span>
                  <span className="font-bold font-heading">{s.deviceName}</span>
                </div>
                <div className="text-muted-foreground text-sm mt-1">
                  {s.deviceId}
                </div>
                <div className="mt-2 text-sm flex gap-4 flex-wrap">
                  <span>생성: {new Date(s.createdAt).toLocaleString('ko-KR')}</span>
                  <span>만료: {new Date(s.expiresAt).toLocaleString('ko-KR')}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revoke(s.id)}
                  className="mt-3 rounded-full"
                >
                  이 세션 해제
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
