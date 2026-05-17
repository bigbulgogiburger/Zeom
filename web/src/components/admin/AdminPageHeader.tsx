'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Search, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';

type AdminPageHeaderProps = {
  /** mobile drawer trigger 위치를 좌측에 표시할 때 사용 */
  leftSlot?: React.ReactNode;
};

export function AdminPageHeader({ leftSlot }: AdminPageHeaderProps) {
  const { me, refreshMe } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState('');

  async function handleLogout() {
    try {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // 네트워크 실패 시에도 client state는 비우고 redirect
    }
    await refreshMe();
    router.push('/admin/login');
  }

  return (
    <header
      className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--card))]/95 px-4 backdrop-blur-md md:px-6"
    >
      {leftSlot}
      <div className="relative flex-1 max-w-[420px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--text-secondary))]"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="사용자·주문·이벤트 검색"
          className="h-9 w-full pl-9 text-sm"
          aria-label="전역 검색"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Badge
          variant="outline"
          className="hidden gap-1 border-[hsl(var(--gold))]/40 text-[hsl(var(--gold))] sm:inline-flex"
        >
          <ShieldAlert className="size-3.5" aria-hidden="true" />
          관리자
        </Badge>
        <div className="hidden text-right text-xs leading-tight sm:block">
          <div className="font-semibold text-[hsl(var(--text-primary))]">
            {me?.name ?? '관리자'}
          </div>
          <div className="text-[hsl(var(--text-secondary))]">{me?.email ?? '—'}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="로그아웃"
          className="gap-1.5 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span aria-hidden="true" className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>
    </header>
  );
}
