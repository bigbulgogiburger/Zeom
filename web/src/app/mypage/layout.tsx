import type { ReactNode } from 'react';
import {
  User,
  Lock,
  Bell,
  Heart,
  CreditCard,
  Wallet,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import { RequireLogin } from '../../components/route-guard';
import { SidebarNav, type SidebarNavItem } from '@/components/design';

const sidebarItems: SidebarNavItem[] = [
  { href: '/mypage', label: '내 프로필', icon: User },
  { href: '/mypage/edit', label: '프로필 수정', icon: User },
  { href: '/mypage/password', label: '비밀번호 변경', icon: Lock },
  { href: '/notification-preferences', label: '알림 설정', icon: Bell },
  { href: '/favorites', label: '즐겨찾기', icon: Heart },
  { href: '/credits', label: '상담권 관리', icon: CreditCard },
  { href: '/wallet', label: '지갑', icon: Wallet },
  { href: '/faq', label: '자주 묻는 질문', icon: HelpCircle },
  { href: '/mypage/delete', label: '회원 탈퇴', icon: Trash2, danger: true },
];

export default function MypageLayout({ children }: { children: ReactNode }) {
  return (
    <RequireLogin>
      <main className="mx-auto max-w-[1200px] px-6 py-12 grid md:grid-cols-[240px_1fr] gap-12">
        <SidebarNav items={sidebarItems} ariaLabel="마이페이지 메뉴" />
        <section className="min-w-0">{children}</section>
      </main>
    </RequireLogin>
  );
}
