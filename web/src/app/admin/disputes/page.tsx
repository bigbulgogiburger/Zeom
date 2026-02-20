'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/components/api-client';
import { RequireAdmin } from '@/components/route-guard';
import {
  Card,
  PageTitle,
  InlineError,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
  Pagination,
} from '@/components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type DisputeItem = {
  id: number;
  reservationId: number;
  userId: number;
  category: string;
  status: string;
  description: string;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadDisputes = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(p - 1));
      params.set('size', String(PAGE_SIZE));
      const query = params.toString();

      const res = await apiFetch(`/api/v1/admin/disputes?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '분쟁 목록을 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setDisputes(json.content || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      setError('분쟁 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDisputes(page);
  }, [page, loadDisputes]);

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading && disputes.length === 0) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>분쟁 관리</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>분쟁 관리</PageTitle>

        <InlineError message={error} />

        {/* Filters */}
        <Card>
          <div className="flex gap-3 items-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:outline-none"
            >
              <option value="">상태: 전체</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
            <ActionButton onClick={() => loadDisputes(page)} loading={loading}>
              새로고침
            </ActionButton>
          </div>
        </Card>

        {disputes.length === 0 ? (
          <EmptyState title="분쟁이 없습니다" desc="필터를 조정해보세요." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">카테고리</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">설명</TableHead>
                  <TableHead className="font-heading font-bold text-[#C9A227]">접수일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((d) => (
                  <TableRow
                    key={d.id}
                    className="hover:bg-[rgba(201,162,39,0.03)] transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/disputes/${d.id}`)}
                  >
                    <TableCell className="font-mono text-sm">#{d.id}</TableCell>
                    <TableCell className="font-medium">{d.category}</TableCell>
                    <TableCell><StatusBadge value={d.status} /></TableCell>
                    <TableCell className="text-[#a49484] max-w-[300px] truncate">
                      {d.description}
                    </TableCell>
                    <TableCell className="text-[#a49484]">
                      {new Date(d.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </RequireAdmin>
  );
}
