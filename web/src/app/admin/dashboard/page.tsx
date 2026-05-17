'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  getActiveSessions,
  getSessionStats,
  forceEndSession,
  getAdminSettlements,
} from '@/components/api-client';
import {
  Card,
  PageTitle,
  StatCard,
  InlineError,
  InlineSuccess,
  EmptyState,
  StatusBadge,
  ActionButton,
  SkeletonCard,
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
import { Badge } from '@/components/ui/badge';
import { PieChartCard } from '@/components/charts/admin-charts';

type ActiveSession = {
  sessionId: number;
  counselorName: string;
  customerName: string;
  startedAt: string;
  durationMinutes: number;
  status: string;
};

type SessionStats = {
  activeSessions: number;
  waitingCounselors: number;
  todayCompleted: number;
  todayRevenue: number;
};

type SettlementSummary = {
  pending: number;
  confirmed: number;
  paid: number;
  totalAmount: number;
};

const AUTO_REFRESH_MS = 30_000;

function formatElapsed(startedAt: string): string {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}분 ${String(secs).padStart(2, '0')}초`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [settlementSummary, setSettlementSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [forceEndTarget, setForceEndTarget] = useState<ActiveSession | null>(null);
  const [forceEnding, setForceEnding] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [statsResult, sessionsResult, settlementsResult] = await Promise.allSettled([
        getSessionStats(),
        getActiveSessions(),
        getAdminSettlements(),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }

      if (sessionsResult.status === 'fulfilled') {
        const list: ActiveSession[] = Array.isArray(sessionsResult.value)
          ? sessionsResult.value
          : sessionsResult.value.content || [];
        list.sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
        setSessions(list);
      }

      if (settlementsResult.status === 'fulfilled') {
        const settlements = Array.isArray(settlementsResult.value)
          ? settlementsResult.value
          : settlementsResult.value.content || [];
        const summary: SettlementSummary = {
          pending: 0,
          confirmed: 0,
          paid: 0,
          totalAmount: 0,
        };
        for (const s of settlements) {
          if (s.status === 'PENDING') summary.pending++;
          else if (s.status === 'CONFIRMED') summary.confirmed++;
          else if (s.status === 'PAID') summary.paid++;
          summary.totalAmount += s.counselorAmount || s.amount || 0;
        }
        setSettlementSummary(summary);
      }

      setLastRefresh(new Date().toLocaleTimeString('ko-KR'));
      setError('');
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, AUTO_REFRESH_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [loadData]);

  const settlementDistribution = useMemo(() => {
    if (!settlementSummary) return [];
    return [
      { name: '대기', value: settlementSummary.pending },
      { name: '확정', value: settlementSummary.confirmed },
      { name: '지급 완료', value: settlementSummary.paid },
    ].filter((s) => s.value > 0);
  }, [settlementSummary]);

  async function handleForceEnd() {
    if (!forceEndTarget) return;
    setForceEnding(true);
    setSuccess('');
    setError('');
    try {
      await forceEndSession(forceEndTarget.sessionId);
      setSuccess(`세션 #${forceEndTarget.sessionId} (${forceEndTarget.customerName}) 강제 종료 완료`);
      setForceEndTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || '강제 종료에 실패했습니다.');
    } finally {
      setForceEnding(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle>운영 대시보드</PageTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
        <SkeletonCard lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageTitle>운영 대시보드</PageTitle>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[hsl(var(--text-secondary))] text-xs tabular-nums">
              마지막 갱신 {lastRefresh}
            </span>
          )}
          <Badge
            variant="outline"
            className="rounded-full border-[hsl(var(--success))]/40 text-[hsl(var(--success))] px-2 py-0.5 text-[11px]"
          >
            30초 자동 갱신
          </Badge>
          <ActionButton onClick={loadData}>새로고침</ActionButton>
        </div>
      </div>

      <InlineError message={error} />
      <InlineSuccess message={success} />

      {/* KPI 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="활성 세션"
          value={<span className="tabular-nums">{stats?.activeSessions ?? sessions.length}</span>}
          hint="현재 진행 중"
        />
        <StatCard
          title="대기 상담사"
          value={<span className="tabular-nums">{stats?.waitingCounselors ?? '-'}</span>}
          hint="호출 대기"
        />
        <StatCard
          title="오늘 완료"
          value={<span className="tabular-nums">{`${stats?.todayCompleted ?? 0}건`}</span>}
          hint="금일 완료된 상담"
        />
        <StatCard
          title="오늘 매출"
          value={
            <span className="tabular-nums">
              {stats?.todayRevenue != null ? formatCurrency(stats.todayRevenue) : '-'}
            </span>
          }
          hint="금일 결제 금액"
        />
      </div>

      {/* 활성 세션 테이블 */}
      <div>
        <h3 className="font-heading font-bold text-[hsl(var(--text-primary))] mb-3 text-base">
          활성 세션 <span className="tabular-nums text-[hsl(var(--text-secondary))] text-sm">({sessions.length}건)</span>
        </h3>
        {sessions.length === 0 ? (
          <EmptyState title="활성 세션 없음" desc="현재 진행 중인 상담이 없습니다." />
        ) : (
          <Card>
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[hsl(var(--card))]">
                <TableRow>
                  <TableHead className="font-semibold text-[hsl(var(--gold))]">ID</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))]">상담사</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))]">고객</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))] tabular-nums">시작 시간</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))] tabular-nums">경과</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))]">상태</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--gold))] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.sessionId} className="even:bg-[hsl(var(--surface-2)/0.4)]">
                    <TableCell className="font-mono text-sm tabular-nums">#{s.sessionId}</TableCell>
                    <TableCell className="font-medium">{s.counselorName}</TableCell>
                    <TableCell>{s.customerName}</TableCell>
                    <TableCell className="text-[hsl(var(--text-secondary))] tabular-nums">{formatTime(s.startedAt)}</TableCell>
                    <TableCell className="font-mono text-sm tabular-nums">{formatElapsed(s.startedAt)}</TableCell>
                    <TableCell><StatusBadge value={s.status} /></TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setForceEndTarget(s)}
                        className="rounded-md bg-[hsl(var(--dancheong))] text-[hsl(var(--card))] text-xs font-bold px-3 py-1 hover:bg-[hsl(var(--dancheong))]/85 transition-colors"
                      >
                        강제 종료
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* 정산 요약 + 차트 */}
      {settlementSummary && (
        <div>
          <h3 className="font-heading font-bold text-[hsl(var(--text-primary))] mb-3 text-base">
            정산 요약
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="대기"
                value={<span className="tabular-nums">{`${settlementSummary.pending}건`}</span>}
                hint="확정 대기"
              />
              <StatCard
                title="확정"
                value={<span className="tabular-nums">{`${settlementSummary.confirmed}건`}</span>}
                hint="지급 대기"
              />
              <StatCard
                title="지급 완료"
                value={<span className="tabular-nums">{`${settlementSummary.paid}건`}</span>}
              />
              <StatCard
                title="총 정산액"
                value={<span className="tabular-nums">{formatCurrency(settlementSummary.totalAmount)}</span>}
              />
            </div>
            {settlementDistribution.length > 0 && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-2">
                  정산 상태 분포
                </h4>
                <PieChartCard data={settlementDistribution} height={200} />
              </Card>
            )}
          </div>
          <div className="mt-4">
            <ActionButton onClick={() => (window.location.href = '/admin/settlements')}>
              정산 관리 바로가기
            </ActionButton>
          </div>
        </div>
      )}

      {/* 강제 종료 다이얼로그 */}
      <ConfirmDialog
        open={!!forceEndTarget}
        title="세션 강제 종료"
        message={
          forceEndTarget
            ? `세션 #${forceEndTarget.sessionId}을 강제 종료하시겠습니까?\n상담사: ${forceEndTarget.counselorName}\n고객: ${forceEndTarget.customerName}`
            : ''
        }
        confirmLabel={forceEnding ? '처리 중...' : '강제 종료'}
        onConfirm={handleForceEnd}
        onCancel={() => setForceEndTarget(null)}
      />
    </div>
  );
}
