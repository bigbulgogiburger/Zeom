'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { API_BASE } from '../../components/api';
import { apiFetch } from '../../components/api-client';
import { useAuth } from '../../components/auth-context';
import { Card } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Counselor = { id: number; name: string; specialty: string; intro: string };

function specialtyEmoji(specialty: string): string {
  if (specialty.includes('사주')) return '🔮';
  if (specialty.includes('타로')) return '🃏';
  if (specialty.includes('신점')) return '🪷';
  if (specialty.includes('꿈')) return '🌙';
  if (specialty.includes('궁합')) return '💕';
  return '✨';
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C9A227" className="w-6 h-6">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#a49484" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25c0-3.105-2.464-5.25-5.437-5.25A5.5 5.5 0 0012 5.052 5.5 5.5 0 007.688 3C4.714 3 2.25 5.145 2.25 8.25c0 3.925 2.438 7.111 4.739 9.256a25.175 25.175 0 004.244 3.17c.12.07.244.133.383.218l.022.012.007.004.003.001a.752.752 0 00.704 0l.003-.001.007-.004.022-.012a15.247 15.247 0 00.383-.218 25.18 25.18 0 004.244-3.17C19.313 15.36 21.75 12.174 21.75 8.25z" />
    </svg>
  );
}

export default function CounselorsPage() {
  const { me } = useAuth();
  const t = useTranslations('counselors');
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const SPECIALTY_FILTERS = [
    { key: 'all', label: t('filterAll') },
    { key: '사주', label: t('filterSaju') },
    { key: '타로', label: t('filterTarot') },
    { key: '신점', label: t('filterSinjeom') },
    { key: '꿈해몽', label: t('filterDream') },
    { key: '궁합', label: t('filterCompatibility') },
  ];

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/counselors`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.json();
      })
      .then((data: Counselor[]) => {
        setCounselors(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

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

  const filtered = counselors.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q);
    const matchesFilter =
      activeFilter === 'all' || c.specialty.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
          {t('title')}
        </h1>
        <p className="text-[#a49484] text-lg leading-relaxed mt-3">
          {t('subtitle')}
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8 max-w-[600px] mx-auto w-full">
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[52px] bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl px-5 py-3.5 text-[var(--color-text-on-dark)] placeholder:text-[#a49484]/50 focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40 transition-all text-base"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {SPECIALTY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              'rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300',
              activeFilter === f.key
                ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold shadow-[0_4px_20px_rgba(201,162,39,0.15)]'
                : 'border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent hover:bg-[#C9A227]/10 hover:text-[#C9A227] hover:border-[#C9A227]/30'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8 animate-pulse">
              <div className="text-center mb-6">
                <div className="h-16 w-16 rounded-full bg-[#1a1612] mx-auto" />
              </div>
              <div className="h-6 w-3/5 bg-[#1a1612] rounded-lg mx-auto mb-4" />
              <div className="h-4 w-2/5 bg-[#1a1612] rounded-lg mx-auto mb-4" />
              <div className="h-4 w-4/5 bg-[#1a1612] rounded-lg mx-auto mb-6" />
              <div className="h-10 w-1/3 bg-[#1a1612] rounded-full mx-auto" />
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
      ) : sorted.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8">
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-bold font-heading text-xl text-[var(--color-text-on-dark)]">
              {t('noResults')}
            </p>
            <p className="text-[#a49484] text-sm mt-2 leading-relaxed">
              {t('noResultsHint')}
            </p>
            <button
              onClick={() => { setSearch(''); setActiveFilter('all'); }}
              className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading transition-all hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)]"
            >
              {t('viewAll')}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((c) => (
            <Card key={c.id} className="flex flex-col text-center py-6 landing-card hover:-translate-y-1 transition-all duration-300 relative">
              {/* Favorite heart - only when logged in */}
              {me && (
                <button
                  onClick={(e) => { e.preventDefault(); toggleFavorite(c.id); }}
                  disabled={togglingId === c.id}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#C9A227]/10 transition-all duration-200 disabled:opacity-50 z-10"
                  aria-label={favoriteIds.has(c.id) ? t('removeFavorite') : t('addFavorite')}
                >
                  <HeartIcon filled={favoriteIds.has(c.id)} />
                </button>
              )}

              {/* Emoji icon */}
              <div className="text-center text-[3rem] mb-4">
                {specialtyEmoji(c.specialty)}
              </div>

              {/* Name */}
              <h3 className="m-0 text-center font-heading font-bold text-xl text-card-foreground">
                {c.name}
              </h3>

              {/* Specialty badge */}
              <div className="text-center mt-3">
                <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full px-4 py-1.5">
                  {c.specialty}
                </Badge>
              </div>

              {/* Intro */}
              <p className="text-muted-foreground text-sm leading-relaxed mt-4 flex-1 text-center break-words">
                {c.intro}
              </p>

              {/* Profile link */}
              <div className="text-center mt-6">
                <Button variant="outline" size="sm" asChild className="border-2 border-[#C9A227] text-[#C9A227] bg-transparent rounded-full px-8 py-2.5 hover:bg-[#C9A227]/10 text-sm font-bold font-heading transition-all duration-300">
                  <Link href={`/counselors/${c.id}`}>
                    {t('viewProfile')}
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
