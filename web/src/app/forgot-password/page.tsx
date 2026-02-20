'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { ActionButton, FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? '요청에 실패했습니다');
        return;
      }
      setSent(true);
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f0d0a]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.05) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0 mb-2">
              비밀번호 찾기
            </h1>
            <p className="text-sm text-[#a49484] m-0">
              가입하신 이메일을 입력해주세요
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="mb-6 p-4 rounded-xl bg-[#1a1612] border border-[rgba(201,162,39,0.15)]">
                <p className="text-sm text-foreground leading-relaxed">
                  비밀번호 재설정 링크가 <span className="text-[#C9A227] font-bold">{email}</span>로 발송되었습니다.
                </p>
                <p className="text-xs text-[#a49484] mt-2">
                  이메일을 확인하여 비밀번호를 재설정해주세요. 링크는 30분 동안 유효합니다.
                </p>
              </div>
              <Link
                href="/login"
                className="text-[#C9A227] font-bold text-sm hover:underline hover:text-[#D4A843] transition-colors"
              >
                로그인 페이지로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <FormField label="이메일" required>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="min-h-[44px] bg-[#1a1612] border-[rgba(201,162,39,0.15)] rounded-xl focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40"
                />
              </FormField>

              {error && (
                <div className="mb-4">
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <ActionButton
                type="submit"
                loading={loading}
                disabled={!email}
                className="w-full mt-6"
              >
                비밀번호 재설정 링크 보내기
              </ActionButton>
            </form>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-[#a49484]">
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className="text-[#C9A227] font-bold hover:underline hover:text-[#D4A843] transition-colors">
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
