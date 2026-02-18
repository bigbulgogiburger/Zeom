'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from './api-client';
import { clearTokens, getRefreshToken } from './auth-client';
import { useAuth } from './auth-context';
import CreditWidget from './credit-widget';
import WalletWidget from './wallet-widget';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export default function AppHeader() {
  const { me, refreshMe } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
    clearTokens();
    await refreshMe();
    setDrawerOpen(false);
    router.push('/login');
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const isAdmin = me?.role === 'ADMIN';
  const isCounselor = me?.role === 'COUNSELOR';

  const navLinkClass = "text-[var(--color-text-on-dark)] font-medium p-2 rounded-lg hover:bg-[rgba(201,162,39,0.1)] hover:text-[var(--color-gold)] no-underline block";

  return (
    <>
      <header className="app-header dancheong-border">
        <Link href="/" className="app-header-brand">
          천지연꽃신당
        </Link>

        {/* Desktop nav */}
        <nav className="app-header-nav">
          <Link href="/counselors">상담사</Link>
          {me && <Link href="/credits">상담권</Link>}
          {me && <Link href="/bookings/me">내예약</Link>}
          {me && <Link href="/sessions">세션관리</Link>}
          {isCounselor && <Link href="/counselor">선생님 포털</Link>}
          {isAdmin && <Link href="/dashboard">대시보드</Link>}
          {isAdmin && <Link href="/admin/timeline">타임라인</Link>}
          {isAdmin && <Link href="/admin/audit">감사로그</Link>}
        </nav>

        {/* Desktop right section */}
        <div className="app-header-right">
          {me ? (
            <>
              <CreditWidget />
              <WalletWidget />
              <span className="app-header-user">{me.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="border-[var(--color-border-dark)] text-[var(--color-text-on-dark)] bg-transparent font-medium hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] hover:bg-transparent"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <span className="app-header-auth-links flex gap-3 items-center">
              <Link href="/login">로그인</Link>
              <Link href="/signup">회원가입</Link>
            </span>
          )}

          {/* Mobile hamburger - Sheet trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="app-header-hamburger border-[var(--color-border-dark)] text-[var(--color-text-on-dark)] bg-transparent hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] hover:bg-transparent text-xl"
                aria-label="메뉴 열기"
              >
                &#9776;
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-[var(--color-bg-secondary)] border-[var(--color-border-dark)] w-[280px] max-w-[80vw] p-6">
              <SheetTitle className="sr-only">메뉴</SheetTitle>

              <nav className="flex flex-col gap-1 mt-4">
                <Link href="/counselors" onClick={closeDrawer} className={navLinkClass}>상담사</Link>
                {me && <Link href="/credits" onClick={closeDrawer} className={navLinkClass}>상담권</Link>}
                {me && <Link href="/bookings/me" onClick={closeDrawer} className={navLinkClass}>내예약</Link>}
                {me && <Link href="/sessions" onClick={closeDrawer} className={navLinkClass}>세션관리</Link>}
              </nav>

              {isCounselor && (
                <>
                  <Separator className="my-3 bg-[var(--color-border-dark)]" />
                  <nav className="flex flex-col gap-1">
                    <Link href="/counselor" onClick={closeDrawer} className={navLinkClass}>선생님 포털</Link>
                  </nav>
                </>
              )}

              {isAdmin && (
                <>
                  <Separator className="my-3 bg-[var(--color-border-dark)]" />
                  <nav className="flex flex-col gap-1">
                    <Link href="/dashboard" onClick={closeDrawer} className={navLinkClass}>대시보드</Link>
                    <Link href="/admin/timeline" onClick={closeDrawer} className={navLinkClass}>타임라인</Link>
                    <Link href="/admin/audit" onClick={closeDrawer} className={navLinkClass}>감사로그</Link>
                  </nav>
                </>
              )}

              <Separator className="my-3 bg-[var(--color-border-dark)]" />

              {me ? (
                <div className="flex flex-col gap-2">
                  <div className="px-2 flex gap-2 flex-wrap">
                    <CreditWidget />
                    <WalletWidget />
                  </div>
                  <span className="text-sm text-[var(--color-text-muted-dark)] font-heading px-2">{me.name} ({me.role})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="mx-2 border-[var(--color-border-dark)] text-[var(--color-text-on-dark)] bg-transparent font-medium hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] hover:bg-transparent"
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <nav className="flex flex-col gap-1">
                  <Link href="/login" onClick={closeDrawer} className={navLinkClass}>로그인</Link>
                  <Link href="/signup" onClick={closeDrawer} className={navLinkClass}>회원가입</Link>
                </nav>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
