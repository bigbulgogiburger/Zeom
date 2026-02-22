import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나의 사주 명식 | 천지연꽃신당',
  description: '나의 사주팔자(四柱八字)를 확인하세요. 년주, 월주, 일주, 시주와 오행 분포를 시각화합니다.',
};

export default function MySajuLayout({ children }: { children: React.ReactNode }) {
  return children;
}
