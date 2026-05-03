'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { getDeviceId } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';
import { AuthCard } from '@/components/design';

function OAuthCallbackContent() {
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshMe } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') ?? searchParams.get('state');

    if (!code || !provider) {
      setError('잘못된 인증 요청입니다.');
      return;
    }

    async function handleCallback() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/oauth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            provider,
            code,
            redirectUri: `${window.location.origin}/auth/callback`,
            deviceId: getDeviceId(),
            deviceName: navigator.userAgent.slice(0, 120),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.message ?? '소셜 로그인에 실패했습니다.');
          return;
        }
        await refreshMe();
        router.replace('/counselors');
      } catch {
        setError('서버 오류가 발생했습니다.');
      }
    }

    handleCallback();
  }, [searchParams, router, refreshMe]);

  if (error) {
    return (
      <div className="text-center">
        <p className="text-[hsl(var(--text-secondary))] mb-4">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="text-[hsl(var(--gold))] underline hover:text-[hsl(var(--gold-soft))]"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <div className="w-8 h-8 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none mx-auto mb-4" />
      <p className="text-[hsl(var(--text-secondary))]">로그인 처리 중...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <AuthCard>
      <Suspense
        fallback={
          <div className="text-center py-6">
            <div className="w-8 h-8 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin motion-reduce:animate-none mx-auto mb-4" />
            <p className="text-[hsl(var(--text-secondary))]">로딩 중...</p>
          </div>
        }
      >
        <OAuthCallbackContent />
      </Suspense>
    </AuthCard>
  );
}
