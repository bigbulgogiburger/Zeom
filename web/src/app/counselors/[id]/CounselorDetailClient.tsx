'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Video, MessageSquare } from 'lucide-react';
import { API_BASE } from '../../../components/api';
import { apiFetch } from '../../../components/api-client';
import { useAuth } from '../../../components/auth-context';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Portrait, Stars, GlowCard, RadioCard, EmptyState } from '@/components/design';
import { cn } from '@/lib/utils';
import { trackEvent } from '../../../components/analytics';

type Slot = { id: number; startAt: string; endAt: string };
type CounselorDetail = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
  slots: Slot[];
  supportedConsultationTypes?: string;
  profileImageUrl?: string | null;
  careerYears?: number;
  certifications?: string | null;
  averageRating?: number;
  totalReviews?: number;
  totalConsultations?: number;
  responseRate?: number;
  pricePerMinute?: number;
  pricePerSession?: number;
  sessionMinutes?: number;
  isOnline?: boolean;
  tags?: string | null;
};

type Review = {
  id: number;
  userId: number;
  userName?: string;
  rating: number;
  content: string;
  comment?: string;
  createdAt: string;
  reply?: string | null;
  consultationType?: string | null;
  isAnonymous?: boolean;
};

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ratingDistribution(reviews: Review[]): { star: number; count: number; pct: number }[] {
  const total = reviews.length;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = total > 0 ? (count / total) * 100 : 0;
    return { star, count, pct };
  });
}

