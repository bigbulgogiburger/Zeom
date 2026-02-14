'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace('/login');
  }, [loading, me, router]);

  if (loading || !me) return <main style={{ padding: 24 }}>인증 확인 중...</main>;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace('/admin/login');
    if (!loading && me && me.role !== 'ADMIN') router.replace('/');
  }, [loading, me, router]);

  if (loading || !me || me.role !== 'ADMIN') return <main style={{ padding: 24 }}>권한 확인 중...</main>;
  return <>{children}</>;
}
