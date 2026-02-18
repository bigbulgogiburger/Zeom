'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { setTokens } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';
import { ActionButton, InlineError, InlineSuccess } from '../../../components/ui';
import { Input } from '@/components/ui/input';

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
    <main className="min-h-screen flex items-center justify-center p-6 bg-[#0f0d0a] bg-[radial-gradient(ellipse_at_center,rgba(201,162,39,0.05)_0%,transparent_70%)]">
      <div className="w-full max-w-[420px]">
        {/* Glass-morphism card */}
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block mb-4 px-4 py-1.5 text-xs font-bold tracking-wider uppercase bg-[#C9A227]/15 text-[#C9A227] rounded-full border border-[#C9A227]/20">
              Admin
            </span>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0">
              관리자 로그인
            </h1>
            <p className="text-[#a49484] text-sm mt-2">
              천지연꽃신당 관리자 전용
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="grid gap-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#a49484] mb-1.5">
                관리자 이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@example.com"
                className="min-h-[48px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-[#a49484]/50 focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40 transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#a49484] mb-1.5">
                비밀번호
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="비밀번호"
                className="min-h-[48px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-[#a49484]/50 focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40 transition-all"
              />
            </div>

            <ActionButton type="submit" loading={loading} className="w-full mt-3">
              로그인
            </ActionButton>
          </form>

          {/* Messages */}
          <div className="mt-5 text-center">
            <InlineError message={message} />
            <InlineSuccess message={success} />
          </div>
        </div>
      </div>
    </main>
  );
}
