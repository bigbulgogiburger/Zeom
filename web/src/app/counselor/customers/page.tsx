'use client';

import { useEffect, useState } from 'react';
import { getCounselorCustomers, getCounselorDashboard } from '@/components/api-client';
import { Card, PageTitle, InlineError, EmptyState, StatCard, SkeletonCard } from '@/components/ui';
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
        <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
        <StatCard title="전체 고객" value={customers.length} />
        <StatCard
          title="완료 상담"
          value={monthSessions !== null ? `${monthSessions}건` : '-'}
        />
      </div>

      {customers.length === 0 && !error ? (
        <EmptyState title="고객이 없습니다" desc="아직 상담 이력이 있는 고객이 없습니다." />
      ) : customers.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">고객명</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">이메일</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)] text-right">상담 횟수</TableHead>
                <TableHead className="font-heading font-bold text-[var(--color-accent-primary)]">마지막 상담일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.userId}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-[var(--color-text-muted-card)]">{c.email}</TableCell>
                  <TableCell className="text-right font-bold">{c.totalSessions}회</TableCell>
                  <TableCell className="text-[var(--color-text-muted-card)]">{formatDate(c.lastSessionAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : null}
    </div>
  );
}
