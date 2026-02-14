import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1>천지연꽃신당</h1>
      <p>Step2: 회원가입/로그인 + 상담사/슬롯 조회</p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/signup">회원가입</Link>
        <Link href="/login">로그인</Link>
        <Link href="/counselors">상담사 보기</Link>
      </div>
    </main>
  );
}
