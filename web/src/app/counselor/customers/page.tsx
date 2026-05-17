'use client';

import { useEffect, useState } from 'react';
import { getCounselorCustomers, getCounselorDashboard } from '@/components/api-client';
import { DenseCard, PageTitle, InlineError, EmptyState, StatCard, SkeletonCard } from '@/components/ui';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Customer = {
  userId: number;
  name: string;
  email: string;
  totalSessions: number;
  lastSessionAt: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CounselorCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [monthSessions, setMonthSessions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [customerResult, dashResult] = await Promise.allSettled([
          getCounselorCustomers(),
          getCounselorDashboard(),
        ]);

        if (customerResult.status === 'fulfilled') {
          const list: Customer[] = customerResult.value.customers ?? [];
          list.sort((a, b) => b.totalSessions - a.totalSessions);
          setCustomers(list);
        } else {
          setError('고객 목록을 불러올 수 없습니다.');
        }

        if (dashResult.status === 'fulfilled') {
          setMonthSessions(dashResult.value.completedSessions ?? 0);
        }
      } catch {
        setError('고객 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle>고객 관리</PageTitle>
        <div className="grid grid-cols-2 gap-6">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>고객 관리</PageTitle>

      {error && <InlineError message={error} />}

      <div className="grid grid-cols-2 gap-6">
        <StatCard dense title="전체 고객" value={customers.length} />
        <StatCard
          dense
          title="완료 상담"
          value={monthSessions !== null ? `${monthSessions}건` : '-'}
        />
      </div>

      <DenseCard>
        <label className="mb-2 block text-sm font-heading font-bold text-[hsl(var(--text-primary))]">
          고객 검색
        </label>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름 또는 이메일"
          className="max-w-[360px] rounded-md border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface-3))] text-[hsl(var(--text-primary))]"
        />
      </DenseCard>

      {customers.length === 0 && !error ? (
        <EmptyState title="고객이 없습니다" desc="아직 상담 이력이 있는 고객이 없습니다." />
      ) : customers.length > 0 ? (
        <DenseCard>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[hsl(var(--surface))]">
              <TableRow className="border-[hsl(var(--gold)/0.15)]">
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">고객명</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">이메일</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))] text-right">상담 횟수</TableHead>
                <TableHead className="font-heading font-bold text-[hsl(var(--gold))]">마지막 상담일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers
                .filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(query.trim().toLowerCase()))
                .map((c) => (
                <TableRow key={c.userId} className="h-10 border-[hsl(var(--gold)/0.1)] odd:bg-[hsl(var(--surface-3))/0.35]">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-[hsl(var(--text-secondary))]">{c.email}</TableCell>
                  <TableCell className="text-right font-bold tabular-nums">{c.totalSessions}회</TableCell>
                  <TableCell className="text-[hsl(var(--text-secondary))] tabular-nums">{formatDate(c.lastSessionAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </DenseCard>
      ) : null}
    </div>
  );
}
