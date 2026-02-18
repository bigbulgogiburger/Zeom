'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from '../../components/api';
import { Card } from '../../components/ui';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Counselor = { id: number; name: string; specialty: string; intro: string };

const SPECIALTY_FILTERS = ['전체', '사주', '타로', '신점', '꿈해몽', '궁합'] as const;

function specialtyEmoji(specialty: string): string {
  if (specialty.includes('사주')) return '🔮';
  if (specialty.includes('타로')) return '🃏';
  if (specialty.includes('신점')) return '🪷';
  if (specialty.includes('꿈')) return '🌙';
  if (specialty.includes('궁합')) return '💕';
  return '✨';
}

export default function CounselorsPage() {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('전체');

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

  const filtered = counselors.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || c.name.toLowerCase().includes(q) || c.specialty.toLowerCase().includes(q);
    const matchesFilter =
      activeFilter === '전체' || c.specialty.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  return (
    <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
          상담사 목록
        </h1>
        <p className="text-[#a49484] text-lg leading-relaxed mt-3">
          원하시는 분야의 상담사를 찾아보세요
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8 max-w-[600px] mx-auto w-full">
        <Input
          type="text"
          placeholder="상담사 이름 또는 분야 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[52px] bg-[#1a1612] border border-[rgba(201,162,39,0.15)] rounded-xl px-5 py-3.5 text-[var(--color-text-on-dark)] placeholder:text-[#a49484]/50 focus:ring-2 focus:ring-[#C9A227]/30 focus:border-[#C9A227]/40 transition-all text-base"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {SPECIALTY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              'rounded-full px-6 py-2.5 text-sm font-medium font-heading transition-all duration-300',
              activeFilter === f
                ? 'bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold shadow-[0_4px_20px_rgba(201,162,39,0.15)]'
                : 'border border-[rgba(201,162,39,0.2)] text-[#a49484] bg-transparent hover:bg-[#C9A227]/10 hover:text-[#C9A227] hover:border-[#C9A227]/30'
            )}
          >
            {f}
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
            <p className="font-bold font-heading">상담사 목록을 불러오지 못했습니다</p>
            <p className="text-sm mt-1">잠시 후 다시 시도해주세요.</p>
          </AlertDescription>
        </Alert>
      ) : sorted.length === 0 ? (
        <div className="bg-black/30 backdrop-blur-xl border border-[rgba(201,162,39,0.1)] rounded-2xl p-8">
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🔍</div>
            <p className="font-bold font-heading text-xl text-[var(--color-text-on-dark)]">
              검색 결과가 없습니다
            </p>
            <p className="text-[#a49484] text-sm mt-2 leading-relaxed">
              다른 검색어 또는 필터를 사용해보세요.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveFilter('전체'); }}
              className="mt-6 inline-flex items-center justify-center rounded-full px-8 py-3 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading transition-all hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)]"
            >
              전체 보기
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sorted.map((c) => (
            <Card key={c.id} className="flex flex-col text-center py-6 landing-card hover:-translate-y-1 transition-all duration-300">
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
                    프로필 보기
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
