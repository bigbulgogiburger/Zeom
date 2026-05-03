'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { API_BASE } from '../../components/api';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthCard, Timer } from '@/components/design';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendStartedAt, setResendStartedAt] = useState<number | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 인증 링크입니다.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: 'POST',
        });
        const json = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(json.message ?? '이메일이 성공적으로 인증되었습니다.');
        } else {
          setStatus('error');
          setMessage(json.message ?? '이메일 인증에 실패했습니다.');
        }
      } catch {
        setStatus('error');
        setMessage('서버에 연결할 수 없습니다.');
      }
    }

    verify();
  }, [token]);

  async function handleResend() {
    if (resendStartedAt !== null || resendLoading) return;
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        setResendDone(true);
        setResendStartedAt(Date.now());
      } else if (res.status === 401) {
        setMessage('재발송하려면 먼저 로그인이 필요합니다.');
      } else {
        const json = await res.json().catch(() => ({}));
        setMessage(json.message ?? '재발송에 실패했습니다.');
      }
    } catch {
      setMessage('서버에 연결할 수 없습니다.');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="text-center">
      {status === 'loading' && (
        <div className="py-8">
          <div className="w-8 h-8 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none mx-auto mb-4" />
          <p className="text-sm text-[hsl(var(--text-secondary))]">이메일 인증 중...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--gold)/0.15)] flex items-center justify-center mb-4">
            <Check size={24} strokeWidth={3} className="text-[hsl(var(--gold))]" aria-hidden="true" />
          </div>
          <p className="text-sm text-[hsl(var(--text-primary))] font-bold mb-1">{message}</p>
          <p className="text-xs text-[hsl(var(--text-secondary))]">이제 모든 서비스를 이용하실 수 있습니다.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 flex flex-col gap-4">
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>

          <div className="rounded-xl bg-[hsl(var(--surface-2))] border border-[hsl(var(--border-subtle))] p-4 text-sm">
            {resendDone && resendStartedAt !== null ? (
              <div className="flex items-center justify-center gap-2 text-[hsl(var(--text-secondary))]">
                <span>재발송 완료. 다시 보내려면</span>
                <Timer
                  start={resendStartedAt}
                  total={60}
                  onElapsed={() => setResendStartedAt(null)}
                />
                <span>후 가능</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? '재발송 중...' : '인증 메일 재발송'}
              </Button>
            )}
          </div>
        </div>
      )}

      <Link
        href="/login"
        className="text-[hsl(var(--gold))] font-bold text-sm hover:underline transition-colors"
      >
        로그인 페이지로 이동
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--text-primary))] font-heading m-0">
          이메일 인증
        </h1>
      </div>

      <Suspense fallback={<div className="text-center text-sm text-[hsl(var(--text-secondary))]">로딩 중...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </AuthCard>
  );
}
