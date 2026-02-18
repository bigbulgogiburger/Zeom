'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { RequireAdmin } from '@/components/route-guard';
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
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>운영 대시보드</PageTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PageTitle>운영 대시보드</PageTitle>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-[#a49484] text-sm">
                마지막 갱신: {lastRefresh}
              </span>
            )}
            <Badge className="bg-green-600 text-white rounded-full px-3 py-1 text-xs font-bold">
              30초 자동 갱신
            </Badge>
            <ActionButton onClick={loadData}>새로고침</ActionButton>
          </div>
        </div>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            title="활성 세션"
            value={stats?.activeSessions ?? sessions.length}
            hint="현재 진행 중인 상담"
          />
          <StatCard
            title="대기 상담사"
            value={stats?.waitingCounselors ?? '-'}
            hint="호출 대기 중"
          />
          <StatCard
            title="오늘 완료"
            value={`${stats?.todayCompleted ?? 0}건`}
            hint="금일 완료된 상담"
          />
          <StatCard
            title="오늘 매출"
            value={stats?.todayRevenue != null ? formatCurrency(stats.todayRevenue) : '-'}
            hint="금일 결제 금액"
          />
        </div>

        {/* Active sessions table */}
        <div>
          <h3 className="font-heading font-bold text-[#f9f5ed] mb-5 text-lg">
            활성 세션 ({sessions.length}건)
          </h3>
          {sessions.length === 0 ? (
            <EmptyState title="활성 세션 없음" desc="현재 진행 중인 상담이 없습니다." />
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-heading font-bold text-[#C9A227]">ID</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">상담사</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">고객</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">시작 시간</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">경과</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227]">상태</TableHead>
                    <TableHead className="font-heading font-bold text-[#C9A227] text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.sessionId} className="hover:bg-[rgba(201,162,39,0.03)] transition-colors">
                      <TableCell className="font-mono text-sm">#{s.sessionId}</TableCell>
                      <TableCell className="font-medium">{s.counselorName}</TableCell>
                      <TableCell>{s.customerName}</TableCell>
                      <TableCell className="text-[#a49484]">{formatTime(s.startedAt)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatElapsed(s.startedAt)}</TableCell>
                      <TableCell><StatusBadge value={s.status} /></TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => setForceEndTarget(s)}
                          className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-4 py-1.5 min-h-[28px] hover:bg-[#6d0000] transition-colors"
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

        {/* Settlement summary */}
        {settlementSummary && (
          <div>
            <h3 className="font-heading font-bold text-[#f9f5ed] mb-5 text-lg">
              정산 요약
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="대기" value={`${settlementSummary.pending}건`} hint="확정 대기" />
              <StatCard title="확정" value={`${settlementSummary.confirmed}건`} hint="지급 대기" />
              <StatCard title="지급 완료" value={`${settlementSummary.paid}건`} />
              <StatCard title="총 정산액" value={formatCurrency(settlementSummary.totalAmount)} />
            </div>
            <div className="mt-5">
              <ActionButton onClick={() => window.location.href = '/admin/settlements'}>
                정산 관리 바로가기
              </ActionButton>
            </div>
          </div>
        )}

        {/* Force end confirmation dialog */}
        <ConfirmDialog
          open={!!forceEndTarget}
          title="세션 강제 종료"
          message={forceEndTarget
            ? `세션 #${forceEndTarget.sessionId}을 강제 종료하시겠습니까?\n상담사: ${forceEndTarget.counselorName}\n고객: ${forceEndTarget.customerName}`
            : ''
          }
          confirmLabel={forceEnding ? '처리 중...' : '강제 종료'}
          onConfirm={handleForceEnd}
          onCancel={() => setForceEndTarget(null)}
        />
      </main>
    </RequireAdmin>
  );
}
