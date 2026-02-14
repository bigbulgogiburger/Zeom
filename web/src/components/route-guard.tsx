'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

function AuthSkeleton() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 160, background: '#1e293b', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ height: 16, width: '60%', background: '#1e293b', borderRadius: 4, marginBottom: 10 }} />
        <div style={{ height: 16, width: '40%', background: '#1e293b', borderRadius: 4 }} />
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </main>
  );
}

export function RequireLogin({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace('/login');
  }, [loading, me, router]);

  if (loading || !me) return <AuthSkeleton />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace('/admin/login');
    if (!loading && me && me.role !== 'ADMIN') router.replace('/');
  }, [loading, me, router]);

  if (loading || !me || me.role !== 'ADMIN') return <AuthSkeleton />;
  return <>{children}</>;
}