export default function CounselorDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { me } = useAuth();
  const [counselor, setCounselor] = useState<CounselorDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [channel, setChannel] = useState<'VIDEO' | 'CHAT'>('VIDEO');

  // Fetch counselor
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/counselors/${id}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data: CounselorDetail) => {
        setCounselor(data);
        trackEvent('view_counselor', {
          counselor_id: id,
          counselor_name: data.name,
          specialty: data.specialty,
        });
      })
      .catch(() => setLoadError('상담사 정보를 불러오지 못했습니다.'));
  }, [id]);

  // Fetch reviews
  const loadReviews = useCallback(() => {
    const params = new URLSearchParams();
    params.set('sort', 'latest');
    params.set('page', '0');
    params.set('size', '10');
    fetch(`${API_BASE}/api/v1/counselors/${id}/reviews?${params}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) return { reviews: [], totalElements: 0 };
        return r.json();
      })
      .then((data) => {
        setReviews(data.reviews ?? (Array.isArray(data) ? data : data.content ?? []));
        setReviewTotal(data.totalElements ?? 0);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Reservation CTA — preserve unauthenticated → /login?redirect=...
  const goReserve = useCallback(async () => {
    if (!me) {
      router.push(`/login?redirect=${encodeURIComponent(`/counselors/${id}`)}`);
      return;
    }
    // Verify session via apiFetch silently — apiFetch handles auto-refresh.
    try {
      await apiFetch('/api/v1/auth/me', { cache: 'no-store', silent: true });
    } catch {
      router.push(`/login?redirect=${encodeURIComponent(`/counselors/${id}`)}`);
      return;
    }
    const qs = new URLSearchParams({
      counselorId: id,
      counselorName: counselor?.name ?? '',
      speciality: counselor?.specialty ?? '',
      channel: channel === 'CHAT' ? 'voice' : 'video',
    });
    router.push(`/booking/confirm?${qs.toString()}`);
  }, [me, router, id, counselor, channel]);

  if (loadError) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  if (!counselor) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="glow-card animate-pulse motion-reduce:animate-none p-8 h-[420px]" />
          <div className="glow-card animate-pulse motion-reduce:animate-none p-8 h-[280px]" />
        </div>
      </main>
    );
  }

  const tags = parseTags(counselor.tags);
  const rating = counselor.averageRating ?? 0;
  const reviewCount = counselor.totalReviews ?? 0;
  const career = counselor.careerYears ?? 0;
  const consultations = counselor.totalConsultations ?? 0;
  const pricePerSession = counselor.pricePerSession;
  const sessionMinutes = counselor.sessionMinutes ?? 30;
  const pricePerMinute = counselor.pricePerMinute ?? 3000;
  const supportsChat = counselor.supportedConsultationTypes?.includes('CHAT') ?? false;
  const supportsVideo = counselor.supportedConsultationTypes?.includes('VIDEO') ?? true;

  const dist = ratingDistribution(reviews);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: counselor.name,
    description: counselor.intro,
    aggregateRating:
      reviewCount > 0
        ? { '@type': 'AggregateRating', ratingValue: rating, reviewCount }
        : undefined,
    provider: { '@type': 'Organization', name: '천지연꽃신당' },
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <button
        onClick={() => router.back()}
        className={cn(
          'mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary',
          'hover:text-gold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded',
        )}
        aria-label="뒤로가기"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        뒤로
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* LEFT */}
        <div className="space-y-8">
          {/* Hero */}
          <GlowCard padding="lg">
            <div className="flex flex-col items-center gap-5 text-center">
              <Portrait
                counselor={{ name: counselor.name, imageUrl: counselor.profileImageUrl }}
                size="xl"
              />
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <h1
                    className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-text-primary"
                    style={{ wordBreak: 'keep-all', textWrap: 'balance' }}
                  >
                    {counselor.name}
                  </h1>
                  {career > 0 && (
                    <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold">
                      경력 {career}년
                    </span>
                  )}
                </div>
                <p
                  className="text-sm text-text-secondary"
                  style={{ wordBreak: 'keep-all' }}
                >
                  {counselor.specialty}
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Stars value={rating} size={16} showValue={false} />
                  <span className="tabular-nums font-bold text-text-primary">
                    {rating.toFixed(1)}
                  </span>
                  <span className="tabular-nums text-xs text-text-secondary">
                    ({reviewCount.toLocaleString()}건의 리뷰)
                  </span>
                </div>
                {(consultations > 0 || tags.length > 0) && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    {consultations > 0 && (
                      <span className="tabular-nums text-xs text-text-muted">
                        총 상담 {consultations.toLocaleString()}건
                      </span>
                    )}
                    {tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-text-secondary"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {counselor.intro && (
                <p
                  className="max-w-prose text-sm leading-relaxed text-text-secondary"
                  style={{ wordBreak: 'keep-all' }}
                >
                  {counselor.intro}
                </p>
              )}
            </div>
          </GlowCard>

          {/* Reviews */}
          <section aria-labelledby="reviews-heading" className="space-y-5">
            <h2
              id="reviews-heading"
              className="font-heading text-xl font-bold text-text-primary"
              style={{ wordBreak: 'keep-all' }}
            >
              리뷰 ({reviewTotal.toLocaleString()}건)
            </h2>

            {reviewTotal > 0 && (
              <GlowCard padding="md" className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-3xl font-black text-text-primary tabular-nums">
                    {rating.toFixed(1)}
                  </span>
                  <Stars value={rating} size={18} showValue={false} />
                </div>
                <div className="space-y-1.5">
                  {dist.map((d) => (
                    <div key={d.star} className="flex items-center gap-3">
                      <span className="tabular-nums w-7 text-right text-xs font-bold text-text-secondary">
                        {d.star}점
                      </span>
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
                        role="presentation"
                      >
                        <div
                          className="h-full rounded-full bg-gold transition-all duration-500 motion-reduce:transition-none"
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <span className="tabular-nums w-8 text-xs text-text-muted">
                        {d.count}
                      </span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            )}

            {reviews.length === 0 ? (
              <EmptyState title="아직 리뷰가 없습니다" body="첫 리뷰의 주인공이 되어보세요." />
            ) : (
              <ul className="space-y-3">
                {reviews.map((r) => {
                  const text = r.content || r.comment || '';
                  return (
                    <li key={r.id}>
                      <GlowCard padding="md" className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Stars value={r.rating} size={12} showValue={false} />
                          <span className="tabular-nums text-sm font-bold text-text-primary">
                            {r.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {r.isAnonymous ? '익명' : r.userName ?? '익명'}
                          </span>
                          {r.consultationType && (
                            <span className="rounded-full border border-gold/30 px-2 py-0.5 text-[10px] text-gold">
                              {r.consultationType}
                            </span>
                          )}
                          <span className="ml-auto tabular-nums text-xs text-text-muted">
                            {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <p
                          className="text-sm leading-relaxed text-text-primary"
                          style={{ wordBreak: 'keep-all' }}
                        >
                          {text}
                        </p>
                        {r.reply && (
                          <div className="mt-2 border-l-2 border-gold/30 pl-3">
                            <p className="text-xs font-bold text-text-secondary mb-1">
                              상담사 답변
                            </p>
                            <p
                              className="text-sm leading-relaxed text-text-secondary"
                              style={{ wordBreak: 'keep-all' }}
                            >
                              {r.reply}
                            </p>
                          </div>
                        )}
                      </GlowCard>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT — sticky reservation card (desktop) */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-[88px]">
            <GlowCard padding="lg" className="space-y-5">
              <div>
                <span className="text-xs text-text-secondary">상담료</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="tabular-nums font-heading text-2xl font-black text-text-primary">
                    {(pricePerSession ?? pricePerMinute * sessionMinutes).toLocaleString()}
                  </span>
                  <span className="text-sm text-text-secondary">
                    원 / {sessionMinutes}분
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-heading text-sm font-bold text-text-primary">상담 유형</p>
                <div className="grid gap-2">
                  {supportsVideo && (
                    <RadioCard
                      name="channel"
                      value="VIDEO"
                      label="화상 상담"
                      description="얼굴을 보며 진행하는 1:1 상담"
                      selected={channel === 'VIDEO'}
                      onSelect={() => setChannel('VIDEO')}
                      icon={<Video className="h-4 w-4" aria-hidden="true" />}
                    />
                  )}
                  {supportsChat && (
                    <RadioCard
                      name="channel"
                      value="CHAT"
                      label="채팅 상담"
                      description="텍스트로 편안하게 진행"
                      selected={channel === 'CHAT'}
                      onSelect={() => setChannel('CHAT')}
                      icon={<MessageSquare className="h-4 w-4" aria-hidden="true" />}
                    />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={goReserve}
                className={cn(
                  'inline-flex w-full items-center justify-center rounded-full px-6 py-3',
                  'bg-gradient-to-r from-gold to-gold-soft text-background',
                  'font-heading text-sm font-bold',
                  'transition-shadow hover:shadow-[var(--shadow-gold)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                )}
              >
                예약하기
              </button>

              {counselor.slots.length === 0 && (
                <p className="text-xs text-text-muted text-center">
                  현재 예약 가능한 슬롯이 없어요.
                </p>
              )}
            </GlowCard>
          </div>
        </aside>
      </div>

      {/* Mobile bottom CTA */}
      <div
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-40',
          'bg-background/90 backdrop-blur-md border-t border-border-subtle',
          'flex items-center justify-between gap-3 px-4 py-3',
        )}
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="min-w-0">
          <span className="block text-[11px] text-text-secondary">{sessionMinutes}분 상담</span>
          <span className="tabular-nums block font-heading text-base font-bold text-text-primary">
            {(pricePerSession ?? pricePerMinute * sessionMinutes).toLocaleString()}원
          </span>
        </div>
        <button
          type="button"
          onClick={goReserve}
          className={cn(
            'inline-flex items-center justify-center rounded-full px-6 py-2.5',
            'bg-gradient-to-r from-gold to-gold-soft text-background',
            'font-heading text-sm font-bold',
            'transition-shadow hover:shadow-[var(--shadow-gold)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          )}
        >
          예약하기
        </button>
      </div>
    </main>
  );
}
