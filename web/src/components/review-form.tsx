'use client';

import { useState } from 'react';
import { ActionButton, InlineError, InlineSuccess } from './ui';

type ReviewFormProps = {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  counselorName?: string;
};

export default function ReviewForm({ onSubmit, counselorName }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (rating === 0) {
      setError('별점을 선택해주세요.');
      return;
    }

    if (!comment.trim()) {
      setError('리뷰 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(rating, comment.trim());
      setSuccess('리뷰가 등록되었습니다.');
    } catch (err: any) {
      setError(err.message || '리뷰 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
      {counselorName && (
        <div style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-bold)',
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-text-on-dark)',
        }}>
          {counselorName} 상담사님과의 상담은 어떠셨나요?
        </div>
      )}

      {/* Star Rating */}
      <div>
        <label style={{
          display: 'block',
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-on-dark)',
        }}>
          별점 평가
        </label>
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            fontSize: '2.5rem',
            cursor: 'pointer',
            justifyContent: 'center',
            padding: 'var(--spacing-lg) 0',
          }}
          onMouseLeave={() => setHoverRating(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                minHeight: 'auto',
                transition: 'transform var(--transition-fast)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              aria-label={`${star}점`}
            >
              <span style={{
                color: star <= displayRating ? 'var(--color-gold)' : 'var(--color-text-muted-dark)',
                transition: 'color var(--transition-fast)',
              }}>
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div style={{
            textAlign: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gold)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-heading)',
          }}>
            {rating}점 선택됨
          </div>
        )}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" style={{
          display: 'block',
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
          color: 'var(--color-text-on-dark)',
        }}>
          리뷰 내용
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="상담 후기를 남겨주세요. (최소 10자 이상)"
          rows={6}
          disabled={loading}
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            border: `2px solid var(--color-border-dark)`,
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-on-dark)',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'inherit',
            lineHeight: 'var(--line-height-normal)',
            resize: 'vertical',
          }}
        />
        <div style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-muted-dark)',
          marginTop: 'var(--spacing-xs)',
        }}>
          {comment.length} / 500자
        </div>
      </div>

      <InlineError message={error} />
      <InlineSuccess message={success} />

      <ActionButton loading={loading} type="submit" disabled={loading || rating === 0}>
        리뷰 제출
      </ActionButton>
    </form>
  );
}
