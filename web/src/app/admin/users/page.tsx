'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
  Pagination,
  ConfirmDialog,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type UserItem = {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [suspendTarget, setSuspendTarget] = useState<UserItem | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (roleFilter) params.set('role', roleFilter);
      params.set('page', String(p - 1));
      params.set('size', String(PAGE_SIZE));
      const query = params.toString();

      const res = await apiFetch(`/api/v1/admin/users?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '사용자 목록을 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setUsers(json.content || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter]);

  useEffect(() => {
    loadUsers(page);
  }, [page, loadUsers]);

  async function handleSuspend() {
    if (!suspendTarget || !suspendReason.trim()) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/users/${suspendTarget.id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: suspendReason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '정지에 실패했습니다.');
      } else {
        setSuccess(`${suspendTarget.name}님을 정지했습니다.`);
        setSuspendTarget(null);
        setSuspendReason('');
        loadUsers(page);
      }
    } catch {
      setError('정지 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUnsuspend(user: UserItem) {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/users/${user.id}/unsuspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '정지 해제에 실패했습니다.');
      } else {
        setSuccess(`${user.name}님의 정지를 해제했습니다.`);
        loadUsers(page);
      }
    } catch {
      setError('정지 해제 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function handleSearch() {
    setPage(1);
    loadUsers(1);
  }

  if (loading && users.length === 0) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>사용자 관리</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>사용자 관리</PageTitle>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Filters */}
        <Card>
          <div className="flex gap-3 items-end flex-wrap">
            <input
              placeholder="이름 또는 이메일 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none flex-1 min-w-[200px]"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:outline-none"
            >
              <option value="">상태: 전체</option>
              <option value="ACTIVE">활성</option>
              <option value="SUSPENDED">정지</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:outline-none"
            >
              <option value="">역할: 전체</option>
              <option value="USER">USER</option>
              <option value="COUNSELOR">COUNSELOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <ActionButton onClick={handleSearch} loading={loading}>검색</ActionButton>
          </div>
        </Card>

        {/* Users table */}
        {users.length === 0 ? (
          <EmptyState title="사용자가 없습니다" desc="검색 조건을 변경해보세요." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">이름</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">이메일</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">역할</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow
                    key={u.id}
                    className="hover:bg-[rgba(201,162,39,0.03)] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/users/${u.id}`)}
                  >
                    <TableCell className="font-mono text-sm">#{u.id}</TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-[#a49484]">{u.email}</TableCell>
                    <TableCell><StatusBadge value={u.role} /></TableCell>
                    <TableCell><StatusBadge value={u.status} /></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {u.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => handleUnsuspend(u)}
                          disabled={processing}
                          className="rounded-full bg-[#C9A227] text-[#0f0d0a] text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] hover:bg-[#b08d1f] transition-colors"
                        >
                          정지 해제
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSuspendTarget(u); setSuspendReason(''); }}
                          disabled={processing}
                          className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] hover:bg-[#6d0000] transition-colors"
                        >
                          정지
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Suspend dialog */}
        <ConfirmDialog
          open={!!suspendTarget}
          title="사용자 정지"
          message={suspendTarget ? `${suspendTarget.name}(${suspendTarget.email})님을 정지하시겠습니까?` : ''}
          confirmLabel={processing ? '처리 중...' : '정지'}
          variant="danger"
          onConfirm={handleSuspend}
          onCancel={() => { setSuspendTarget(null); setSuspendReason(''); }}
        />
        {/* Reason input (rendered as part of the dialog via a simple overlay) */}
        {suspendTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-[var(--color-bg-card)] border border-[rgba(201,162,39,0.15)] rounded-2xl p-6 max-w-[420px] w-full mx-4 space-y-4">
              <h3 className="font-heading font-bold text-lg">사용자 정지</h3>
              <p className="text-[#a49484] text-sm">
                {suspendTarget.name}({suspendTarget.email})님을 정지합니다.
              </p>
              <textarea
                placeholder="정지 사유를 입력하세요 (필수)"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[80px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setSuspendTarget(null); setSuspendReason(''); }}
                  className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-5 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSuspend}
                  disabled={processing || !suspendReason.trim()}
                  className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-5 py-2 hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                >
                  {processing ? '처리 중...' : '정지'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAdmin>
  );
}
