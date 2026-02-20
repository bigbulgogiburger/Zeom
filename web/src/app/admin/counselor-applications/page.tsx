'use client';

import { useCallback, useEffect, useState } from 'react';
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
} from '@/components/ui';

type ApplicationItem = {
  id: number;
  userId: number;
  specialty: string;
  experience: string;
  intro: string;
  status: string;
  createdAt: string;
};

const PAGE_SIZE = 20;

export default function AdminCounselorApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [processing, setProcessing] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<ApplicationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadApplications = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(p - 1));
      params.set('size', String(PAGE_SIZE));
      const query = params.toString();

      const res = await apiFetch(`/api/v1/admin/counselor-applications?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '신청 목록을 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setApplications(json.content || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      setError('신청 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadApplications(page);
  }, [page, loadApplications]);

  async function handleApprove(app: ApplicationItem) {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/counselor-applications/${app.id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '승인에 실패했습니다.');
      } else {
        setSuccess(`신청 #${app.id}을 승인했습니다.`);
        loadApplications(page);
      }
    } catch {
      setError('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget || !rejectReason.trim()) return;
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/counselor-applications/${rejectTarget.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '거절에 실패했습니다.');
      } else {
        setSuccess(`신청 #${rejectTarget.id}을 거절했습니다.`);
        setRejectTarget(null);
        setRejectReason('');
        loadApplications(page);
      }
    } catch {
      setError('거절 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading && applications.length === 0) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>상담사 신청 관리</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>상담사 신청 관리</PageTitle>

        <InlineError message={error} />
        <InlineSuccess message={success} />

        {/* Filters */}
        <Card>
          <div className="flex gap-3 items-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[44px] focus:border-[rgba(201,162,39,0.4)] focus:outline-none"
            >
              <option value="">상태: 전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
            </select>
            <ActionButton onClick={() => loadApplications(page)} loading={loading}>
              새로고침
            </ActionButton>
          </div>
        </Card>

        {applications.length === 0 ? (
          <EmptyState title="신청이 없습니다" desc="대기 중인 상담사 신청이 없습니다." />
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => (
              <Card key={app.id}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-[#C9A227]">#{app.id}</span>
                      <StatusBadge value={app.status} />
                      <span className="text-[#a49484] text-sm">
                        {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="text-[#a49484]">분야:</span>{' '}
                        <span className="font-medium">{app.specialty}</span>
                      </p>
                      {app.experience && (
                        <p className="text-sm">
                          <span className="text-[#a49484]">경력:</span>{' '}
                          <span>{app.experience}</span>
                        </p>
                      )}
                      {app.intro && (
                        <p className="text-sm text-[#a49484] mt-2 leading-relaxed">
                          {app.intro}
                        </p>
                      )}
                    </div>
                  </div>

                  {app.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(app)}
                        disabled={processing}
                        className="rounded-full bg-[#C9A227] text-[#0f0d0a] text-sm font-bold font-heading px-4 py-2 hover:bg-[#b08d1f] transition-colors disabled:opacity-50"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => { setRejectTarget(app); setRejectReason(''); }}
                        disabled={processing}
                        className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-4 py-2 hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

        {/* Reject dialog */}
        {rejectTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="bg-[var(--color-bg-card)] border border-[rgba(201,162,39,0.15)] rounded-2xl p-6 max-w-[420px] w-full mx-4 space-y-4">
              <h3 className="font-heading font-bold text-lg">신청 거절</h3>
              <p className="text-[#a49484] text-sm">
                신청 #{rejectTarget.id} ({rejectTarget.specialty})을 거절합니다.
              </p>
              <textarea
                placeholder="거절 사유를 입력하세요 (필수)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl text-[#f9f5ed] px-3 py-2 text-sm min-h-[80px] placeholder:text-[#a49484] focus:border-[rgba(201,162,39,0.4)] focus:ring-2 focus:ring-[rgba(201,162,39,0.3)] focus:outline-none resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                  className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-5 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                  className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-5 py-2 hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                >
                  {processing ? '처리 중...' : '거절'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </RequireAdmin>
  );
}
