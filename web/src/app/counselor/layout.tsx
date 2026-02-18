'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RequireCounselor } from '@/components/counselor-auth';
import { useAuth } from '@/components/auth-context';
import { apiFetch } from '@/components/api-client';
import { clearTokens, getRefreshToken } from '@/components/auth-client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: '대시보드', href: '/counselor' },
  { label: '상담실', href: '/counselor/room' },
  { label: '예약 내역', href: '/counselor/bookings' },
  { label: '정산', href: '/counselor/settlement' },
  { label: '고객 관리', href: '/counselor/customers' },
  { label: '스케줄 관리', href: '/counselor/schedule' },
  { label: '리뷰 관리', href: '/counselor/reviews' },
  { label: '상담 기록', href: '/counselor/records' },
  { label: '프로필 설정', href: '/counselor/profile' },
];

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1.5">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'px-4 py-3 rounded-xl text-sm font-medium font-heading transition-colors no-underline',
              isActive
                ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold shadow-md'
                : 'text-[#a49484] hover:bg-[rgba(201,162,39,0.08)] hover:text-[#C9A227]'
            )}
          >
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
    router.push('/login');
  }

  return (
    <RequireCounselor>
      <div className="flex min-h-screen bg-[#0f0d0a]">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[rgba(201,162,39,0.1)] bg-[#1a1612] p-5 gap-4 shrink-0">
          <div className="font-heading font-bold text-lg bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
            선생님 포털
          </div>
          <Separator className="bg-[rgba(201,162,39,0.1)]" />
          <SidebarNav />
          <div className="mt-auto">
            <Separator className="bg-[rgba(201,162,39,0.1)] mb-4" />
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm text-[#a49484] font-heading truncate">
                {me?.name} 선생님
              </span>
              <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                온라인
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full font-heading font-bold hover:bg-[#C9A227]/10"
            >
              로그아웃
            </Button>
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-[rgba(201,162,39,0.1)] bg-[rgba(15,13,10,0.8)] backdrop-blur-xl">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#a49484] font-heading hover:text-[#C9A227]"
                >
                  &#9776; 메뉴
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-64 bg-[#1a1612] border-[rgba(201,162,39,0.1)] p-4"
              >
                <SheetTitle className="font-heading font-bold text-lg bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent mb-4">
                  선생님 포털
                </SheetTitle>
                <Separator className="bg-[rgba(201,162,39,0.1)] mb-4" />
                <SidebarNav onItemClick={() => setSheetOpen(false)} />
                <Separator className="bg-[rgba(201,162,39,0.1)] my-4" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-sm text-[#a49484] font-heading truncate">
                    {me?.name} 선생님
                  </span>
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">
                    온라인
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="w-full border-2 border-[#C9A227]/30 text-[#C9A227] rounded-full font-heading font-bold hover:bg-[#C9A227]/10"
                >
                  로그아웃
                </Button>
              </SheetContent>
            </Sheet>
            <span className="font-heading font-bold bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent">
              선생님 포털
            </span>
            <span className="flex items-center gap-1.5 text-sm text-[#a49484] font-heading">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              {me?.name}
            </span>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </RequireCounselor>
  );
}
