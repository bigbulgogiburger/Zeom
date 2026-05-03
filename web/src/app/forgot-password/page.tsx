'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard, SuccessState } from '@/components/design';

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

  if (sent) {
    return (
      <AuthCard>
        <SuccessState
          icon="lotus"
          title="비밀번호 재설정 링크 발송"
          subtitle={`${email}로 발송되었습니다. 이메일 확인 후 비밀번호를 재설정해주세요. 링크는 30분 동안 유효합니다.`}
        />
        <div className="text-center">
          <Link
            href="/login"
            className="text-[hsl(var(--gold))] font-bold text-sm hover:underline transition-colors"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--text-primary))] font-heading m-0 mb-2">
          비밀번호 찾기
        </h1>
        <p className="text-sm text-[hsl(var(--text-secondary))] m-0">
          가입하신 이메일을 입력해주세요
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <FormField label="이메일" required>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="min-h-[48px] bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]"
          />
        </FormField>

        {error && (
          <div className="mb-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        <Button
          type="submit"
          variant="gold-grad"
          size="lg"
          disabled={loading || !email}
          className="w-full mt-6"
        >
          {loading ? '전송 중...' : '비밀번호 재설정 링크 보내기'}
        </Button>
      </form>

      <div className="text-center mt-6 text-sm text-[hsl(var(--text-secondary))]">
        비밀번호가 기억나셨나요?{' '}
        <Link href="/login" className="text-[hsl(var(--gold))] font-bold hover:underline transition-colors">
          로그인
        </Link>
      </div>
    </AuthCard>
  );
}
