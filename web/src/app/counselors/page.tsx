import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { API_BASE } from '../../components/api';
import { Card, EmptyState, PageTitle } from '../../components/ui';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '상담사 목록',
  description: '천지연꽃신당 상담사 목록 및 예약 가능 슬롯 확인',
};

type Counselor = { id: number; name: string; specialty: string; intro: string };

async function getCounselors(): Promise<Counselor[]> {
  const res = await fetch(`${API_BASE}/api/v1/counselors`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) return [];
  return res.json();
}

async function CounselorList() {
  const counselors = await getCounselors();

  if (counselors.length === 0) {
    return <EmptyState title="상담사가 아직 없어요" desc="잠시 후 다시 시도해주세요." />;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {counselors.map((c) => (
        <Card key={c.id}>
          <h3 style={{ margin: '0 0 6px 0' }}>{c.name}</h3>
          <div style={{ color: '#93c5fd', fontSize: 14 }}>{c.specialty}</div>
          <p style={{ color: '#cbd5e1' }}>{c.intro}</p>
          <Link href={`/counselors/${c.id}`}>상세/가능 슬롯 보기</Link>
        </Card>
      ))}
    </div>
  );
}

export default function CounselorsPage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>상담사 목록</PageTitle>
      <Suspense fallback={
        <div style={{ display: 'grid', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ border: '1px solid #334155', background: '#0b1220', borderRadius: 12, padding: 12 }}>
              <div style={{ height: 20, width: 120, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, width: 80, background: '#1e293b', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, width: '70%', background: '#1e293b', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      }>
        <CounselorList />
      </Suspense>
    </main>
  );
}
