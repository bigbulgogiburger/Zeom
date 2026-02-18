import type { Metadata } from 'next';
import { API_BASE } from '../components/api';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
  title: '천지연꽃신당 — 온라인 점사 상담',
  description: '한국 전통 점사 상담 플랫폼. 검증된 상담사와 1:1 비밀 상담을 시작하세요.',
};

type Counselor = { id: number; name: string; specialty: string; intro: string };

async function getCounselors(): Promise<Counselor[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/counselors`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const counselors = await getCounselors();
  return <HomeContent counselors={counselors} />;
}
