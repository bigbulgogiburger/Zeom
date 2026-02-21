'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE } from '../../../components/api';
import { setTokens } from '../../../components/auth-client';
import { useAuth } from '../../../components/auth-context';

export default function OAuthCallbackPage() {
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
          body: JSON.stringify({
            provider,
            code,
            redirectUri: `${window.location.origin}/auth/callback`,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.message ?? '소셜 로그인에 실패했습니다.');
          return;
        }
        setTokens(json.accessToken, json.refreshToken);
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
      <main className="min-h-screen flex items-center justify-center bg-[#0f0d0a]">
        <div className="text-center">
          <p className="text-[#a49484] mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-[#C9A227] underline hover:text-[#D4A843]"
          >
            로그인 페이지로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f0d0a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#a49484]">로그인 처리 중...</p>
      </div>
    </main>
  );
}
