'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { apiFetch } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { StarRating, TagToggle, SuccessState } from '@/components/design';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Reservation = {
  id: number;
  counselorName: string;
  counselorId: number;
  startAt: string;
  endAt: string;
  status: string;
};

const RATING_LABELS: Record<number, string> = {
  1: '아쉬웠어요',
  2: '보통이에요',
  3: '괜찮아요',
  4: '좋았어요',
  5: '완벽했어요',
};

const REVIEW_TAGS = [
  '차분해요',
  '현실적이에요',
  '깊이 있어요',
  '공감 잘해요',
  '명쾌해요',
  '따뜻해요',
] as const;

const MAX_COMMENT = 500;

export default function ReviewPage() {
  return (
    <RequireLogin>
      <ReviewInner />
    </RequireLogin>
  );
}

function ReviewInner() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loadError, setLoadError] = useState('');

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<Set<string>>(new Set());
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/v1/reservations/${sessionId}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          if (!cancelled) setLoadError(json.message || '예약 정보를 불러올 수 없습니다.');
          return;
        }
        const data = await res.json();
        if (!cancelled) setReservation(data);
      } catch {
        if (!cancelled) setLoadError('예약 정보를 불러오는 중 오류가 발생했습니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const counselorName = reservation?.counselorName ?? '';

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSubmit() {
    if (!reservation) return;
    if (rating === 0) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const tagText = tags.size > 0 ? `[${Array.from(tags).join(', ')}] ` : '';
      const fullComment = `${tagText}${comment.trim()}`.trim();
      const res = await apiFetch(`/api/v1/reservations/${reservation.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment: fullComment || ' ',
          isAnonymous: true,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setSubmitError(json.message || '후기 등록에 실패했습니다.');
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('후기 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (submitted) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-[600px] items-center justify-center px-6 py-10">
        <SuccessState
          icon="lotus"
          title="고맙습니다"
          subtitle={`후기가 ${counselorName}님께 전달됩니다.`}
          autoNavigateMs={1600}
          onComplete={() => router.push('/bookings/me')}
        />
      </main>
    );
  }

  // Loading / error skeleton
  if (!reservation) {
    return (
      <main className="mx-auto max-w-[600px] px-6 py-10">
        {loadError ? (
          <div className="glow-card px-6 py-12 text-center">
            <p className="m-0 text-sm text-destructive">{loadError}</p>
          </div>
        ) : (
          <div className="glow-card h-[200px] animate-pulse" aria-hidden="true" />
        )}
      </main>
    );
  }

  const displayRating = hoverRating || rating;
  const ratingHint = displayRating ? RATING_LABELS[displayRating] : '별을 눌러 평가해주세요';

  return (
    <main className="mx-auto max-w-[600px] px-6 py-8 sm:py-10">
      {/* 헤더 */}
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
          상담 완료
        </span>
          <h1 className="mt-4 m-0 font-heading text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
            {counselorName}님과의 상담,
            <br />
            어떠셨나요?
          </h1>
          <p className="mt-3 text-sm text-text-secondary">
            소중한 후기는 다음 분들의 좋은 길잡이가 됩니다.
          </p>
        </header>

        {/* 별점 카드 */}
        <section className="glow-card mb-4 px-6 py-8 text-center">
          <h2 className="mb-5 m-0 font-heading text-base font-bold text-text-primary">
            별점으로 평가해주세요
          </h2>
          <div className="flex justify-center">
            <StarRating
              value={rating}
              hover={hoverRating}
              onChange={setRating}
              onHover={setHoverRating}
              size={40}
            />
          </div>
          <p
            className={cn(
              'mt-4 text-sm font-medium',
              displayRating ? 'text-gold' : 'text-text-muted',
            )}
            aria-live="polite"
          >
            {ratingHint}
          </p>
        </section>

        {/* 태그 카드 */}
        <section className="glow-card mb-4 px-6 py-6">
          <h2 className="mb-4 m-0 font-heading text-base font-bold text-text-primary">
            어떤 점이 좋았나요?
          </h2>
          <TagToggle
            tags={REVIEW_TAGS}
            selected={tags}
            onToggle={toggleTag}
            ariaLabel="후기 태그"
          />
        </section>

        {/* 자세한 후기 카드 */}
        <section className="glow-card mb-6 px-6 py-6">
          <h2 className="mb-3 m-0 font-heading text-base font-bold text-text-primary">
            자세한 후기 (선택)
          </h2>
          <textarea
            rows={5}
            maxLength={MAX_COMMENT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="상담을 받으며 느낀 점을 자유롭게 적어주세요."
            className="w-full resize-y rounded-xl border border-border-subtle bg-surface-2 px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
            <span>익명 처리됩니다</span>
            <span className="tabular text-text-muted">
              {comment.length}/{MAX_COMMENT}
            </span>
          </div>
        </section>

        {submitError && (
          <p className="mb-4 text-center text-sm text-destructive" role="alert">
            {submitError}
          </p>
        )}

        {/* Footer */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/bookings/me')}
            disabled={submitting}
            className="rounded-full"
          >
            나중에 작성
          </Button>
          <Button
            type="button"
            variant="gold-grad"
            size="lg"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="flex-1 rounded-full"
          >
            {submitting ? '등록 중...' : '후기 등록'}
          </Button>
        </div>
    </main>
  );
}
