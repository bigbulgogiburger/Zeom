'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { setTokens } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';
import { Card, InlineError, PageTitle } from '../../../components/ui';

export default function AdminLoginPage() {
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { refreshMe } = useAuth();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      email: String(form.get('email')),
      password: String(form.get('password')),
      deviceId: 'web-admin',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    const res = await fetch(`${API_BASE}/api/v1/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.message ?? '실패');

    setTokens(json.accessToken, json.refreshToken);
    await refreshMe();
    router.push('/dashboard');
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>관리자 로그인</PageTitle>
      <Card>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, maxWidth: 360 }}>
          <label htmlFor="email">관리자 이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@example.com" style={{ minHeight: 40, padding: '0 10px' }} />

          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="비밀번호" style={{ minHeight: 40, padding: '0 10px' }} />

          <button type="submit" style={{ minHeight: 42 }}>로그인</button>
        </form>
        <div style={{ marginTop: 8 }}><InlineError message={message} /></div>
      </Card>
    </main>
  );
}
