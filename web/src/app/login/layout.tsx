import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: '천지연꽃신당 로그인. 카카오, 네이버 소셜 로그인 또는 이메일로 로그인하세요.',
  openGraph: {
    title: '로그인 | 천지연꽃신당',
    description: '천지연꽃신당에 로그인하여 전문 상담사와 1:1 상담을 시작하세요.',
    url: 'https://www.cheonjiyeon.com/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
