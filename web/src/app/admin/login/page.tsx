'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { setTokens } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';

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
    <main style={{ padding: 24 }}>
      <h2>관리자 로그인</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <input name="email" placeholder="관리자 이메일" />
        <input name="password" type="password" placeholder="비밀번호" />
        <button type="submit">로그인</button>
      </form>
      <p>{message}</p>
    </main>
  );
}
