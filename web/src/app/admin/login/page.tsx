'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { setTokens } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';
import { ActionButton, Card, InlineError, InlineSuccess, PageTitle } from '../../../components/ui';

export default function AdminLoginPage() {
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
      deviceId: 'web-admin',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    const res = await fetch(`${API_BASE}/api/v1/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      setLoading(false);
      return setMessage(json.message ?? '실패');
    }

    setSuccess('관리자 로그인 성공! 이동 중입니다.');
    setTokens(json.accessToken, json.refreshToken);
    await refreshMe();
    router.push('/dashboard');
  }

  return (
    <main style={{ padding: 'var(--spacing-xl)', display: 'grid', gap: 'var(--spacing-md)' }}>
      <PageTitle>관리자 로그인</PageTitle>
      <Card>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 'var(--spacing-md)', maxWidth: '360px' }}>
          <label htmlFor="email">관리자 이메일</label>
          <input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@example.com" />

          <label htmlFor="password">비밀번호</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" placeholder="비밀번호" />

          <ActionButton type="submit" loading={loading}>로그인</ActionButton>
        </form>
        <div style={{ marginTop: 'var(--spacing-sm)' }}>
          <InlineError message={message} />
          <InlineSuccess message={success} />
        </div>
      </Card>
    </main>
  );
}
