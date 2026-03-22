'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { API_BASE } from '../../components/api';
import { apiFetch } from '../../components/api-client';
import { useAuth } from '../../components/auth-context';
import { Pagination } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CounselorCard, { type CounselorListItem } from './components/CounselorCard';
import FilterBar from './components/FilterBar';
import SortDropdown from './components/SortDropdown';
import { Search } from 'lucide-react';

const PAGE_SIZE = 20;

export default function CounselorsPage() {
  const { me } = useAuth();
  const t = useTranslations('counselors');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL params
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
    new Set(initialSpecialties.length > 0 ? initialSpecialties : ['all'])
  );
  const [sortBy, setSortBy] = useState(initialSort);
  const [isOnlineOnly, setIsOnlineOnly] = useState(initialOnline);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [gridVisible, setGridVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver for stagger animation
  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGridVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, error, counselors.length]);

  const SPECIALTY_FILTERS = [
    { key: 'all', label: t('filterAll') },
    { key: '사주', label: t('filterSaju') },
    { key: '타로', label: t('filterTarot') },
    { key: '신점', label: t('filterSinjeom') },
    { key: '꿈해몽', label: t('filterDream') },
    { key: '궁합', label: t('filterCompatibility') },
  ];

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // Update URL params when filters change
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

  // Fetch counselors with filters
  useEffect(() => {
    setLoading(true);
    setError(false);
    setGridVisible(false);

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

  // Load favorites when logged in
  useEffect(() => {
    if (!me) {
      setFavoriteIds(new Set());
      return;
    }
    apiFetch('/api/v1/favorites?page=0&size=100', { cache: 'no-store' })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setFavoriteIds(new Set(data.map((f: { counselorId: number }) => f.counselorId)));
        }
      })
      .catch(() => {});
  }, [me]);

  const toggleFavorite = useCallback(async (counselorId: number) => {
    if (!me || togglingId !== null) return;
    setTogglingId(counselorId);
    const isFavorited = favoriteIds.has(counselorId);
    try {
      const res = await apiFetch(`/api/v1/favorites/${counselorId}`, {
        method: isFavorited ? 'DELETE' : 'POST',
      });
      if (res.ok) {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFavorited) {
            next.delete(counselorId);
          } else {
            next.add(counselorId);
          }
          return next;
        });
      }
    } catch {
      // silently ignore
    } finally {
      setTogglingId(null);
    }
  }, [me, togglingId, favoriteIds]);

  const handleFilterChange = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (key === 'all') {
        return new Set(['all']);
      }
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

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setPage(1);
  }, []);

  const handleOnlineToggle = useCallback(() => {
    setIsOnlineOnly((prev) => !prev);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-[hsl(var(--text-primary))] font-heading">
          {t('title')}
        </h1>
        <p className="text-[hsl(var(--text-secondary))] text-lg leading-relaxed mt-3">
          {t('subtitle')}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6 max-w-[600px] mx-auto w-full">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full min-h-[52px] bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.15)] rounded-xl px-5 py-3.5 text-[hsl(var(--text-primary))] placeholder:text-[hsl(var(--text-secondary))]/50 focus:ring-2 focus:ring-[hsl(var(--gold))]/30 focus:border-[hsl(var(--gold))]/40 transition-all text-base"
        />
      </div>

      {/* Filter chips + Sort */}
      <div className="mb-10 space-y-4">
        <FilterBar
          filters={SPECIALTY_FILTERS}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          isOnlineOnly={isOnlineOnly}
          onOnlineToggle={handleOnlineToggle}
        />

        <div className="flex justify-between items-center max-w-[600px] mx-auto">
          <span className="text-sm text-[hsl(var(--text-secondary))]">
            {!loading && `${totalElements}명의 상담사`}
          </span>
          <SortDropdown value={sortBy} onChange={handleSortChange} />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.1)] rounded-2xl p-6 animate-pulse"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--border-subtle))]" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/5 bg-[hsl(var(--border-subtle))] rounded-lg" />
                  <div className="h-3 w-2/3 bg-[hsl(var(--border-subtle))] rounded-lg" />
                </div>
              </div>
              <div className="h-3 w-4/5 bg-[hsl(var(--border-subtle))] rounded-lg mb-2" />
              <div className="h-3 w-3/5 bg-[hsl(var(--border-subtle))] rounded-lg mb-4" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 bg-[hsl(var(--border-subtle))] rounded-full" />
                <div className="h-10 flex-1 bg-[hsl(var(--border-subtle))] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>
            <p className="font-bold font-heading">{t('loadError')}</p>
            <p className="text-sm mt-1">{t('loadErrorRetry')}</p>
          </AlertDescription>
        </Alert>
      ) : counselors.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[hsl(var(--gold)/0.1)] rounded-2xl p-8">
          <div className="text-center py-6">
            <div className="mb-4"><Search className="size-10 text-[hsl(var(--text-muted))] mx-auto" /></div>
            <p className="font-bold font-heading text-xl text-[hsl(var(--text-primary))]">
              {t('noResults')}
            </p>
            <p className="text-[hsl(var(--text-secondary))] text-sm mt-2 leading-relaxed">
              {t('noResultsHint')}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
                setActiveFilters(new Set(['all']));
                setIsOnlineOnly(false);
                setSortBy('recommended');
                setPage(1);
              }}
              className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold font-heading transition-all hover:shadow-[0_4px_20px_hsl(var(--gold)/0.15)]"
            >
              {t('viewAll')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={gridRef}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-container${gridVisible ? ' visible' : ''}`}
          >
            {counselors.map((c) => (
              <CounselorCard
                key={c.id}
                counselor={c}
                isLoggedIn={!!me}
                isFavorited={favoriteIds.has(c.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </main>
  );
}
