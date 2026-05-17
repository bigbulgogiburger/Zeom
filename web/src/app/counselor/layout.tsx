'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RequireCounselor } from '@/components/counselor-auth';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';
// auth-client: tokens managed via httpOnly cookies
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  BookOpenText,
  CalendarClock,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  Star,
  UserRoundCog,
  Users,
} from 'lucide-react';

const menuItems = [
  { label: '대시보드', href: '/counselor', icon: LayoutDashboard },
  { label: '상담실', href: '/counselor/room', icon: MessageSquareText },
  { label: '예약 내역', href: '/counselor/bookings', icon: CalendarClock },
  { label: '정산', href: '/counselor/settlement', icon: CreditCard },
  { label: '고객 관리', href: '/counselor/customers', icon: Users },
  { label: '스케줄 관리', href: '/counselor/schedule', icon: ClipboardList },
  { label: '리뷰 관리', href: '/counselor/reviews', icon: Star },
  { label: '상담 기록', href: '/counselor/records', icon: BookOpenText },
  { label: '프로필 설정', href: '/counselor/profile', icon: UserRoundCog },
];

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {menuItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/counselor' && pathname?.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium font-heading transition-colors no-underline',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]',
              isActive
                ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--gold))] font-bold shadow-[inset_3px_0_0_hsl(var(--gold))]'
                : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--text-primary))]'
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
  const { me, refreshMe } = useAuth();
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);

  async function logout() {
    await apiFetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    await refreshMe();
    router.push('/login');
  }

  return (
    <RequireCounselor>
      <div className="flex min-h-[100dvh] bg-[hsl(var(--background))]">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col gap-4 border-r border-[hsl(var(--border-subtle))] bg-[hsl(var(--sidebar-background))] p-4">
          <div className="flex items-center gap-2 font-heading text-base font-bold text-[hsl(var(--text-primary))]">
            <Settings className="size-4 text-[hsl(var(--gold))]" aria-hidden="true" />
            <span>선생님 포털</span>
          </div>
          <Separator className="bg-[hsl(var(--border-subtle))]" />
          <SidebarNav />
          <div className="mt-auto">
            <Separator className="mb-4 bg-[hsl(var(--border-subtle))]" />
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block size-2.5 shrink-0 rounded-full bg-[hsl(var(--success))]" />
              <span className="text-sm text-[hsl(var(--text-secondary))] font-heading truncate">
                {me?.name ?? '상담사'} 선생님
              </span>
              <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--text-primary))] text-[10px] px-1.5 py-0">
                온라인
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full gap-2 rounded-md border border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] font-heading font-bold hover:bg-[hsl(var(--gold))]/10"
            >
              <LogOut className="size-4" aria-hidden="true" />
              로그아웃
            </Button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-[hsl(var(--border-subtle))] bg-[hsl(var(--background))]/88 backdrop-blur-xl">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="상담사 메뉴 열기"
                  className="text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]"
                >
                  <Menu className="size-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[240px] bg-[hsl(var(--sidebar-background))] border-[hsl(var(--border-subtle))] p-4"
              >
                <SheetTitle className="mb-4 flex items-center gap-2 font-heading text-base font-bold text-[hsl(var(--text-primary))]">
                  <Settings className="size-4 text-[hsl(var(--gold))]" aria-hidden="true" />
                  <span>선생님 포털</span>
                </SheetTitle>
                <Separator className="mb-4 bg-[hsl(var(--border-subtle))]" />
                <SidebarNav onItemClick={() => setSheetOpen(false)} />
                <Separator className="my-4 bg-[hsl(var(--border-subtle))]" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block size-2.5 shrink-0 rounded-full bg-[hsl(var(--success))]" />
                  <span className="text-sm text-[hsl(var(--text-secondary))] font-heading truncate">
                    {me?.name ?? '상담사'} 선생님
                  </span>
                  <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--text-primary))] text-[10px] px-1.5 py-0">
                    온라인
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full gap-2 rounded-md border border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] font-heading font-bold hover:bg-[hsl(var(--gold))]/10"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  로그아웃
                </Button>
              </SheetContent>
            </Sheet>
            <span className="font-heading font-bold text-[hsl(var(--text-primary))]">
              선생님 포털
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[hsl(var(--text-secondary))] font-heading">
              <span className="inline-block size-2 rounded-full bg-[hsl(var(--success))]" />
              {me?.name ?? '상담사'}
            </span>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RequireCounselor>
  );
}
