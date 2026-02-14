'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from './api-client';
import { clearTokens, getRefreshToken } from './auth-client';
import { useAuth } from './auth-context';

export default function AppHeader() {
  const { me, refreshMe } = useAuth();
  const router = useRouter();

  async function logout() {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    }
    clearTokens();
    await refreshMe();
    router.push('/login');
  }

  return (
    <header style={{ padding: '10px 16px', borderBottom: '1px solid #334155', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Link href="/">홈</Link>
      <Link href="/counselors">상담사</Link>
      {me && <Link href="/bookings/me">내예약</Link>}
      {me && <Link href="/sessions">세션관리</Link>}
      {me?.role === 'ADMIN' && <Link href="/dashboard">대시보드</Link>}
      {me?.role === 'ADMIN' && <Link href="/admin/audit">감사로그</Link>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {me ? (
          <>
            <span style={{ fontSize: 13, color: '#cbd5e1' }}>{me.name} ({me.role})</span>
            <button onClick={logout}>로그아웃</button>
          </>
        ) : (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
            <Link href="/admin/login">관리자</Link>
          </>
        )}
      </div>
    </header>
  );
}
