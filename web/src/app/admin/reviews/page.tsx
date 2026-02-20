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
import { Badge } from '@/components/ui/badge';

type ReviewItem = {
  id: number;
  userId: number;
  authorName: string;
  counselorId: number;
  rating: number;
  comment: string;
  reportedCount: number;
  moderationStatus: string;
  createdAt: string;
};

const PAGE_SIZE = 20;

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < rating ? 'text-[#C9A227]' : 'text-[#3a3530]'}>
      &#9733;
    </span>
  ));
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('REPORTED');
  const [processing, setProcessing] = useState(false);

  const loadReviews = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('status', statusFilter);
      params.set('page', String(p - 1));
      params.set('size', String(PAGE_SIZE));
      const query = params.toString();

      const res = await apiFetch(`/api/v1/admin/reviews?${query}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? '리뷰 목록을 불러올 수 없습니다.');
        setLoading(false);
        return;
      }
      setReviews(json.content || []);
      setTotalPages(json.totalPages || 1);
    } catch {
      setError('리뷰 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadReviews(page);
  }, [page, loadReviews]);

  async function handleModerate(reviewId: number, action: string) {
    setProcessing(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/api/v1/admin/reviews/${reviewId}/moderate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.message ?? '모더레이션에 실패했습니다.');
      } else {
        const actionLabels: Record<string, string> = { KEEP: '유지', HIDE: '숨김', DELETE: '삭제' };
        setSuccess(`리뷰 #${reviewId}를 ${actionLabels[action] || action} 처리했습니다.`);
        loadReviews(page);
      }
    } catch {
      setError('모더레이션 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  }

  function handleFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  if (loading && reviews.length === 0) {
    return (
      <RequireAdmin>
        <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
          <PageTitle>리뷰 모더레이션</PageTitle>
          <SkeletonCard lines={6} />
        </main>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <PageTitle>리뷰 모더레이션</PageTitle>

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
              <option value="REPORTED">신고된 리뷰</option>
              <option value="ACTIVE">활성</option>
              <option value="HIDDEN">숨김</option>
              <option value="DELETED">삭제됨</option>
            </select>
            <ActionButton onClick={() => loadReviews(page)} loading={loading}>
              새로고침
            </ActionButton>
          </div>
        </Card>

        {reviews.length === 0 ? (
          <EmptyState title="리뷰가 없습니다" desc="해당하는 리뷰가 없습니다." />
        ) : (
          <div className="grid gap-6">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-[#C9A227]">#{r.id}</span>
                      <StatusBadge value={r.moderationStatus} />
                      <Badge className="bg-[#8B0000] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        신고 {r.reportedCount}건
                      </Badge>
                    </div>
                    <span className="text-[#a49484] text-sm">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-lg">{renderStars(r.rating)}</div>
                    <span className="text-sm text-[#a49484]">작성자: {r.authorName}</span>
                    <span className="text-sm text-[#a49484]">상담사 #{r.counselorId}</span>
                  </div>

                  <div className="bg-[#1a1612] p-4 rounded-xl border border-[rgba(201,162,39,0.1)]">
                    <p className="text-sm leading-relaxed">{r.comment || '(내용 없음)'}</p>
                  </div>

                  {r.moderationStatus === 'ACTIVE' && r.reportedCount > 0 && (
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => handleModerate(r.id, 'KEEP')}
                        disabled={processing}
                        className="rounded-full bg-[#C9A227] text-[#0f0d0a] text-sm font-bold font-heading px-4 py-2 hover:bg-[#b08d1f] transition-colors disabled:opacity-50"
                      >
                        유지
                      </button>
                      <button
                        onClick={() => handleModerate(r.id, 'HIDE')}
                        disabled={processing}
                        className="rounded-full border-2 border-[rgba(201,162,39,0.3)] text-[#f9f5ed] text-sm font-bold font-heading px-4 py-2 hover:bg-[rgba(201,162,39,0.1)] transition-colors disabled:opacity-50"
                      >
                        숨김
                      </button>
                      <button
                        onClick={() => handleModerate(r.id, 'DELETE')}
                        disabled={processing}
                        className="rounded-full bg-[#8B0000] text-white text-sm font-bold font-heading px-4 py-2 hover:bg-[#6d0000] transition-colors disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </main>
    </RequireAdmin>
  );
}
