import Link from 'next/link';
import { API_BASE } from '../../components/api';

type Counselor = { id: number; name: string; specialty: string; intro: string };

async function getCounselors(): Promise<Counselor[]> {
  const res = await fetch(`${API_BASE}/api/v1/counselors`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function CounselorsPage() {
  const counselors = await getCounselors();

  return (
    <main style={{ padding: 24 }}>
      <h2>상담사 목록</h2>
      <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0 }}>
        {counselors.map((c) => (
          <li key={c.id} style={{ border: '1px solid #334155', borderRadius: 8, padding: 12 }}>
            <h3>{c.name}</h3>
            <p>{c.specialty}</p>
            <p>{c.intro}</p>
            <Link href={`/counselors/${c.id}`}>상세/가능 슬롯 보기</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
