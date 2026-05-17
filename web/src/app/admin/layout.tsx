'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RequireAdmin } from '@/components/route-guard';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSidebarNav, AdminSidebarHeader } from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // login 페이지는 게스트 접근 — RequireAdmin 가드 + chrome 모두 우회
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <RequireAdmin>
      <div className="flex min-h-[100dvh] bg-background">
        {/* Desktop sidebar — 240px */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col gap-4 border-r border-border-subtle bg-sidebar-background p-4">
          <AdminSidebarHeader />
          <Separator className="bg-border-subtle" />
          <AdminSidebarNav />
        </aside>

        {/* Main area */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminPageHeader
            leftSlot={
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="어드민 메뉴 열기"
                    className="md:hidden text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]"
                  >
                    <Menu className="size-5" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[260px] bg-sidebar-background border-border-subtle p-4"
                >
                  <SheetTitle className="mb-2">
                    <AdminSidebarHeader />
                  </SheetTitle>
                  <Separator className="mb-3 bg-border-subtle" />
                  <AdminSidebarNav onItemClick={() => setSheetOpen(false)} />
                </SheetContent>
              </Sheet>
            }
          />
          <main className="flex-1 overflow-x-auto bg-background p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
