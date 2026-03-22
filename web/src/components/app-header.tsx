'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { apiFetch } from './api-client';
// auth-client: tokens managed via httpOnly cookies
import { useAuth } from './auth-context';
import CreditWidget from './credit-widget';
import WalletWidget from './wallet-widget';
import NotificationBell from './notification-bell';
import LanguageSwitcher from './language-switcher';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export default function AppHeader() {
  const { me, refreshMe } = useAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations('common');

  async function logout() {
    await apiFetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    await refreshMe();
    setDrawerOpen(false);
    router.push('/login');
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  const isAdmin = me?.role === 'ADMIN';
  const isCounselor = me?.role === 'COUNSELOR';

  const desktopNavLinkClass =
    'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] rounded-lg px-3 py-2 transition-colors duration-200 no-underline';

  const mobileNavLinkClass =
    'text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] rounded-lg px-3 py-2.5 transition-colors duration-200 no-underline block font-medium';

  return (
    <>
      <header className="sticky top-0 z-[100] h-16 flex items-center px-6 bg-[hsl(var(--background)/0.85)] backdrop-blur-xl border-b border-[hsl(var(--border-subtle))]">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[hsl(var(--gold))] no-underline shrink-0"
        >
          천지연꽃신당
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2 ml-8">
          <Link href="/counselors" className={desktopNavLinkClass}>
            상담사
          </Link>
          {me && (
            <Link href="/credits" className={desktopNavLinkClass}>
              상담권
            </Link>
          )}
          {me && (
            <Link href="/bookings/me" className={desktopNavLinkClass}>
              내예약
            </Link>
          )}
          {me && (
            <Link href="/sessions" className={desktopNavLinkClass}>
              세션관리
            </Link>
          )}
          {me && (
            <Link href="/notifications" className={desktopNavLinkClass}>
              알림
            </Link>
          )}
          {isCounselor && (
            <Link href="/counselor" className={desktopNavLinkClass}>
              선생님 포털
            </Link>
          )}
          {isAdmin && (
            <Link href="/dashboard" className={desktopNavLinkClass}>
              대시보드
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/timeline" className={desktopNavLinkClass}>
              타임라인
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/audit" className={desktopNavLinkClass}>
              감사로그
            </Link>
          )}
        </nav>

        {/* Desktop right section */}
        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher />
          {me ? (
            <>
              <CreditWidget />
              <WalletWidget />
              <NotificationBell />
              <span className="hidden md:inline text-sm text-[hsl(var(--text-secondary))]">
                {me.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="rounded-full border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] bg-transparent font-medium hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent transition-colors duration-200"
              >
                {t('logout')}
              </Button>
            </>
          ) : (
            <span className="hidden md:flex gap-1 items-center">
              <Link
                href="/login"
                className={desktopNavLinkClass}
              >
                {t('login')}
              </Link>
              <Link
                href="/signup"
                className={desktopNavLinkClass}
              >
                {t('signup')}
              </Link>
            </span>
          )}

          {/* Mobile hamburger - Sheet trigger */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden rounded-full border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] bg-transparent hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent min-w-[44px] min-h-[44px] transition-colors duration-200"
                aria-label="메뉴 열기"
              >
                <Menu size={20} strokeWidth={1.8} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-[hsl(var(--background))] border-l border-[hsl(var(--border-subtle))] w-[280px] max-w-[80vw] p-6"
            >
              <SheetTitle className="sr-only">메뉴</SheetTitle>

              {/* User info at top of drawer (if logged in) */}
              {me && (
                <>
                  <div className="mt-2 px-3 py-3">
                    <p className="text-[hsl(var(--text-primary))] font-semibold text-base">
                      {me.name}
                    </p>
                    <p className="text-[hsl(var(--text-muted))] text-sm mt-0.5">
                      {me.role}
                    </p>
                  </div>
                  <Separator className="my-2 bg-[hsl(var(--border-subtle))]" />
                </>
              )}

              <nav className="flex flex-col gap-1 mt-2">
                <Link href="/counselors" onClick={closeDrawer} className={mobileNavLinkClass}>
                  상담사
                </Link>
                {me && (
                  <Link href="/credits" onClick={closeDrawer} className={mobileNavLinkClass}>
                    상담권
                  </Link>
                )}
                {me && (
                  <Link href="/bookings/me" onClick={closeDrawer} className={mobileNavLinkClass}>
                    내예약
                  </Link>
                )}
                {me && (
                  <Link href="/sessions" onClick={closeDrawer} className={mobileNavLinkClass}>
                    세션관리
                  </Link>
                )}
                {me && (
                  <Link href="/notifications" onClick={closeDrawer} className={mobileNavLinkClass}>
                    알림
                  </Link>
                )}
                {me && (
                  <Link
                    href="/notification-preferences"
                    onClick={closeDrawer}
                    className={mobileNavLinkClass}
                  >
                    알림 설정
                  </Link>
                )}
              </nav>

              {isCounselor && (
                <>
                  <Separator className="my-3 bg-[hsl(var(--border-subtle))]" />
                  <nav className="flex flex-col gap-1">
                    <Link href="/counselor" onClick={closeDrawer} className={mobileNavLinkClass}>
                      선생님 포털
                    </Link>
                  </nav>
                </>
              )}

              {isAdmin && (
                <>
                  <Separator className="my-3 bg-[hsl(var(--border-subtle))]" />
                  <nav className="flex flex-col gap-1">
                    <Link href="/dashboard" onClick={closeDrawer} className={mobileNavLinkClass}>
                      대시보드
                    </Link>
                    <Link
                      href="/admin/timeline"
                      onClick={closeDrawer}
                      className={mobileNavLinkClass}
                    >
                      타임라인
                    </Link>
                    <Link
                      href="/admin/audit"
                      onClick={closeDrawer}
                      className={mobileNavLinkClass}
                    >
                      감사로그
                    </Link>
                  </nav>
                </>
              )}

              <Separator className="my-3 bg-[hsl(var(--border-subtle))]" />

              {me ? (
                <div className="flex flex-col gap-2">
                  <div className="px-2 flex gap-2 flex-wrap">
                    <CreditWidget />
                    <WalletWidget />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="mx-2 rounded-full border border-[hsl(var(--border-subtle))] text-[hsl(var(--text-secondary))] bg-transparent font-medium hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] hover:bg-transparent transition-colors duration-200"
                  >
                    {t('logout')}
                  </Button>
                </div>
              ) : (
                <nav className="flex flex-col gap-1">
                  <Link href="/login" onClick={closeDrawer} className={mobileNavLinkClass}>
                    {t('login')}
                  </Link>
                  <Link href="/signup" onClick={closeDrawer} className={mobileNavLinkClass}>
                    {t('signup')}
                  </Link>
                </nav>
              )}

              <Separator className="my-3 bg-[hsl(var(--border-subtle))]" />
              <div className="px-2">
                <LanguageSwitcher />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
