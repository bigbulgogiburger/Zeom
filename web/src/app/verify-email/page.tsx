'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

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

  return (
    <div className="text-center">
      {status === 'loading' && (
        <div className="py-8">
          <div className="w-8 h-8 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#a49484]">이메일 인증 중...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-6 p-4 rounded-xl bg-[#1a1612] border border-[rgba(201,162,39,0.15)]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#C9A227] to-[#D4A843] flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f0d0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm text-foreground font-bold mb-1">{message}</p>
          <p className="text-xs text-[#a49484]">이제 모든 서비스를 이용하실 수 있습니다.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )}

      <Link
        href="/login"
        className="text-[#C9A227] font-bold text-sm hover:underline hover:text-[#D4A843] transition-colors"
      >
        로그인 페이지로 이동
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0f0d0a]"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.05) 0%, transparent 70%)' }}
    >
      <div className="w-full max-w-[420px]">
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0 mb-2">
              이메일 인증
            </h1>
          </div>

          <Suspense fallback={<div className="text-center text-sm text-[#a49484]">로딩 중...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
