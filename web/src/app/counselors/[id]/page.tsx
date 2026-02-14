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

export const metadata: Metadata = {
  title: '상담사 상세',
};

export default async function CounselorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CounselorDetailClient id={id} />;
}
