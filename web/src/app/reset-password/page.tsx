'use client';

import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { toast } from 'sonner';
import { ActionButton, FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordValid = newPassword.length >= 8;
  const confirmValid = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = token && passwordValid && confirmValid;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? '비밀번호 재설정에 실패했습니다');
        return;
      }
      setSuccess(true);
      toast.success('비밀번호가 변경되었습니다');
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('서버에 연결할 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <Alert variant="destructive">
          <AlertDescription>유효하지 않은 링크입니다. 비밀번호 찾기를 다시 시도해주세요.</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/forgot-password" className="text-[hsl(var(--gold))] font-bold text-sm hover:underline">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6 p-4 rounded-xl bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.15)]">
          <p className="text-sm text-foreground leading-relaxed">
            비밀번호가 성공적으로 변경되었습니다.
          </p>
          <p className="text-xs text-[hsl(var(--text-secondary))] mt-2">
            잠시 후 로그인 페이지로 이동합니다.
          </p>
        </div>
        <Link
          href="/login"
          className="text-[hsl(var(--gold))] font-bold text-sm hover:underline hover:text-[hsl(var(--gold-soft))] transition-colors"
        >
          로그인 페이지로 이동
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField label="새 비밀번호" required hint="8자 이상 입력해주세요">
        <div className="relative w-full">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호"
            required
            autoComplete="new-password"
            className="min-h-[44px] pr-16 bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))]/30 focus:border-[hsl(var(--gold))]/40"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-secondary))] text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent hover:text-[hsl(var(--gold))]"
          >
            {showPassword ? '숨기기' : '보기'}
          </Button>
        </div>
      </FormField>

      <FormField
        label="새 비밀번호 확인"
        required
        error={confirmPassword && !confirmValid ? '비밀번호가 일치하지 않습니다' : ''}
      >
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="새 비밀번호 확인"
          required
          autoComplete="new-password"
          className="min-h-[44px] bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))]/30 focus:border-[hsl(var(--gold))]/40"
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
        disabled={!canSubmit}
        className="w-full mt-6"
      >
        비밀번호 변경
      </ActionButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[hsl(var(--background))]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, hsl(var(--gold)/0.05) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] bg-clip-text text-transparent font-heading m-0 mb-2">
              비밀번호 재설정
            </h1>
            <p className="text-sm text-[hsl(var(--text-secondary))] m-0">
              새로운 비밀번호를 설정해주세요
            </p>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-[hsl(var(--text-secondary))]">로딩 중...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
