'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Star, Video, MessageSquare } from 'lucide-react';
import { API_BASE } from '../../../components/api';
import { apiFetch, getCreditBalance } from '../../../components/api-client';
import { useAuth } from '../../../components/auth-context';
import { ActionButton, Card, EmptyState } from '../../../components/ui';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  isOnline?: boolean;
  tags?: string | null;
  shortVideoUrl?: string | null;
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
  photoUrls?: string | null;
  helpfulCount?: number;
  consultationType?: string | null;
  isAnonymous?: boolean;
  helpfulByMe?: boolean;
};

const MAX_SLOTS = 3;

function specialtyEmoji(specialty: string): string {
  if (specialty.includes('사주')) return '🔮';
  if (specialty.includes('타로')) return '🃏';
  if (specialty.includes('신점')) return '🪷';
  if (specialty.includes('꿈')) return '🌙';
  if (specialty.includes('궁합')) return '💕';
  return '✨';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function groupSlotsByDate(slots: Slot[]): Map<string, Slot[]> {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const dateKey = formatDate(slot.startAt);
    const existing = groups.get(dateKey) || [];
    existing.push(slot);
    groups.set(dateKey, existing);
  }
  return groups;
}

function groupConsecutiveSlots(slots: Slot[]): { startAt: string; endAt: string }[] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  const ranges: { startAt: string; endAt: string }[] = [];
  let rangeStart = sorted[0].startAt;
  let rangeEnd = sorted[0].endAt;

  for (let i = 1; i < sorted.length; i++) {
    const slotStart = new Date(sorted[i].startAt).getTime();
    const prevEnd = new Date(rangeEnd).getTime();
    if (slotStart <= prevEnd) {
      rangeEnd = sorted[i].endAt;
    } else {
      ranges.push({ startAt: rangeStart, endAt: rangeEnd });
      rangeStart = sorted[i].startAt;
      rangeEnd = sorted[i].endAt;
    }
  }
  ranges.push({ startAt: rangeStart, endAt: rangeEnd });
  return ranges;
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseCertifications(certs: string | null | undefined): string[] {
  if (!certs) return [];
  try {
    const parsed = JSON.parse(certs);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <span className="inline-flex items-center gap-0.5 text-[hsl(var(--gold))]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className={starSize}
          fill={i < full ? 'hsl(var(--gold))' : i === full && hasHalf ? 'url(#half-detail)' : '#3a3530'}
        >
          <defs>
            <linearGradient id="half-detail">
              <stop offset="50%" stopColor="hsl(var(--gold))" />
              <stop offset="50%" stopColor="#3a3530" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="hsl(var(--gold))" className="w-7 h-7">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="hsl(var(--text-secondary))" className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25c0-3.105-2.464-5.25-5.437-5.25A5.5 5.5 0 0012 5.052 5.5 5.5 0 007.688 3C4.714 3 2.25 5.145 2.25 8.25c0 3.925 2.438 7.111 4.739 9.256a25.175 25.175 0 004.244 3.17c.12.07.244.133.383.218l.022.012.007.004.003.001a.752.752 0 00.704 0l.003-.001.007-.004.022-.012a15.247 15.247 0 00.383-.218 25.18 25.18 0 004.244-3.17C19.313 15.36 21.75 12.174 21.75 8.25z" />
    </svg>
  );
}

