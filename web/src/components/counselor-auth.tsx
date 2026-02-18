'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-40 bg-[var(--color-bg-secondary)] rounded-lg animate-pulse" />
        <div className="h-4 w-24 bg-[var(--color-bg-secondary)] rounded animate-pulse" />
      </div>
    </div>
  );
}

export function RequireCounselor({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !me) router.replace('/login');
    if (!loading && me && me.role !== 'COUNSELOR') router.replace('/');
  }, [loading, me, router]);

  if (loading || !me || me.role !== 'COUNSELOR') return <AuthSkeleton />;
  return <>{children}</>;
}
