'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequireLogin } from '../../components/route-guard';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/mypage', label: '내 정보' },
  { href: '/mypage/edit', label: '프로필 수정' },
  { href: '/mypage/password', label: '비밀번호 변경' },
  { href: '/mypage/delete', label: '계정 탈퇴' },
];

export default function MypageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <RequireLogin>
      <main
        className="min-h-screen bg-[#0f0d0a] py-12 px-4 sm:px-6"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.05) 0%, transparent 70%)' }}
      >
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#C9A227] to-[#D4A843] bg-clip-text text-transparent font-heading m-0 mb-8">
            마이페이지
          </h1>

          <nav className="flex gap-1 mb-8 overflow-x-auto pb-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-bold font-heading whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a]'
                      : 'text-[#a49484] hover:text-[#C9A227] hover:bg-[#C9A227]/10'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </main>
    </RequireLogin>
  );
}
