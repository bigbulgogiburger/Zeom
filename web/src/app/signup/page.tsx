'use client';

import { FormEvent, useState } from 'react';
import { API_BASE } from '../../components/api';

export default function SignupPage() {
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      email: String(form.get('email')),
      password: String(form.get('password')),
      name: String(form.get('name')),
      deviceId: 'web-main',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) return setMessage(json.message ?? '실패');

    localStorage.setItem('accessToken', json.accessToken);
    setMessage(`가입 완료: ${json.user.name}`);
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>회원가입</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <input name="email" placeholder="이메일" />
        <input name="name" placeholder="이름" />
        <input name="password" type="password" placeholder="비밀번호(8자+)" />
        <button type="submit">가입하기</button>
      </form>
      <p>{message}</p>
    </main>
  );
}
