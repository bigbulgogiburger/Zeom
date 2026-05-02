'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { API_BASE } from '../../components/api';
import { Pagination } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CounselorCard, FilterChip, EmptyState } from '@/components/design';
import { cn } from '@/lib/utils';

export type CounselorListItem = {
  id: number;
  name: string;
  specialty: string;
  intro: string;
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
  shortVideoUrl?: string | null;
  latestReviewSnippet?: string | null;
  latestReviewerName?: string | null;
};

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { key: 'recommended', label: '추천순' },
  { key: 'rating', label: '평점순' },
  { key: 'reviews', label: '리뷰순' },
  { key: 'price_asc', label: '낮은가격' },
  { key: 'price_desc', label: '높은가격' },
] as const;

export default function CounselorsPage() {
  const t = useTranslations('counselors');
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL → state
  const initialSearch = searchParams.get('search') ?? '';
  const initialSpecialties = searchParams.get('specialty')?.split(',').filter(Boolean) ?? [];
  const initialSort = searchParams.get('sort') ?? 'recommended';
  const initialOnline = searchParams.get('isOnline') === 'true';
  const initialPage = parseInt(searchParams.get('page') ?? '1', 10);

  const [counselors, setCounselors] = useState<CounselorListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(initialSpecialties.length > 0 ? initialSpecialties : ['all']),
  );
  const [sortBy, setSortBy] = useState(initialSort);
  const [isOnlineOnly, setIsOnlineOnly] = useState(initialOnline);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const SPECIALTY_FILTERS = [
    { key: 'all', label: t('filterAll') },
    { key: '사주', label: t('filterSaju') },
    { key: '타로', label: t('filterTarot') },
    { key: '신점', label: t('filterSinjeom') },
    { key: '꿈해몽', label: t('filterDream') },
    { key: '궁합', label: t('filterCompatibility') },
  ];

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // URL sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    const specialties = Array.from(activeFilters).filter((f) => f !== 'all');
    if (specialties.length > 0) params.set('specialty', specialties.join(','));
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    if (isOnlineOnly) params.set('isOnline', 'true');
    if (page > 1) params.set('page', String(page));

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : '/counselors';
    router.replace(newUrl, { scroll: false });
  }, [debouncedSearch, activeFilters, sortBy, isOnlineOnly, page, router]);

  // Fetch
  useEffect(() => {
    setLoading(true);
    setError(false);

    const params = new URLSearchParams();
    const specialties = Array.from(activeFilters).filter((f) => f !== 'all');
    if (specialties.length > 0) params.set('specialty', specialties[0]);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (sortBy !== 'recommended') params.set('sort', sortBy);
    if (isOnlineOnly) params.set('isOnline', 'true');
    params.set('page', String(page - 1));
    params.set('size', String(PAGE_SIZE));

    fetch(`${API_BASE}/api/v1/counselors/search?${params.toString()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data) => {
        setCounselors(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [debouncedSearch, activeFilters, sortBy, isOnlineOnly, page]);

  const handleFilterToggle = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (key === 'all') return new Set(['all']);
      next.delete('all');
      if (next.has(key)) {
        next.delete(key);
        if (next.size === 0) next.add('all');
      } else {
        next.add(key);
      }
      return next;
    });
    setPage(1);
  }, []);

  const handleOnlineToggle = useCallback(() => {
    setIsOnlineOnly((prev) => !prev);
    setPage(1);
  }, []);

  const handleSortToggle = useCallback((key: string) => {
    setSortBy(key);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  function resetAll() {
    setSearch('');
    setDebouncedSearch('');
    setActiveFilters(new Set(['all']));
    setIsOnlineOnly(false);
    setSortBy('recommended');
    setPage(1);
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pb-16">
      {/* Header */}
      <div className="pt-10 pb-6 text-center">
        <h1
          className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-text-primary"
          style={{ textWrap: 'balance', wordBreak: 'keep-all' }}
        >
          {t('title')}
        </h1>
        <p
          className="mt-3 text-sm sm:text-base text-text-secondary"
          style={{ wordBreak: 'keep-all' }}
        >
          {t('subtitle')}
        </p>
      </div>

      {/* Sticky search + filter */}
      <div
        className={cn(
          'sticky z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4',
          'top-[var(--header-h,64px)]',
          'bg-background/85 backdrop-blur-md border-b border-border-subtle/40',
        )}
      >
        <div className="mx-auto max-w-[720px]">
          <label className="relative block">
            <span className="sr-only">{t('searchPlaceholder')}</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              data-testid="counselor-search"
              className={cn(
                'h-12 w-full rounded-full pl-11 pr-4',
                'bg-surface-2 border border-border-subtle',
                'text-sm text-text-primary placeholder:text-text-muted',
                'focus:border-gold/50 focus:ring-2 focus:ring-gold/30',
              )}
            />
          </label>
        </div>

        {/* Specialty chips */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {SPECIALTY_FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              selected={activeFilters.has(f.key)}
              onToggle={() => handleFilterToggle(f.key)}
            />
          ))}
        </div>

        {/* Availability + Sort */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip
              label="지금 상담 가능"
              selected={isOnlineOnly}
              onToggle={handleOnlineToggle}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SORT_OPTIONS.map((s) => (
              <FilterChip
                key={s.key}
                label={s.label}
                selected={sortBy === s.key}
                onToggle={() => handleSortToggle(s.key)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="mt-6 flex items-center justify-between">
        <span className="tabular-nums text-xs text-text-secondary">
          {!loading && `${totalElements.toLocaleString()}명의 상담사`}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          data-testid="counselor-skeleton"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="glow-card animate-pulse motion-reduce:animate-none p-5"
              aria-hidden="true"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-surface-3" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/5 rounded-md bg-surface-3" />
                  <div className="h-3 w-2/3 rounded-md bg-surface-3" />
                  <div className="h-3 w-2/5 rounded-md bg-surface-3" />
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="h-3 w-16 rounded-md bg-surface-3" />
                <div className="h-9 w-24 rounded-full bg-surface-3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            <p className="font-heading font-bold">{t('loadError')}</p>
            <p className="mt-1 text-sm">{t('loadErrorRetry')}</p>
          </AlertDescription>
        </Alert>
      ) : counselors.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Search className="h-8 w-8" aria-hidden="true" />}
            title={t('noResults')}
            body={t('noResultsHint')}
            cta={{ label: t('viewAll'), onClick: resetAll }}
          />
        </div>
      ) : (
        <>
          <div
            className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
            data-testid="counselor-grid"
          >
            {counselors.map((c) => (
              <CounselorCard
                key={c.id}
                counselor={{
                  id: c.id,
                  name: c.name,
                  specialty: c.specialty,
                  imageUrl: c.profileImageUrl ?? null,
                  rating: c.averageRating,
                  reviewCount: c.totalReviews,
                  pricePerSession: c.pricePerSession,
                  pricePerMinute: c.pricePerMinute,
                  sessionMinutes: c.sessionMinutes,
                  isOnline: c.isOnline,
                  level: c.careerYears ? `경력 ${c.careerYears}년` : null,
                }}
                variant="list"
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      )}
    </main>
  );
}
