'use client';

import { FormEvent, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { toast } from 'sonner';
import { FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff } from 'lucide-react';
import { AuthCard, PasswordStrengthMeter, SuccessState } from '@/components/design';

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
      <SuccessState
        icon="check"
        title="비밀번호 변경 완료"
        subtitle="잠시 후 로그인 페이지로 이동합니다."
      />
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
            className="min-h-[48px] pr-12 bg-[hsl(var(--background))] border border-[hsl(var(--border-subtle))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--gold))/0.3] focus:border-[hsl(var(--border-accent))]"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))] min-h-0 h-auto p-2 hover:bg-transparent hover:text-[hsl(var(--gold))]"
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </Button>
        </div>
        <PasswordStrengthMeter password={newPassword} />
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
        disabled={loading || !canSubmit}
        className="w-full mt-6"
      >
        {loading ? '변경 중...' : '비밀번호 변경'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--text-primary))] font-heading m-0 mb-2">
          비밀번호 재설정
        </h1>
        <p className="text-sm text-[hsl(var(--text-secondary))] m-0">
          새로운 비밀번호를 설정해주세요
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-sm text-[hsl(var(--text-secondary))]">로딩 중...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