export default function CounselorDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { me } = useAuth();
  const [counselor, setCounselor] = useState<CounselorDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<number>>(new Set());
  const [maxWarning, setMaxWarning] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [consultationType, setConsultationType] = useState<'VIDEO' | 'CHAT'>('VIDEO');
  const [isFavorited, setIsFavorited] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditShortfall, setCreditShortfall] = useState({ needed: 0, have: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState<'latest' | 'helpful' | 'rating'>('latest');
  const [reviewType, setReviewType] = useState<string>('');
  const [reviewMinRating, setReviewMinRating] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [reviewTotalPages, setReviewTotalPages] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [introExpanded, setIntroExpanded] = useState(false);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/counselors/${id}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data) => {
        setCounselor(data);
        trackEvent('view_counselor', { counselor_id: id, counselor_name: data.name, specialty: data.specialty });
      })
      .catch(() => setLoadError('상담사 정보를 불러오지 못했습니다.'));
  }, [id]);

  // Fetch reviews with filters
  const loadReviews = useCallback(() => {
    const params = new URLSearchParams();
    if (reviewType) params.set('type', reviewType);
    params.set('sort', reviewSort);
    if (reviewMinRating > 0) params.set('minRating', String(reviewMinRating));
    params.set('page', String(reviewPage));
    params.set('size', '10');

    const headers: Record<string, string> = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/api/v1/counselors/${id}/reviews?${params}`, { cache: 'no-store', headers })
      .then((r) => {
        if (!r.ok) return { reviews: [], totalPages: 0, totalElements: 0 };
        return r.json();
      })
      .then((data) => {
        setReviews(data.reviews ?? (Array.isArray(data) ? data : data.content ?? []));
        setReviewTotalPages(data.totalPages ?? 0);
        setReviewTotal(data.totalElements ?? 0);
      })
      .catch(() => {});
  }, [id, reviewSort, reviewType, reviewMinRating, reviewPage]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Check favorite status when logged in
  useEffect(() => {
    if (!me) {
      setIsFavorited(false);
      return;
    }
    apiFetch(`/api/v1/favorites/${id}/status`, { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setIsFavorited(data.favorited);
        }
      })
      .catch(() => {});
  }, [me, id]);

  // Fetch credit balance when logged in
  useEffect(() => {
    if (!me) {
      setCreditBalance(null);
      return;
    }
    getCreditBalance()
      .then((data) => setCreditBalance(data.remainingCredits ?? 0))
      .catch(() => setCreditBalance(null));
  }, [me]);

  // Show sticky CTA when hero scrolls out of view (mobile only)
  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [counselor]);

  const toggleFavorite = useCallback(async () => {
    if (!me || togglingFavorite) return;
    setTogglingFavorite(true);
    try {
      const res = await apiFetch(`/api/v1/favorites/${id}`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch {
      // silently ignore
    } finally {
      setTogglingFavorite(false);
    }
  }, [me, togglingFavorite, isFavorited, id]);

  function toggleSlot(slot: Slot) {
    setSelectedSlotIds((prev) => {
      const next = new Set(prev);
      if (next.has(slot.id)) {
        next.delete(slot.id);
        setMaxWarning('');
      } else {
        if (next.size >= MAX_SLOTS) {
          setMaxWarning(`최대 ${MAX_SLOTS}개 슬롯까지 선택할 수 있습니다.`);
          return prev;
        }
        next.add(slot.id);
        setMaxWarning('');
      }
      return next;
    });
    setShowConfirm(false);
    setBookingError('');
  }

  const selectedSlots = counselor
    ? counselor.slots.filter((s) => selectedSlotIds.has(s.id))
    : [];

  async function handleBook() {
    if (selectedSlots.length === 0 || !counselor) return;

    const needed = selectedSlots.length;
    if (creditBalance !== null && creditBalance < needed) {
      setCreditShortfall({ needed, have: creditBalance });
      setShowCreditModal(true);
      return;
    }

    setBooking(true);
    setBookingError('');

    try {
      const res = await apiFetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counselorId: Number(id), slotIds: selectedSlots.map((s) => s.id), consultationType }),
      });
      const json = await res.json();

      if (!res.ok) {
        setBookingError(json.message ?? '예약에 실패했습니다.');
        setBooking(false);
        return;
      }

      setShowConfirm(false);
      setBookingSuccess(true);
      setCounselor((prev) =>
        prev ? { ...prev, slots: prev.slots.filter((s) => !selectedSlotIds.has(s.id)) } : prev
      );

      setTimeout(() => router.push('/bookings/me'), 2000);
    } catch {
      setBookingError('네트워크 오류가 발생했습니다.');
    } finally {
      setBooking(false);
    }
  }

  // Loading error state
  if (loadError) {
    return (
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10">
        <Alert variant="destructive">
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      </main>
    );
  }

  // Loading skeleton
  if (!counselor) {
    return (
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 space-y-8">
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-10 animate-pulse">
          <div className="flex flex-col items-center gap-5">
            <div className="h-24 w-24 rounded-full bg-[hsl(var(--surface))]" />
            <div className="h-7 w-2/5 bg-[hsl(var(--surface))] rounded-lg" />
            <div className="h-4 w-1/4 bg-[hsl(var(--surface))] rounded-lg" />
            <div className="h-4 w-3/5 bg-[hsl(var(--surface))] rounded-lg" />
          </div>
        </div>
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-10 animate-pulse">
          <div className="h-5 w-1/3 bg-[hsl(var(--surface))] rounded-lg mb-6" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-[hsl(var(--surface))] rounded-xl" />
            <div className="h-12 bg-[hsl(var(--surface))] rounded-xl" />
            <div className="h-12 bg-[hsl(var(--surface))] rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  // Booking success view
  if (bookingSuccess) {
    return (
      <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-12">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="font-heading text-3xl font-black tracking-tight bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] bg-clip-text text-transparent mb-3">
            예약이 완료되었습니다!
          </h2>
          <p className="text-[hsl(var(--text-secondary))] text-lg leading-relaxed">
            내 예약 페이지로 이동합니다...
          </p>
        </div>
      </main>
    );
  }

  const slotsByDate = groupSlotsByDate(counselor.slots);
  const tags = parseTags(counselor.tags);
  const certifications = parseCertifications(counselor.certifications);
  const rating = counselor.averageRating ?? 0;
  const reviewCount = counselor.totalReviews ?? 0;
  const career = counselor.careerYears ?? 0;
  const price = counselor.pricePerMinute ?? 3000;
  const responseRate = counselor.responseRate ?? 100;
  const consultations = counselor.totalConsultations ?? 0;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: counselor.name,
    description: counselor.intro,
    aggregateRating: reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
    } : undefined,
    provider: {
      '@type': 'Organization',
      name: '천지연꽃신당',
    },
  };

  return (
    <main className="max-w-[900px] mx-auto px-6 sm:px-8 py-10 space-y-8 pb-20 md:pb-10">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--gold))] p-2 -ml-2 rounded-lg hover:bg-[hsl(var(--gold)/0.08)] transition-all duration-200"
        aria-label="뒤로가기"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">뒤로</span>
      </button>

      {/* Enhanced Profile Hero Section */}
      <Card>
        <div ref={heroRef} className="flex flex-col items-center text-center gap-5 py-6">
          {/* Profile avatar */}
          <div className="relative">
            {counselor.profileImageUrl ? (
              <Image
                src={counselor.profileImageUrl}
                alt={`${counselor.name} 프로필`}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-3 border-[hsl(var(--gold)/0.3)] shadow-[0_0_20px_hsl(var(--gold)/0.15)]"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] border-3 border-[hsl(var(--gold)/0.3)] flex items-center justify-center text-2xl font-black text-[hsl(var(--background))] shadow-[0_0_20px_hsl(var(--gold)/0.15)]">
                {counselor.name.charAt(0)}
              </div>
            )}
            {counselor.isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-5 h-5 bg-[#22c55e] border-3 border-[hsl(var(--surface))] rounded-full" />
            )}
          </div>

          <div>
            <div className="flex items-center justify-center gap-3">
              <h2 className="m-0 font-heading font-black text-2xl tracking-tight text-card-foreground">
                {counselor.name}
              </h2>
              {me && (
                <button
                  onClick={toggleFavorite}
                  disabled={togglingFavorite}
                  className="p-1.5 rounded-full hover:bg-[hsl(var(--gold))]/10 transition-all duration-200 disabled:opacity-50"
                  aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                >
                  <HeartIcon filled={isFavorited} />
                </button>
              )}
            </div>

            {/* Online status text */}
            {counselor.isOnline && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-sm font-medium text-[#22c55e]">지금 상담 가능</span>
              </div>
            )}

            {/* Specialty tags as pills */}
            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <span className="bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] text-xs rounded-full px-3 py-1 font-heading font-bold">
                {counselor.specialty}
              </span>
              {counselor.supportedConsultationTypes?.includes('VIDEO') && (
                <span className="bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] text-xs rounded-full px-3 py-1 font-heading font-bold inline-flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  화상상담
                </span>
              )}
              {counselor.supportedConsultationTypes?.includes('CHAT') && (
                <span className="bg-[#4A90D9]/10 text-[#4A90D9] text-xs rounded-full px-3 py-1 font-heading font-bold inline-flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  채팅상담
                </span>
              )}
            </div>

            {/* Rating — larger and more prominent */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Star className="w-5 h-5 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
              <span className="font-black text-xl text-card-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({reviewCount.toLocaleString()}건의 리뷰)
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              {consultations > 0 && (
                <span>상담 횟수: {consultations.toLocaleString()}건</span>
              )}
              {consultations > 0 && career > 0 && (
                <span className="text-muted-foreground">|</span>
              )}
              {career > 0 && (
                <span>경력: {career}년</span>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-muted-foreground bg-[hsl(var(--surface))]/10 rounded-full px-2.5 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Intro with "more" toggle */}
          {counselor.intro && (
            <div className="max-w-[500px]">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {counselor.intro.length > 150 && !introExpanded
                  ? `${counselor.intro.slice(0, 150)}...`
                  : counselor.intro}
                {counselor.intro.length > 150 && (
                  <button
                    onClick={() => setIntroExpanded(!introExpanded)}
                    className="ml-1 text-[hsl(var(--gold))] text-sm font-bold hover:underline"
                  >
                    {introExpanded ? '접기' : '더 보기'}
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Key metrics row */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-xl text-card-foreground">{responseRate}%</div>
              <div className="text-xs text-muted-foreground">응답률</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-card-foreground">{consultations.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">총 상담</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-xl text-card-foreground">{price.toLocaleString()}원</div>
              <div className="text-xs text-muted-foreground">분당</div>
            </div>
          </div>

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {certifications.map((cert) => (
                <Badge key={cert} variant="outline" className="font-heading text-xs rounded-full px-3 py-1 border-[hsl(var(--gold))]/20 text-[hsl(var(--gold))]">
                  {cert}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Consultation Type Selector */}
      {counselor.supportedConsultationTypes?.includes('CHAT') && (
        <Card>
          <div className="py-2">
            <h3 className="m-0 mb-4 font-heading text-base font-bold text-card-foreground text-center">
              상담 유형 선택
            </h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConsultationType('VIDEO')}
                className={cn(
                  'flex-1 max-w-[200px] py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-300 border-2',
                  consultationType === 'VIDEO'
                    ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] shadow-[0_0_12px_hsl(var(--gold)/0.15)]'
                    : 'border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]/30'
                )}
              >
                화상상담
                <span className="block text-xs font-normal mt-1 opacity-70">
                  상담권 1회/슬롯
                </span>
              </button>
              <button
                onClick={() => setConsultationType('CHAT')}
                className={cn(
                  'flex-1 max-w-[200px] py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-300 border-2',
                  consultationType === 'CHAT'
                    ? 'border-[#4A90D9] bg-[#4A90D9]/10 text-[#4A90D9] shadow-[0_0_12px_rgba(74,144,217,0.15)]'
                    : 'border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] hover:border-[#4A90D9]/30'
                )}
              >
                채팅상담
                <span className="block text-xs font-normal mt-1 opacity-70">
                  상담권 0.7회/슬롯 (30% 할인)
                </span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Available Slots Section */}
      <div data-section="slots">
        <h3 className="m-0 mb-8 font-heading text-xl font-bold text-[hsl(var(--text-primary))] text-center">
          예약 가능 슬롯
        </h3>

        {counselor.slots.length === 0 ? (
          <EmptyState title="현재 가능한 슬롯이 없어요" desc="다른 상담사 또는 시간대를 확인해주세요." />
        ) : (
          <div className="grid gap-6">
            {Array.from(slotsByDate.entries()).map(([dateLabel, slots]) => (
              <div key={dateLabel}>
                <h4 className="m-0 mb-4 font-heading text-base font-bold text-[hsl(var(--text-primary))]">
                  {dateLabel}
                </h4>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                  {slots.map((s) => {
                    const isSelected = selectedSlotIds.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleSlot(s)}
                        className={cn(
                          'relative p-3 text-center font-heading font-medium text-sm transition-all duration-300 rounded-xl h-auto',
                          isSelected
                            ? 'border-2 border-[hsl(var(--gold))] bg-[hsl(var(--gold))] text-[hsl(var(--background))] shadow-[0_0_12px_hsl(var(--gold)/0.3)]'
                            : 'border border-[hsl(var(--gold)/0.15)] bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] hover:border-[hsl(var(--gold))]/30 hover:bg-[hsl(var(--gold))]/5'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute top-1.5 right-2 text-[hsl(var(--background))] text-xs font-bold leading-none">
                            ✓
                          </span>
                        )}
                        {formatTime(s.startAt)} ~ {formatTime(s.endAt)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {maxWarning && (
              <div className="text-[hsl(var(--warning))] text-sm font-medium text-center bg-[hsl(var(--warning))]/10 rounded-xl py-2 px-4">
                {maxWarning}
              </div>
            )}

            {selectedSlots.length > 0 && (
              <div className="flex justify-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-[hsl(var(--gold))] border-[hsl(var(--gold))]/30 font-heading font-bold text-sm rounded-full px-4 py-1.5">
                  {selectedSlots.length}개 슬롯 선택됨 ({selectedSlots.length * 30}분)
                </Badge>
                <Badge variant="secondary" className="font-heading font-bold text-sm rounded-full px-4 py-1.5">
                  상담권 {selectedSlots.length}회 사용
                </Badge>
                {me && creditBalance !== null && (
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-heading font-bold text-sm rounded-full px-4 py-1.5',
                      creditBalance >= selectedSlots.length
                        ? 'border-emerald-500/30 text-emerald-400'
                        : 'border-red-500/30 text-red-400'
                    )}
                  >
                    보유 상담권: {creditBalance}회
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking CTA */}
      {selectedSlots.length > 0 && !showConfirm && (
        <div className="sticky bottom-4 text-center pt-3">
          <ActionButton
            onClick={() => { setShowConfirm(true); setBookingError(''); }}
            className="w-full max-w-[400px]"
          >
            예약하기 ({selectedSlots.length}개 슬롯)
          </ActionButton>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirm && selectedSlots.length > 0 && (
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.15)] rounded-2xl p-8 sm:p-10 shadow-lg">
          <h3 className="m-0 mb-6 font-heading font-bold text-xl text-center text-[hsl(var(--text-primary))]">
            예약 확인
          </h3>

          <div className="grid gap-4 text-sm mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[hsl(var(--text-secondary))]">상담사</span>
              <span className="font-bold text-[hsl(var(--text-primary))]">{counselor.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[hsl(var(--text-secondary))]">상담 유형</span>
              <Badge
                variant="outline"
                className={cn(
                  'font-heading font-bold text-xs rounded-full px-3 py-1',
                  consultationType === 'CHAT'
                    ? 'border-[#4A90D9]/30 text-[#4A90D9]'
                    : 'border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))]'
                )}
              >
                {consultationType === 'CHAT' ? '채팅상담' : '화상상담'}
              </Badge>
            </div>

            {groupConsecutiveSlots(selectedSlots).map((range, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[hsl(var(--text-secondary))]">
                  {i === 0 ? '시간' : ''}
                </span>
                <span className="font-bold text-[hsl(var(--text-primary))]">
                  {formatDate(range.startAt)} {formatTime(range.startAt)} ~ {formatTime(range.endAt)}
                </span>
              </div>
            ))}

            <div className="border-t border-[hsl(var(--gold)/0.1)] pt-4 mt-2 grid gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[hsl(var(--text-secondary))]">총 소요시간</span>
                <span className="font-bold text-[hsl(var(--text-primary))]">{selectedSlots.length * 30}분</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[hsl(var(--text-secondary))]">사용 상담권</span>
                <span className="font-bold text-[hsl(var(--text-primary))]">{selectedSlots.length}회</span>
              </div>
            </div>
          </div>

          {bookingError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{bookingError}</AlertDescription>
            </Alert>
          )}

          <div className={cn('flex gap-4', bookingError && 'mt-3')}>
            <button
              onClick={() => { setShowConfirm(false); setBookingError(''); }}
              disabled={booking}
              className="flex-1 rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] font-heading font-bold py-3 bg-transparent hover:bg-[hsl(var(--gold))]/10 transition-all duration-300 disabled:opacity-50"
            >
              취소
            </button>
            <ActionButton
              onClick={handleBook}
              loading={booking}
              className="flex-1"
            >
              예약 확정
            </ActionButton>
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div>
        <h3 className="m-0 mb-4 font-heading text-xl font-bold text-[hsl(var(--text-primary))] text-center">
          리뷰 ({reviewTotal}건)
        </h3>

        {/* Rating Distribution Bar Chart */}
        {reviewTotal > 0 && (
          <div className="mb-6 px-2">
            <div className="grid gap-2">
              {[5, 4, 3, 2, 1].map((starLevel) => {
                const count = reviews.filter((r) => Math.round(r.rating) === starLevel).length;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={starLevel} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8 text-right font-heading font-bold shrink-0">{starLevel}점</span>
                    <div className="flex-1 h-2 rounded-full bg-[hsl(var(--surface))] overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--gold))] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 shrink-0">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4 justify-center">
          {/* Consultation type filter chips */}
          {['', '사주', '타로', '신점', '궁합'].map((t) => (
            <button
              key={t}
              onClick={() => { setReviewType(t); setReviewPage(0); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all duration-200 border',
                reviewType === t
                  ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]'
                  : 'border-[hsl(var(--gold)/0.15)] bg-transparent text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold))]/30'
              )}
            >
              {t || '전체'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 justify-center">
          {/* Sort options */}
          {([
            { key: 'latest', label: '최신순' },
            { key: 'helpful', label: '도움순' },
            { key: 'rating', label: '별점순' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setReviewSort(key); setReviewPage(0); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-heading font-bold transition-all duration-200',
                reviewSort === key
                  ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))]'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--gold))]/10'
              )}
            >
              {label}
            </button>
          ))}

          {/* Min rating filter */}
          <select
            value={reviewMinRating}
            onChange={(e) => { setReviewMinRating(Number(e.target.value)); setReviewPage(0); }}
            className="px-3 py-1.5 rounded-full text-xs font-heading font-bold bg-[hsl(var(--surface))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--gold)/0.15)] outline-none"
          >
            <option value={0}>전체 별점</option>
            <option value={3}>3점 이상</option>
            <option value={4}>4점 이상</option>
            <option value={5}>5점만</option>
          </select>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--text-secondary))] text-sm">
            리뷰가 없습니다.
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => {
              const reviewText = review.content || review.comment || '';
              const photos = review.photoUrls
                ? review.photoUrls.split(',').map((u: string) => u.trim()).filter(Boolean)
                : [];

              return (
                <Card key={review.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm font-bold text-card-foreground">
                          {review.rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {review.isAnonymous ? '익명' : (review.userName ?? '익명')}
                        </span>
                        {review.consultationType && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 rounded-full border-[hsl(var(--gold))]/20 text-[hsl(var(--gold))]">
                            {review.consultationType}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-card-foreground leading-relaxed">
                        {reviewText}
                      </p>

                      {/* Photo thumbnails */}
                      {photos.length > 0 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                          {photos.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`리뷰 사진 ${i + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-[hsl(var(--gold)/0.1)] hover:border-[hsl(var(--gold))]/40 transition-colors"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {review.reply && (
                        <div className="mt-3 pl-4 border-l-2 border-[hsl(var(--gold))]/20">
                          <p className="text-xs text-muted-foreground mb-1 font-bold">상담사 답변</p>
                          <p className="text-sm text-card-foreground leading-relaxed">
                            {review.reply}
                          </p>
                        </div>
                      )}

                      {/* Helpful button */}
                      <div className="mt-3 flex items-center">
                        <button
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            if (!token) return;
                            try {
                              const res = await fetch(`${API_BASE}/api/v1/reviews/${review.id}/helpful`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` },
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setReviews((prev) =>
                                  prev.map((r) =>
                                    r.id === review.id
                                      ? { ...r, helpfulCount: data.helpfulCount, helpfulByMe: data.helpfulByMe }
                                      : r
                                  )
                                );
                              }
                            } catch {}
                          }}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-bold transition-all duration-200 border',
                            review.helpfulByMe
                              ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]'
                              : 'border-[hsl(var(--gold)/0.15)] bg-transparent text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold))]/30'
                          )}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M1 8.998a1 1 0 011-1h1v7a1 1 0 01-1 1H2a1 1 0 01-1-1v-7zm4 7.5v-8.5l3-5.5a1.5 1.5 0 012.83.68L10 5.998h5a2 2 0 011.94 2.48l-1.5 6a2 2 0 01-1.94 1.52H5z" />
                          </svg>
                          도움됐어요 {(review.helpfulCount ?? 0) > 0 ? review.helpfulCount : ''}
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Review pagination */}
            {reviewTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  disabled={reviewPage === 0}
                  className="px-3 py-1 rounded-full text-xs font-heading font-bold border border-[hsl(var(--gold)/0.15)] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold))]/30 disabled:opacity-30"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-xs text-[hsl(var(--text-secondary))]">
                  {reviewPage + 1} / {reviewTotalPages}
                </span>
                <button
                  onClick={() => setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1))}
                  disabled={reviewPage >= reviewTotalPages - 1}
                  className="px-3 py-1 rounded-full text-xs font-heading font-bold border border-[hsl(var(--gold)/0.15)] text-[hsl(var(--text-secondary))] hover:border-[hsl(var(--gold))]/30 disabled:opacity-30"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Bottom CTA Bar (Mobile) */}
      {showStickyCta && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[hsl(var(--surface))] border-t border-[hsl(var(--border-subtle))] px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div>
            <span className="text-sm text-[hsl(var(--text-secondary))]">30분 상담</span>
            <span className="text-lg font-bold text-[hsl(var(--text-primary))] ml-2">
              {(price * 30).toLocaleString()}원
            </span>
          </div>
          <button
            onClick={() => {
              const slotsSection = document.querySelector('[data-section="slots"]');
              if (slotsSection) slotsSection.scrollIntoView({ behavior: 'smooth' });
            }}
            className="rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold px-6 py-2.5 text-sm transition-all duration-200 hover:shadow-[0_0_16px_hsl(var(--gold)/0.3)]"
          >
            예약하기
          </button>
        </div>
      )}

      {/* Insufficient Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-8 sm:p-10 max-w-[420px] w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎫</div>
              <h3 className="m-0 font-heading font-bold text-xl text-red-400">
                상담권이 부족합니다
              </h3>
            </div>

            <div className="grid gap-3 text-sm mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[hsl(var(--text-secondary))]">필요</span>
                <span className="font-bold text-[hsl(var(--text-primary))]">{creditShortfall.needed}회</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[hsl(var(--text-secondary))]">보유</span>
                <span className="font-bold text-[hsl(var(--text-primary))]">{creditShortfall.have}회</span>
              </div>
              <div className="border-t border-[hsl(var(--gold)/0.1)] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[hsl(var(--text-secondary))]">부족</span>
                  <span className="font-bold text-red-400">{creditShortfall.needed - creditShortfall.have}회</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <ActionButton
                onClick={() => {
                  const shortage = creditShortfall.needed - creditShortfall.have;
                  router.push(`/credits/buy?needed=${shortage}&returnTo=/counselors/${id}`);
                }}
                className="w-full"
              >
                상담권 구매하기
              </ActionButton>
              <button
                onClick={() => setShowCreditModal(false)}
                className="w-full rounded-full border-2 border-[hsl(var(--gold))]/30 text-[hsl(var(--gold))] font-heading font-bold py-3 bg-transparent hover:bg-[hsl(var(--gold))]/10 transition-all duration-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
