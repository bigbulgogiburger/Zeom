'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Users,
  CreditCard,
  AlertTriangle,
  Undo2,
  Star,
  Ticket,
  UserPlus,
  FileSearch,
  ShieldAlert,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MenuItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type MenuGroup = {
  label: string;
  items: ReadonlyArray<MenuItem>;
};

const MENU: ReadonlyArray<MenuGroup> = [
  {
    label: '운영',
    items: [
      { label: '대시보드', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: '분석', href: '/admin/analytics', icon: LineChart },
      { label: '시스템 타임라인', href: '/admin/timeline', icon: Activity },
    ],
  },
  {
    label: '사용자',
    items: [
      { label: '사용자', href: '/admin/users', icon: Users },
      { label: '상담사 신청', href: '/admin/counselor-applications', icon: UserPlus },
      { label: '후기 모더레이션', href: '/admin/reviews', icon: Star },
    ],
  },
  {
    label: '거래',
    items: [
      { label: '정산', href: '/admin/settlements', icon: CreditCard },
      { label: '환불', href: '/admin/refunds', icon: Undo2 },
      { label: '쿠폰', href: '/admin/coupons', icon: Ticket },
    ],
  },
  {
    label: '감사',
    items: [
      { label: '분쟁', href: '/admin/disputes', icon: AlertTriangle },
      { label: '감사 로그', href: '/admin/audit', icon: FileSearch },
    ],
  },
];

export function AdminSidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-3" aria-label="어드민 메뉴">
      {MENU.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--text-secondary))]">
            {group.label}
          </div>
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors no-underline',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]',
                  isActive
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--gold))] font-semibold shadow-[inset_3px_0_0_hsl(var(--gold))]'
                    : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--text-primary))]'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebarHeader() {
  return (
    <div className="flex items-center gap-2 font-heading text-base font-bold text-[hsl(var(--text-primary))]">
      <ShieldAlert className="size-4 text-[hsl(var(--gold))]" aria-hidden="true" />
      <span>어드민 포털</span>
    </div>
  );
}

