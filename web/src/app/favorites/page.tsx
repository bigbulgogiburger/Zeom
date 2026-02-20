'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/components/api-client';
import { RequireLogin } from '@/components/route-guard';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmptyStateCard } from '@/components/empty-state';

type FavoriteCounselor = {
  counselorId: number;
  name: string;
  specialty: string;
  intro: string;
  favoritedAt: string;
};

function specialtyEmoji(specialty: string): string {
  if (specialty.includes('사주')) return '🔮';
  if (specialty.includes('타로')) return '🃏';
  if (specialty.includes('신점')) return '🪷';
  if (specialty.includes('꿈')) return '🌙';
  if (specialty.includes('궁합')) return '💕';
  return '✨';
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteCounselor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const res = await apiFetch('/api/v1/favorites?page=0&size=100', { cache: 'no-store' });
      if (!res.ok) {
        setError('즐겨찾기 목록을 불러오지 못했습니다.');
        setLoadFailed(true);
        return;
      }
      const data = await res.json();
      setFavorites(data);
      setError('');
    } catch {
      setError('즐겨찾기 목록을 불러오지 못했습니다.');
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function removeFavorite(counselorId: number) {
    setRemovingId(counselorId);
    try {
      const res = await apiFetch(`/api/v1/favorites/${counselorId}`, { method: 'DELETE' });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.counselorId !== counselorId));
      } else {
        setError('즐겨찾기 해제에 실패했습니다.');
      }
    } catch {
      setError('즐겨찾기 해제에 실패했습니다.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <RequireLogin>
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-on-dark)] font-heading">
            즐겨찾기 상담사
          </h1>
          <p className="text-[#a49484] text-lg leading-relaxed mt-3">
            관심 있는 상담사를 한눈에 확인하세요
          </p>
        </div>

        {error && !loadFailed && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
        ) : loadFailed ? (
          <EmptyStateCard
            variant="error"
            icon="!"
            title="즐겨찾기 목록을 불러오지 못했습니다"
            description="네트워크 상태를 확인하고 다시 시도해주세요."
            actionLabel="다시 시도"
            onAction={loadFavorites}
          />
        ) : favorites.length === 0 ? (
          <EmptyStateCard
            icon="💛"
            title="아직 즐겨찾기한 상담사가 없습니다"
            description="상담사 목록에서 마음에 드는 상담사를 즐겨찾기에 추가해보세요."
            actionLabel="상담사 둘러보기"
            actionHref="/counselors"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((f) => (
              <Card key={f.counselorId} className="flex flex-col text-center py-6 landing-card hover:-translate-y-1 transition-all duration-300 relative">
                {/* Emoji icon */}
                <div className="text-center text-[3rem] mb-4">
                  {specialtyEmoji(f.specialty)}
                </div>

                {/* Name */}
                <h3 className="m-0 text-center font-heading font-bold text-xl text-card-foreground">
                  {f.name}
                </h3>

                {/* Specialty badge */}
                <div className="text-center mt-3">
                  <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full px-4 py-1.5">
                    {f.specialty}
                  </Badge>
                </div>

                {/* Intro */}
                <p className="text-muted-foreground text-sm leading-relaxed mt-4 flex-1 text-center break-words">
                  {f.intro}
                </p>

                {/* Actions */}
                <div className="text-center mt-6 flex flex-col gap-3 items-center">
                  <Button variant="outline" size="sm" asChild className="border-2 border-[#C9A227] text-[#C9A227] bg-transparent rounded-full px-8 py-2.5 hover:bg-[#C9A227]/10 text-sm font-bold font-heading transition-all duration-300">
                    <Link href={`/counselors/${f.counselorId}`}>
                      프로필 보기
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFavorite(f.counselorId)}
                    disabled={removingId === f.counselorId}
                    className="text-[#a49484] hover:text-[var(--color-danger)] text-xs font-heading"
                  >
                    {removingId === f.counselorId ? '해제 중...' : '즐겨찾기 해제'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </RequireLogin>
  );
}
