'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Heart,
  MessageCircle,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { apiFetch } from '../../components/api-client';
import { useAuth } from '../../components/auth-context';
import { RequireLogin } from '../../components/route-guard';
import { RecommendedCounselors } from '../../components/recommended-counselors';
import {
  Card,
  EmptyState,
  PageTitle,
  StatCard,
} from '../../components/ui';
import { cn } from '@/lib/utils';

type WalletResponse = {
  cashBalance?: number;
  creditBalance?: number;
  balance?: number;
};

type BookingItem = {
  id: number;
  counselorName?: string;
  counselor?: { name?: string; specialty?: string };
  startAt: string;
  status: string;
};

type ConsultationItem = {
  id: number;
  counselorName: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  status: string;
  hasReview: boolean;
};

type FortuneSummary = {
  oneLine?: string;
  summary?: string;
  message?: string;
  lucky?: string;
  date?: string;
};

type FavoriteListResponse = {
  total?: number;
  totalElements?: number;
  items?: unknown[];
  content?: unknown[];
};

type ActivityEntry = {
  id: string;
  label: string;
  detail: string;
  at: string;
  href?: string;
};

const ACTIVITY_WINDOW_DAYS = 30;
const ACTIVITY_LIMIT = 5;

const UPCOMING_STATUSES = new Set([
  'CONFIRMED',
  'BOOKED',
  'PENDING',
  'WAITING',
  'SCHEDULED',
]);

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) {
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (hrs <= 0) return '방금 전';
    return `${hrs}시간 전`;
  }
  if (days < 7) return `${days}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function DashboardPage() {
  const { me } = useAuth();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [upcoming, setUpcoming] = useState<BookingItem | null>(null);
  const [fortune, setFortune] = useState<FortuneSummary | null>(null);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [monthCash, setMonthCash] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadAll() {
      const [walletRes, bookingsRes, fortuneRes, consultationsRes, favoritesRes, txRes] =
        await Promise.allSettled([
          apiFetch('/api/v1/wallet', { cache: 'no-store' }).then((r) =>
            r.ok ? (r.json() as Promise<WalletResponse>) : null,
          ),
          apiFetch('/api/v1/bookings/me', { cache: 'no-store' }).then((r) =>
            r.ok ? (r.json() as Promise<BookingItem[]>) : null,
          ),
          apiFetch('/api/v1/fortune/today', { cache: 'no-store' }).then((r) =>
            r.ok ? (r.json() as Promise<FortuneSummary>) : null,
          ),
          apiFetch('/api/v1/consultations/me', { cache: 'no-store' }).then((r) =>
            r.ok ? (r.json() as Promise<ConsultationItem[]>) : null,
          ),
          apiFetch('/api/v1/favorites?page=0&size=1', { cache: 'no-store' }).then(
            (r) => (r.ok ? (r.json() as Promise<FavoriteListResponse>) : null),
          ),
          apiFetch('/api/v1/wallet/transactions?page=0&size=100', {
            cache: 'no-store',
          }).then((r) =>
            r.ok ? (r.json() as Promise<{ items?: { type: string; amount: number; createdAt: string }[]; content?: { type: string; amount: number; createdAt: string }[] }>) : null,
          ),
        ]);

      if (!alive) return;

      if (walletRes.status === 'fulfilled' && walletRes.value) {
        setWallet(walletRes.value);
      }

      if (bookingsRes.status === 'fulfilled' && bookingsRes.value) {
        const list = bookingsRes.value;
        const now = Date.now();
        const upcomingList = list
          .filter((b) => UPCOMING_STATUSES.has(b.status))
          .filter((b) => new Date(b.startAt).getTime() >= now)
          .sort(
            (a, b) =>
              new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
          );
        setUpcoming(upcomingList[0] ?? null);
      }

      if (fortuneRes.status === 'fulfilled' && fortuneRes.value) {
        setFortune(fortuneRes.value);
      }

      if (consultationsRes.status === 'fulfilled' && consultationsRes.value) {
        setConsultations(consultationsRes.value);
        const reviewed = consultationsRes.value.filter((c) => c.hasReview).length;
        setReviewCount(reviewed);
      }

      if (favoritesRes.status === 'fulfilled' && favoritesRes.value) {
        const fav = favoritesRes.value;
        setFavoriteCount(
          fav.total ??
            fav.totalElements ??
            (fav.items?.length ?? fav.content?.length ?? 0),
        );
      }

      if (txRes.status === 'fulfilled' && txRes.value) {
        const items = txRes.value.items ?? txRes.value.content ?? [];
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const sum = items
          .filter((t) => new Date(t.createdAt).getTime() >= monthStart)
          .filter((t) => /USE|SPEND|DEDUCT/i.test(t.type))
          .reduce((acc, t) => acc + Math.abs(t.amount), 0);
        setMonthCash(sum);
      }

      setLoading(false);
    }

    loadAll();
    return () => {
      alive = false;
    };
  }, []);

  const totalCash = wallet
    ? wallet.cashBalance ?? wallet.balance ?? 0
    : 0;

  const consultationCount = consultations.length;

  const oneLine =
    fortune?.oneLine ||
    fortune?.summary ||
    fortune?.message ||
    '오늘의 운세를 확인해보세요';

  // Activity timeline — last 30 days, top N
  const activity: ActivityEntry[] = useMemo(() => {
    const cutoff = Date.now() - ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const items: ActivityEntry[] = consultations
      .filter((c) => c.endedAt && new Date(c.endedAt).getTime() >= cutoff)
      .map((c) => ({
        id: `c-${c.id}`,
        label: c.hasReview ? '상담 완료 (리뷰 작성)' : '상담 완료',
        detail: `${c.counselorName} 상담사`,
        at: c.endedAt as string,
        href: `/consultation/${c.id}/summary`,
      }));
    items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return items.slice(0, ACTIVITY_LIMIT);
  }, [consultations]);

  const counselorName =
    upcoming?.counselorName ?? upcoming?.counselor?.name ?? '상담사';
  const counselorSpecialty = upcoming?.counselor?.specialty;

  return (
    <RequireLogin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-10 space-y-10">
        <header className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <PageTitle>대시보드</PageTitle>
            {me?.email && (
              <p className="m-0 mt-1 text-sm text-[hsl(var(--text-secondary))]">
                {me.name ? `${me.name}님, 오늘도 평안하세요.` : `${me.email}`}
              </p>
            )}
          </div>
        </header>

        {/* Hero — 3분할: 잔액 / 예정상담 / 오늘운세 */}
        <section
          aria-label="요약"
          className="grid gap-6 grid-cols-1 md:grid-cols-3"
        >
          {/* 잔액 */}
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <Wallet
                className="size-5 text-[hsl(var(--gold))] shrink-0 mt-0.5"
                aria-hidden
              />
              <h2 className="m-0 text-sm font-bold font-heading text-[hsl(var(--text-secondary))]">
                내 잔액
              </h2>
            </div>
            <div
              className={cn(
                'font-heading font-black tabular-nums leading-none',
                'text-[hsl(var(--gold))]',
                'text-[clamp(36px,8vw,60px)]',
              )}
              aria-label={`현재 잔액 ${totalCash.toLocaleString()}원`}
            >
              {loading ? '—' : totalCash.toLocaleString()}
              <span className="text-base font-bold ml-1 align-top">원</span>
            </div>
            <Link
              href="/wallet"
              className="inline-block mt-3 text-sm text-[hsl(var(--gold))] font-heading font-bold hover:underline"
            >
              지갑 자세히 보기
            </Link>
          </Card>

          {/* 예정 상담 */}
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <Calendar
                className="size-5 text-[hsl(var(--gold))] shrink-0 mt-0.5"
                aria-hidden
              />
              <h2 className="m-0 text-sm font-bold font-heading text-[hsl(var(--text-secondary))]">
                예정 상담
              </h2>
            </div>
            {loading ? (
              <div className="text-sm text-[hsl(var(--text-secondary))]">
                불러오는 중…
              </div>
            ) : upcoming ? (
              <Link
                href={`/bookings/me`}
                className="block group"
                aria-label={`예정 상담: ${counselorName}, ${formatDate(upcoming.startAt)} ${formatTime(upcoming.startAt)}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="size-12 rounded-full bg-[hsl(var(--gold)/0.12)] grid place-items-center text-[hsl(var(--gold))] font-heading font-bold"
                  >
                    {counselorName.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold font-heading truncate">
                      {counselorName}
                    </div>
                    {counselorSpecialty && (
                      <div className="text-xs text-[hsl(var(--text-secondary))] truncate">
                        {counselorSpecialty}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-sm tabular-nums">
                  <span className="font-bold text-[hsl(var(--text-primary))]">
                    {formatDate(upcoming.startAt)}
                  </span>
                  <span className="mx-2 text-[hsl(var(--text-secondary))]">·</span>
                  <span className="text-[hsl(var(--text-secondary))]">
                    {formatTime(upcoming.startAt)}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="text-sm text-[hsl(var(--text-secondary))]">
                예정된 상담이 없습니다.{' '}
                <Link
                  href="/counselors"
                  className="text-[hsl(var(--gold))] font-heading font-bold hover:underline"
                >
                  상담사 둘러보기
                </Link>
              </div>
            )}
          </Card>

          {/* 오늘 운세 */}
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <Sparkles
                className="size-5 text-[hsl(var(--gold))] shrink-0 mt-0.5"
                aria-hidden
              />
              <h2 className="m-0 text-sm font-bold font-heading text-[hsl(var(--text-secondary))]">
                오늘의 운세
              </h2>
            </div>
            {loading ? (
              <div className="text-sm text-[hsl(var(--text-secondary))]">
                불러오는 중…
              </div>
            ) : (
              <>
                <p className="m-0 text-sm leading-relaxed text-[hsl(var(--text-primary))]">
                  {oneLine}
                </p>
                <Link
                  href="/fortune"
                  className="inline-block mt-3 text-sm text-[hsl(var(--gold))] font-heading font-bold hover:underline"
                >
                  자세한 운세 보기
                </Link>
              </>
            )}
          </Card>
        </section>

        {/* Stat cards 4개 */}
        <section
          aria-label="활동 요약"
          className="grid gap-6 grid-cols-2 md:grid-cols-4"
        >
          <StatCard
            title="누적 상담"
            value={loading ? '—' : `${consultationCount}건`}
            hint="모든 완료된 상담"
          />
          <StatCard
            title="이번 달 사용"
            value={loading ? '—' : `${(monthCash ?? 0).toLocaleString()}원`}
            hint="현금/캐시 사용액"
          />
          <StatCard
            title="즐겨찾기"
            value={loading ? '—' : `${favoriteCount ?? 0}명`}
            hint="저장한 상담사"
          />
          <StatCard
            title="작성한 후기"
            value={loading ? '—' : `${reviewCount ?? 0}건`}
            hint="최근 30일"
          />
        </section>

        {/* 추천 섹션 */}
        <section aria-label="추천 상담사" className="grid gap-4">
          <div className="flex items-center justify-between">
            <h2 className="m-0 text-xl font-bold font-heading flex items-center gap-2">
              <Star className="size-5 text-[hsl(var(--gold))]" aria-hidden />
              추천 상담사
            </h2>
            <Link
              href="/recommend"
              className="text-sm text-[hsl(var(--gold))] font-heading font-bold hover:underline"
            >
              전체 보기
            </Link>
          </div>
          <RecommendedCounselors />
        </section>

        {/* 최근 활동 타임라인 */}
        <section aria-label="최근 활동" className="grid gap-4">
          <h2 className="m-0 text-xl font-bold font-heading flex items-center gap-2">
            <MessageCircle className="size-5 text-[hsl(var(--gold))]" aria-hidden />
            최근 활동
          </h2>
          {loading ? (
            <Card>
              <div className="text-sm text-[hsl(var(--text-secondary))] py-3">
                불러오는 중…
              </div>
            </Card>
          ) : activity.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-5" aria-hidden />}
              title="최근 활동이 없습니다"
              desc="첫 상담을 시작해보세요."
              actionLabel="상담사 둘러보기"
              actionHref="/counselors"
            />
          ) : (
            <Card>
              <ol className="grid grid-cols-[12px_1fr] gap-x-4">
                {activity.map((entry, idx) => {
                  const isLast = idx === activity.length - 1;
                  return (
                    <li key={entry.id} className="contents">
                      <div className="flex flex-col items-center">
                        <span
                          aria-hidden
                          className="w-3 h-3 rounded-full bg-[hsl(var(--gold))] mt-1.5 shrink-0"
                        />
                        {!isLast && (
                          <span
                            aria-hidden
                            className="w-px flex-1 min-h-6 bg-[hsl(var(--border-subtle))] my-1"
                          />
                        )}
                      </div>
                      <div className={cn('pb-4', isLast && 'pb-0')}>
                        {entry.href ? (
                          <Link
                            href={entry.href}
                            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold)/0.6)] rounded-md inline-block"
                          >
                            <div className="font-bold font-heading text-sm group-hover:text-[hsl(var(--gold))] transition-colors">
                              {entry.label}
                            </div>
                            <div className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">
                              {entry.detail}
                            </div>
                            <div className="text-xs text-[hsl(var(--text-secondary))] tabular-nums mt-1">
                              {formatRelative(entry.at)}
                            </div>
                          </Link>
                        ) : (
                          <>
                            <div className="font-bold font-heading text-sm">
                              {entry.label}
                            </div>
                            <div className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">
                              {entry.detail}
                            </div>
                            <div className="text-xs text-[hsl(var(--text-secondary))] tabular-nums mt-1">
                              {formatRelative(entry.at)}
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>
          )}
        </section>
      </main>
    </RequireLogin>
  );
}
