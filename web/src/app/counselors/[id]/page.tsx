import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const CounselorDetailClient = dynamic(() => import('./CounselorDetailClient'), {
  loading: () => (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <div style={{ height: 32, width: 140, background: '#1e293b', borderRadius: 8 }} />
      <div style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
        <div style={{ height: 14, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ height: 14, width: '60%', background: '#1e293b', borderRadius: 4 }} />
      </div>
    </main>
  ),
});

type CounselorSummary = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
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

  const title = `${counselor.name} 상담사 — ${counselor.specialty}`;
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
