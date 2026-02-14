import Link from 'next/link';
import { Card, PageTitle } from '../components/ui';

export default function NotFound() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>404 — 페이지를 찾을 수 없습니다</PageTitle>
      <Card>
        <p style={{ color: '#94a3b8', marginTop: 0 }}>
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <Link href="/">홈으로 돌아가기</Link>
      </Card>
    </main>
  );
}
