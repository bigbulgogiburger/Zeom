import Link from 'next/link';
import { API_BASE } from '../../components/api';
import { Card, EmptyState, PageTitle } from '../../components/ui';

type Counselor = { id: number; name: string; specialty: string; intro: string };

async function getCounselors(): Promise<Counselor[]> {
  const res = await fetch(`${API_BASE}/api/v1/counselors`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function CounselorsPage() {
  const counselors = await getCounselors();

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>상담사 목록</PageTitle>

      {counselors.length === 0 ? (
        <EmptyState title="상담사가 아직 없어요" desc="잠시 후 다시 시도해주세요." />
      ) : (
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
      )}
    </main>
  );
}
