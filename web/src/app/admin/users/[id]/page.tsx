'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  StatusBadge,
  ActionButton,
  SkeletonCard,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserDetail = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  phone: string;
  gender: string;
  suspendedAt: string;
  suspendedReason: string;
};

type BookingItem = {
  id: number;
  status: string;
  creditsUsed: number;
  createdAt: string;
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [showSuspendForm, setShowSuspendForm] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/v1/admin/users/${userId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '사용자 정보를 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setUser(json.user);
      setBookings(json.recentBookings || []);
      setWalletBalance(json.walletBalance || 0);
    } catch {
      setError('사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleSuspend() {
    if (!suspendReason.trim()) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/users/${userId}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '정지에 실패했습니다.');
      } else {
        setSuccess('사용자를 정지했습니다.');
        setShowSuspendForm(false);
        setSuspendReason('');
        loadUser();
      }
    } catch {
      setError('정지 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUnsuspend() {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/users/${userId}/unsuspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '정지 해제에 실패했습니다.');
      } else {
        setSuccess('정지를 해제했습니다.');
        loadUser();
      }
    } catch {
      setError('정지 해제 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>사용자 상세</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="text-[#C9A227] font-heading font-bold text-sm hover:underline"
          >
            &larr; 목록으로
          </button>
          <PageTitle>사용자 상세</PageTitle>
        </div>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {user && (
          <>
            {/* Profile card */}
            <Card>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading font-bold text-xl">{user.name}</h3>
                    <StatusBadge value={user.status} />
                    <StatusBadge value={user.role} />
                  </div>
                  <div className="text-[#a49484] text-sm space-y-1">
                    <p>이메일: {user.email}</p>
                    {user.phone && <p>전화번호: {user.phone}</p>}
                    {user.gender && <p>성별: {user.gender}</p>}
                  </div>
                  {user.status === 'SUSPENDED' && (
                    <div className="mt-3 p-3 bg-[rgba(139,0,0,0.1)] border border-[rgba(139,0,0,0.3)] rounded-xl">
                      <p className="text-[#ff6b6b] text-sm font-bold">정지됨</p>
                      {user.suspendedReason && (
                        <p className="text-[#a49484] text-sm mt-1">사유: {user.suspendedReason}</p>
                      )}
                      {user.suspendedAt && (
                        <p className="text-[#a49484] text-xs mt-1">
                          정지일: {new Date(user.suspendedAt).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  {user.status === 'SUSPENDED' ? (
                    <ActionButton onClick={handleUnsuspend} loading={processing}>
                      정지 해제
                    </ActionButton>
                  ) : (
                    <button
                      onClick={() => setShowSuspendForm(!showSuspendForm)}
                      className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-6 py-2.5 hover:bg-[#6d0000] transition-colors"
                    >
                      계정 정지
                    </button>
                  )}
                </div>
              </div>

              {showSuspendForm && (
                <div className="mt-4 p-4 border border-[rgba(201,162,39,0.15)] rounded-xl space-y-3">
                  <textarea
                    placeholder="정지 사유를 입력하세요 (필수)"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[80px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none resize-none"
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => { setShowSuspendForm(false); setSuspendReason(''); }}
                      className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-5 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSuspend}
                      disabled={processing || !suspendReason.trim()}
                      className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-5 py-2 hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                    >
                      {processing ? '처리 중...' : '정지 확인'}
                    </button>
                  </div>
                </div>
              )}
            </Card>

            {/* Wallet balance */}
            <Card>
              <h3 className="font-heading font-bold text-[#C9A227] mb-3">지갑 잔액</h3>
              <p className="text-2xl font-heading font-bold">{formatCurrency(walletBalance)}</p>
            </Card>

            {/* Recent bookings */}
            <div>
              <h3 className="font-heading font-bold text-[#f9f5ed] mb-5 text-lg">
                최근 예약 ({bookings.length}건)
              </h3>
              {bookings.length === 0 ? (
                <Card>
                  <p className="text-[#a49484] text-sm text-center py-4">예약 내역이 없습니다.</p>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                        <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                        <TableHead className="font-heading font-bold text-[#C9A227]">사용 크레딧</TableHead>
                        <TableHead className="font-heading font-bold text-[#C9A227]">예약일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((b) => (
                        <TableRow key={b.id} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                          <TableCell className="font-mono text-sm">#{b.id}</TableCell>
                          <TableCell><StatusBadge value={b.status} /></TableCell>
                          <TableCell>{b.creditsUsed}</TableCell>
                          <TableCell className="text-[#a49484]">
                            {new Date(b.createdAt).toLocaleString('ko-KR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </RequireAdmin>
  );
}
