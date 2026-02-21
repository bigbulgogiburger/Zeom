import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '상담사 목록',
  description: '천지연꽃신당의 검증된 전문 상담사를 만나보세요. 사주, 타로, 신점, 꿈해몽, 궁합 분야별 전문가.',
  openGraph: {
    title: '상담사 목록 | 천지연꽃신당',
    description: '사주, 타로, 신점, 꿈해몽, 궁합 분야별 전문 상담사를 찾아보세요.',
    url: 'https://www.cheonjiyeon.com/counselors',
  },
};

export default function CounselorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
