import { API_BASE } from '../../../components/api';

type Slot = { id: number; startAt: string; endAt: string };
type CounselorDetail = { id: number; name: string; specialty: string; intro: string; slots: Slot[] };

async function getCounselor(id: string): Promise<CounselorDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/counselors/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function CounselorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const counselor = await getCounselor(id);

  if (!counselor) {
    return <main style={{ padding: 24 }}>상담사를 찾을 수 없습니다.</main>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>{counselor.name}</h2>
      <p>{counselor.specialty}</p>
      <p>{counselor.intro}</p>

      <h3>예약 가능 슬롯</h3>
      <ul>
        {counselor.slots.map((s) => (
          <li key={s.id}>
            {new Date(s.startAt).toLocaleString('ko-KR')} ~ {new Date(s.endAt).toLocaleTimeString('ko-KR')}
          </li>
        ))}
      </ul>
    </main>
  );
}
