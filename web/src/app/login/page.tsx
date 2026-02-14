'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../components/api';
import { setTokens } from '../../components/auth-client';
import { useAuth } from '../../components/auth-context';
import { ActionButton, Card, InlineError, InlineSuccess, PageTitle } from '../../components/ui';

export default function LoginPage() {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshMe } = useAuth();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setSuccess('');
    const form = new FormData(e.currentTarget);
    const body = {
      email: String(form.get('email')),
      password: String(form.get('password')),
      deviceId: 'web-main',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setMessage(json.message ?? '실패');
    }

    setSuccess('로그인 성공! 이동 중입니다.');
    setTokens(json.accessToken, json.refreshToken);
    await refreshMe();
    router.push('/counselors');
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>로그인</PageTitle>
      <Card>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, maxWidth: 360 }}>
          <label htmlFor="email">이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" style={{ minHeight: 40, padding: '0 10px' }} />

          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="비밀번호" style={{ minHeight: 40, padding: '0 10px' }} />

          <ActionButton type="submit" loading={loading} style={{ minHeight: 42 }}>로그인</ActionButton>
        </form>
        <div style={{ marginTop: 8 }}>
          <InlineError message={message} />
          <InlineSuccess message={success} />
        </div>
      </Card>
    </main>
  );
}
