'use client';

import { useEffect, useRef, useState } from 'react';
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
  const [bounceKey, setBounceKey] = useState<string | null>(null);
  const prevPathRef = useRef(pathname);

  // Trigger bounce animation when active tab changes
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      const activeTab = tabs.find(({ href }) =>
        href === '/' ? pathname === '/' : pathname.startsWith(href),
      );
      if (activeTab) {
        setBounceKey(activeTab.href);
        const timer = setTimeout(() => setBounceKey(null), 400);
        return () => clearTimeout(timer);
      }
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[hsl(var(--background)/0.92)] backdrop-blur-xl border-t border-[hsl(var(--border-subtle))]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          const isBouncing = bounceKey === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 no-underline min-w-[44px] min-h-[44px] transition-colors duration-200 ${isBouncing ? 'tab-bounce' : ''}`}
              style={{
                color: isActive
                  ? 'hsl(var(--gold))'
                  : 'hsl(var(--text-muted))',
              }}
            >
              {/* Active dot indicator */}
              <span
                className="rounded-full transition-all duration-300"
                style={{
                  width: isActive ? 5 : 0,
                  height: isActive ? 5 : 0,
                  backgroundColor: 'hsl(var(--gold))',
                  opacity: isActive ? 1 : 0,
                  marginBottom: 1,
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
                  letterSpacing: isActive ? '0.02em' : '0',
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
