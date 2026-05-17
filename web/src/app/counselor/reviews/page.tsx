'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { DenseCard, PageTitle, InlineError, EmptyState, StatCard, Pagination } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Stars } from '@/components/design/stars';

type Review = {
  id: number;
  reservationId: number;
  userId: number;
  customerName: string;
  rating: number;
  comment: string;
  reply: string | null;
  replyAt: string | null;
  createdAt: string;
};

type ReviewsResponse = {
  reviews: Review[];
  totalPages: number;
  totalElements: number;
};

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function CounselorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Reply state per review
  const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySaving, setReplySaving] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Profile stats
  const [ratingAvg, setRatingAvg] = useState(0);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/v1/counselor/reviews?page=${page - 1}&size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('리뷰를 불러올 수 없습니다.');
      const data: ReviewsResponse = await res.json();
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '리뷰를 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/counselor/me');
      if (res.ok) {
        const data = await res.json();
        setRatingAvg(data.ratingAvg ?? 0);
      }
    } catch {
      // non-critical, ignore
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function handleOpenReply(reviewId: number) {
    setReplyOpenId(reviewId);
    setReplyText('');
    setReplyError('');
  }

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((review) => Math.round(review.rating) === rating).length;
    const ratio = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { rating, count, ratio };
  });

  function handleCancelReply() {
    setReplyOpenId(null);
    setReplyText('');
    setReplyError('');
  }

  async function handleSaveReply(reviewId: number) {
    if (!replyText.trim()) {
      setReplyError('답변 내용을 입력해 주세요.');
      return;
    }

    setReplySaving(true);
    setReplyError('');
    try {
      const res = await apiFetch(`/api/v1/counselor/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '답변 저장에 실패했습니다.');
      }
      const data = await res.json();
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId ? { ...r, reply: data.reply, replyAt: data.replyAt } : r
        )
      );
      setReplyOpenId(null);
      setReplyText('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '답변 저장에 실패했습니다.';
      setReplyError(message);
    } finally {
      setReplySaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle>리뷰 관리</PageTitle>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
          dense
          title="평균 평점"
          value={ratingAvg > 0 ? <Stars value={ratingAvg} size={14} /> : '-'}
        />
        <StatCard dense title="총 리뷰 수" value={`${totalElements}건`} />
      </div>

      <DenseCard>
        <h3 className="mb-3 font-heading text-sm font-bold text-[hsl(var(--text-primary))]">
          별점 분포
        </h3>
        <div className="space-y-2">
          {ratingDistribution.map((item) => (
            <div key={item.rating} className="grid grid-cols-[44px_1fr_44px] items-center gap-3 text-sm">
              <span className="tabular-nums text-[hsl(var(--text-secondary))]">{item.rating}.0</span>
              <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
                <div
                  className="h-full rounded-full bg-[hsl(var(--gold))] motion-reduce:transition-none"
                  style={{ width: `${item.ratio}%` }}
                />
              </div>
              <span className="text-right tabular-nums text-[hsl(var(--text-secondary))]">{item.count}건</span>
            </div>
          ))}
        </div>
      </DenseCard>

      <InlineError message={error} />

      {/* Review list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <DenseCard key={i}>
              <div className="space-y-2">
                <div className="animate-pulse h-4 w-1/3 bg-[hsl(var(--surface))] rounded" />
                <div className="animate-pulse h-3 w-2/3 bg-[hsl(var(--surface))] rounded" />
                <div className="animate-pulse h-3 w-1/2 bg-[hsl(var(--surface))] rounded" />
              </div>
            </DenseCard>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="리뷰가 없습니다"
          desc="아직 등록된 리뷰가 없습니다."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {reviews.map(review => (
            <DenseCard key={review.id}>
              {/* Header: customer + date + rating */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm">
                    {review.customerName}
                  </span>
                  <span className="text-[hsl(var(--text-secondary))] text-xs">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                <Stars value={review.rating} size={14} />
              </div>

              {/* Comment */}
              <p className="text-sm text-[hsl(var(--text-primary))] mb-3 whitespace-pre-wrap">
                {review.comment}
              </p>

              {/* Reply section */}
              {review.reply ? (
                <div className="border-t border-[hsl(var(--gold)/0.15)] pt-3 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-bold text-xs text-[hsl(var(--gold))]">
                      상담사 답변
                    </span>
                    {review.replyAt && (
                      <span className="text-[hsl(var(--text-secondary))] text-xs">
                        {formatDate(review.replyAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[hsl(var(--text-primary))] whitespace-pre-wrap">
                    {review.reply}
                  </p>
                </div>
              ) : replyOpenId === review.id ? (
                <div className="border-t border-[hsl(var(--gold)/0.15)] pt-3 mt-2">
                  <Textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="답변을 입력해 주세요..."
                    rows={3}
                    className="bg-[hsl(var(--surface))] border-[hsl(var(--gold)/0.15)] rounded-xl mb-2 text-[hsl(var(--text-primary))]"
                  />
                  {replyError && (
                    <div className="text-[hsl(var(--dancheong))] text-xs mb-2 font-medium">
                      {replyError}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelReply}
                      disabled={replySaving}
                      className="font-heading font-bold text-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))]"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveReply(review.id)}
                      disabled={replySaving}
                      className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] rounded-full px-6 font-heading font-bold text-sm"
                    >
                      {replySaving ? '저장 중...' : '답변 저장'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-[hsl(var(--gold)/0.15)] pt-3 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenReply(review.id)}
                    className="text-[hsl(var(--gold))] font-heading font-bold text-sm hover:bg-[hsl(var(--gold))]/10"
                  >
                    답변 작성
                  </Button>
                </div>
              )}
            </DenseCard>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
