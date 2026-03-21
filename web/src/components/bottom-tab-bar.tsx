'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, Users, Calendar, User } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', icon: Home },
  { href: '/fortune', label: '운세', icon: Sparkles },
  { href: '/counselors', label: '상담사', icon: Users },
  { href: '/bookings', label: '내역', icon: Calendar },
  { href: '/mypage', label: 'MY', icon: User },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[hsl(var(--background)/0.9)] backdrop-blur-xl border-t border-[hsl(var(--border-subtle))]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around" style={{ height: 56 }}>
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 no-underline min-w-[44px] min-h-[44px] transition-all duration-200"
              style={{
                color: isActive
                  ? 'hsl(var(--gold))'
                  : 'hsl(var(--text-muted))',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {/* Active dot indicator */}
              <span
                className="rounded-full transition-all duration-200"
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: isActive
                    ? 'hsl(var(--gold))'
                    : 'transparent',
                  marginBottom: 2,
                }}
                aria-hidden="true"
              />
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
