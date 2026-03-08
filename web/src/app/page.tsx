import type { Metadata } from 'next';
import { API_BASE } from '../components/api';
import HomeContent from './HomeContent';

export const metadata: Metadata = {
  title: '천지연꽃신당 — 온라인 점사 상담',
  description: '한국 전통 점사 상담 플랫폼. 검증된 상담사와 1:1 비밀 상담을 시작하세요.',
};

type Counselor = { id: number; name: string; specialty: string; intro: string };

export type PublicStats = {
  totalCounselors: number;
  totalConsultations: number;
  averageRating: number;
  totalReviews: number;
};

export type FeaturedReview = {
  id: number;
  rating: number;
  comment: string;
  authorName: string;
  counselorName: string;
  createdAt: string;
};

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

async function getPublicStats(): Promise<PublicStats> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats/public`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { totalCounselors: 0, totalConsultations: 0, averageRating: 0, totalReviews: 0 };
    return res.json();
  } catch {
    return { totalCounselors: 0, totalConsultations: 0, averageRating: 0, totalReviews: 0 };
  }
}

async function getFeaturedReviews(): Promise<FeaturedReview[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/stats/reviews/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [counselors, stats, featuredReviews] = await Promise.all([
    getCounselors(),
    getPublicStats(),
    getFeaturedReviews(),
  ]);
  return <HomeContent counselors={counselors} stats={stats} featuredReviews={featuredReviews} />;
}
