import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '회원가입',
  description: '천지연꽃신당 회원가입. 무료 가입 후 전문 상담사와 1:1 화상상담을 시작하세요.',
  openGraph: {
    title: '회원가입 | 천지연꽃신당',
    description: '천지연꽃신당에 무료 가입하고 사주, 타로, 신점 전문가를 만나보세요.',
    url: 'https://www.cheonjiyeon.com/signup',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
