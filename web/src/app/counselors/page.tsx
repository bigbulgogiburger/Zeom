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
    <main className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-foreground">상담사 목록</h1>
        <p className="text-muted-foreground text-sm mt-2">
          원하시는 분야의 상담사를 찾아보세요
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="상담사 이름 또는 분야 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full min-h-[44px]"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SPECIALTY_FILTERS.map((f) => (
          <Button
            key={f}
            variant={activeFilter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(f)}
            className={cn(
              'rounded-full font-medium font-heading min-h-[36px] transition-all',
              activeFilter === f && 'border-primary'
            )}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="text-center mb-3">
                <div className="h-12 w-12 rounded-full bg-muted mx-auto" />
              </div>
              <div className="h-5 w-3/5 bg-muted rounded mx-auto mb-2" />
              <div className="h-3.5 w-2/5 bg-muted rounded mx-auto mb-2" />
              <div className="h-3.5 w-4/5 bg-muted rounded mx-auto" />
            </Card>
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
        <Card>
          <div className="text-center py-6">
            <p className="font-bold font-heading text-lg">
              검색 결과가 없습니다
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              다른 검색어 또는 필터를 사용해보세요.
            </p>
            <Button
              onClick={() => { setSearch(''); setActiveFilter('전체'); }}
              className="mt-4"
            >
              전체 보기
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((c) => (
            <Card key={c.id} className="flex flex-col">
              {/* Emoji icon */}
              <div className="text-center text-[2rem] mb-3">
                {specialtyEmoji(c.specialty)}
              </div>

              {/* Name */}
              <h3 className="m-0 text-center font-heading font-bold text-lg text-card-foreground">
                {c.name}
              </h3>

              {/* Specialty badge */}
              <div className="text-center mt-2">
                <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full">
                  {c.specialty}
                </Badge>
              </div>

              {/* Intro with 2-line clamp */}
              <p className="text-muted-foreground text-sm leading-normal mt-3 flex-1 line-clamp-2">
                {c.intro}
              </p>

              {/* Profile link */}
              <div className="text-center mt-4">
                <Button variant="outline" size="sm" asChild className="font-bold font-heading">
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
