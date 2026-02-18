'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { setTokens } from '../../components/auth-client';
import { useAuth } from '../../components/auth-context';
import { useToast } from '../../components/toast';
import { ActionButton, Card, FormField } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { toast } = useToast();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const body = {
      email,
      password,
      deviceId: 'web-main',
      deviceName: navigator.userAgent.slice(0, 120),
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(json.message ?? '로그인에 실패했습니다');
        return;
      }
      setTokens(json.accessToken, json.refreshToken);
      await refreshMe();
      toast('로그인되었습니다', 'success');
      router.push('/counselors');
    } catch {
      setLoading(false);
      setError('서버에 연결할 수 없습니다');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[420px]">
        <Card>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary font-heading m-0 mb-2">
              천지연꽃신당
            </h1>
            <p className="text-sm text-muted-foreground m-0">
              다시 오신 것을 환영합니다
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
                className="min-h-[44px]"
              />
            </FormField>

            <FormField label="비밀번호" required>
              <div className="relative w-full">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  required
                  autoComplete="current-password"
                  className="min-h-[44px] pr-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground text-sm min-h-0 h-auto px-2 py-1 hover:bg-transparent"
                >
                  {showPassword ? '숨기기' : '보기'}
                </Button>
              </div>
            </FormField>

            {error && (
              <div className="mb-3">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            <ActionButton
              type="submit"
              loading={loading}
              disabled={!email || !password}
              className="w-full"
            >
              로그인
            </ActionButton>
          </form>
        </Card>

        <div className="text-center mt-4 flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-primary font-bold">
              회원가입
            </Link>
          </div>
          <div>
            <Link
              href="/admin/login"
              className="text-muted-foreground text-xs font-normal"
            >
              관리자 로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
