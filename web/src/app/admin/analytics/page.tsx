'use client';

import { useEffect, useState, useCallback } from 'react';
import { RequireAdmin } from '@/components/route-guard';
import { apiFetch } from '@/components/api-client';
import {
  Card,
  PageTitle,
  StatCard,
  InlineError,
  EmptyState,
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

type KpiSummary = {
  totalRevenue: number;
  newSignups: number;
  bookingTotal: number;
  bookingCompleted: number;
  bookingCancelled: number;
  consultationCount: number;
  avgDurationSec: number;
  refundCount: number;
  refundRate: number;
};

type RevenueDataPoint = {
  date: string;
  revenue: number;
  bookingCount: number;
};

type CounselorRanking = {
  counselorId: number;
  name: string;
  revenue: number;
  sessionCount: number;
  avgRating: number;
};

type Period = '7d' | '30d' | '90d';

const PERIOD_LABELS: Record<Period, string> = {
  '7d': '7일',
  '30d': '30일',
  '90d': '90일',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}분 ${s}초`;
}

function periodToDates(period: Period): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (data.length === 0) {
    return <EmptyState title="데이터 없음" desc="해당 기간에 매출 데이터가 없습니다." />;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const chartHeight = 200;
  const barWidth = Math.max(12, Math.min(40, Math.floor(600 / data.length) - 4));

  return (
    <div className="overflow-x-auto">
      <svg
        width={Math.max(600, data.length * (barWidth + 4) + 60)}
        height={chartHeight + 60}
        className="block"
      >
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = chartHeight - chartHeight * ratio + 20;
          return (
            <g key={ratio}>
              <line x1="50" y1={y} x2="100%" y2={y} stroke="#3d3529" strokeDasharray="4" />
              <text x="46" y={y + 4} textAnchor="end" fill="#a49484" fontSize="10">
                {formatCurrency(Math.round(maxRevenue * ratio))}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = (d.revenue / maxRevenue) * chartHeight;
          const x = 56 + i * (barWidth + 4);
          const y = chartHeight - barHeight + 20;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#C9A227"
                rx="2"
                opacity="0.85"
              >
                <title>{`${d.date}\n매출: ${formatCurrency(d.revenue)}\n예약: ${d.bookingCount}건`}</title>
              </rect>
              {data.length <= 31 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 36}
                  textAnchor="middle"
                  fill="#a49484"
                  fontSize="9"
                  transform={`rotate(-45, ${x + barWidth / 2}, ${chartHeight + 36})`}
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueDataPoint[]>([]);
  const [ranking, setRanking] = useState<CounselorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async (p: Period) => {
    setLoading(true);
    setError('');
    try {
      const { startDate, endDate } = periodToDates(p);
      const [kpiRes, revenueRes, rankingRes] = await Promise.all([
        apiFetch(`/api/v1/admin/analytics/kpi?period=${p}`),
        apiFetch(`/api/v1/admin/analytics/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=daily`),
        apiFetch(`/api/v1/admin/analytics/counselor-ranking?period=${p}&limit=10`),
      ]);

      if (kpiRes.ok) setKpi(await kpiRes.json());
      if (revenueRes.ok) setRevenue(await revenueRes.json());
      if (rankingRes.ok) setRanking(await rankingRes.json());
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  function handlePeriodChange(p: Period) {
    setPeriod(p);
  }

  async function downloadKpiCsv() {
    try {
      const res = await apiFetch(`/api/v1/admin/analytics/kpi/csv?period=${period}`);
      if (!res.ok) throw new Error('CSV 다운로드 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kpi_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('CSV 다운로드에 실패했습니다.');
    }
  }

  async function downloadRevenueCsv() {
    try {
      const { startDate, endDate } = periodToDates(period);
      const res = await apiFetch(
        `/api/v1/admin/analytics/revenue/csv?startDate=${startDate}&endDate=${endDate}&groupBy=daily`
      );
      if (!res.ok) throw new Error('CSV 다운로드 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue_${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('CSV 다운로드에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>비즈니스 분석</PageTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
          <SkeletonCard lines={8} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageTitle>비즈니스 분석</PageTitle>
          <div className="flex items-center gap-2">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold font-heading transition-colors ${
                  period === p
                    ? 'bg-[#C9A227] text-[#2b2219]'
                    : 'bg-[#3d3529] text-[#a49484] hover:bg-[#4a4235]'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <InlineError message={error} />

        {/* KPI Cards */}
        {kpi && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard title="총 매출" value={formatCurrency(kpi.totalRevenue)} hint={`최근 ${PERIOD_LABELS[period]}`} />
            <StatCard title="신규 가입" value={`${kpi.newSignups}명`} hint={`최근 ${PERIOD_LABELS[period]}`} />
            <StatCard title="예약 건수" value={`${kpi.bookingTotal}건`} hint={`완료 ${kpi.bookingCompleted} / 취소 ${kpi.bookingCancelled}`} />
            <StatCard title="상담 완료" value={`${kpi.consultationCount}건`} hint={`평균 ${formatDuration(kpi.avgDurationSec)}`} />
            <StatCard title="환불률" value={`${kpi.refundRate}%`} hint={`${kpi.refundCount}건`} />
          </div>
        )}

        {/* Revenue Chart */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-[#f9f5ed] text-lg">매출 추이</h3>
            <ActionButton onClick={downloadRevenueCsv}>매출 CSV</ActionButton>
          </div>
          <Card>
            <div className="p-4">
              <RevenueChart data={revenue} />
            </div>
          </Card>
        </div>

        {/* Counselor Ranking */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-bold text-[#f9f5ed] text-lg">
              상담사 매출 순위 (Top 10)
            </h3>
            <ActionButton onClick={downloadKpiCsv}>KPI CSV</ActionButton>
          </div>
          {ranking.length === 0 ? (
            <EmptyState title="데이터 없음" desc="해당 기간에 상담사 매출 데이터가 없습니다." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-heading font-bold text-[#C9A227]">순위</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">상담사</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">매출</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">상담 건수</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">평균 평점</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((c, i) => (
                    <TableRow key={c.counselorId} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                      <TableCell className="font-mono text-sm font-bold">{i + 1}</TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{formatCurrency(c.revenue)}</TableCell>
                      <TableCell>{c.sessionCount}건</TableCell>
                      <TableCell>
                        <span className="text-[#C9A227] font-bold">
                          {c.avgRating > 0 ? c.avgRating.toFixed(1) : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </main>
    </RequireAdmin>
  );
}
