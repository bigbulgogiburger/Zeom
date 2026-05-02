import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const CounselorDetailClient = dynamic(() => import('./CounselorDetailClient'), {
  loading: () => (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="glow-card animate-pulse motion-reduce:animate-none p-8 h-[420px]" aria-hidden="true" />
        <div className="glow-card animate-pulse motion-reduce:animate-none p-8 h-[280px]" aria-hidden="true" />
      </div>
    </main>
  ),
});

type CounselorSummary = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
  profileImageUrl?: string | null;
  averageRating?: number;
  totalReviews?: number;
};

async function fetchCounselor(id: string): Promise<CounselorSummary | null> {
  try {
    const apiBase =
      process.env.API_BASE_URL_INTERNAL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      'http://localhost:8080';
    const res = await fetch(`${apiBase}/api/v1/counselors/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const counselor = await fetchCounselor(id);

  if (!counselor) {
    return { title: '상담사 상세' };
  }

  const ratingStr = counselor.averageRating ? ` (${counselor.averageRating.toFixed(1)}점)` : '';
  const title = `${counselor.name} 상담사 — ${counselor.specialty}${ratingStr}`;
  const description = counselor.intro || `${counselor.name} 상담사의 프로필과 예약 가능한 시간을 확인하세요.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | 천지연꽃신당`,
      description,
      type: 'profile',
      locale: 'ko_KR',
      url: `https://www.cheonjiyeon.com/counselors/${id}`,
      ...(counselor.profileImageUrl ? { images: [{ url: counselor.profileImageUrl }] } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function CounselorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CounselorDetailClient id={id} />;
}
