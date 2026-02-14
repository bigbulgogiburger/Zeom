import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, PageTitle } from '../components/ui';

export const metadata: Metadata = {
  title: '천지연꽃신당 — 온라인 점사 상담',
  description: '온라인 점사 상담을 위한 예약·결제·상담방 통합 플랫폼',
};

export default function HomePage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <PageTitle>천지연꽃신당</PageTitle>
      <Card>
        <p style={{ marginTop: 0, color: '#cbd5e1' }}>온라인 점사 상담을 위한 예약·결제·상담방 통합 플랫폼</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/signup">회원가입</Link>
          <Link href="/login">로그인</Link>
          <Link href="/counselors">상담사 보기</Link>
          <Link href="/bookings/me">내 예약</Link>
          <Link href="/sessions">세션관리</Link>
        </div>
      </Card>

      <Card>
        <h3 style={{ marginTop: 0 }}>관리자</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/admin/login">관리자 로그인</Link>
          <Link href="/dashboard">대시보드</Link>
          <Link href="/admin/timeline">타임라인</Link>
          <Link href="/admin/audit">감사로그</Link>
        </div>
      </Card>
    </main>
  );
}
