'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '../../../components/api-client';

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
  isOnline?: boolean;
  tags?: string | null;
  shortVideoUrl?: string | null;
};

function specialtyIcon(specialty: string): string {
  if (specialty.includes('사주')) return '卦';
  if (specialty.includes('타로')) return '星';
  if (specialty.includes('신점')) return '蓮';
  if (specialty.includes('꿈')) return '月';
  if (specialty.includes('궁합')) return '緣';
  return '道';
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

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-[hsl(var(--gold))]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className="w-3.5 h-3.5"
          fill={i < full ? 'hsl(var(--gold))' : i === full && hasHalf ? 'url(#half)' : '#3a3530'}
        >
          <defs>
            <linearGradient id="half">
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="hsl(var(--gold))" className="w-5 h-5">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="hsl(var(--text-secondary))" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 8.25c0-3.105-2.464-5.25-5.437-5.25A5.5 5.5 0 0012 5.052 5.5 5.5 0 007.688 3C4.714 3 2.25 5.145 2.25 8.25c0 3.925 2.438 7.111 4.739 9.256a25.175 25.175 0 004.244 3.17c.12.07.244.133.383.218l.022.012.007.004.003.001a.752.752 0 00.704 0l.003-.001.007-.004.022-.012a15.247 15.247 0 00.383-.218 25.18 25.18 0 004.244-3.17C19.313 15.36 21.75 12.174 21.75 8.25z" />
    </svg>
  );
}

export default function CounselorCard({
  counselor,
  isLoggedIn,
  isFavorited,
  onToggleFavorite,
}: {
  counselor: CounselorListItem;
  isLoggedIn: boolean;
  isFavorited: boolean;
  onToggleFavorite?: (id: number) => void;
}) {
  const c = counselor;
  const tags = parseTags(c.tags);
  const rating = c.averageRating ?? 0;
  const reviews = c.totalReviews ?? 0;
  const career = c.careerYears ?? 0;
  const price = c.pricePerMinute ?? 3000;
  const responseRate = c.responseRate ?? 100;

  return (
    <div className="relative bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.15)] rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-[0_8px_32px_hsl(var(--gold)/0.12)] hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col">
      {/* Favorite button */}
      {isLoggedIn && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite?.(c.id); }}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[hsl(var(--gold))]/10 transition-all duration-200 z-10"
          aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <HeartIcon filled={isFavorited} />
        </button>
      )}

      {/* Top section: photo + online indicator */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          {c.profileImageUrl ? (
            <Image
              src={c.profileImageUrl}
              alt={`${c.name} 프로필`}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-[hsl(var(--gold)/0.2)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--background))] border-2 border-[hsl(var(--gold)/0.2)] flex items-center justify-center">
              <span className="text-xl font-heading font-black text-[hsl(var(--gold))]">{specialtyIcon(c.specialty)}</span>
            </div>
          )}
          {c.isOnline && (
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#22c55e] border-2 border-[hsl(var(--surface))] rounded-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-heading font-bold text-lg text-[hsl(var(--text-primary))] truncate">
            {c.name} 선생님
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StarRating rating={rating} />
            <span className="text-sm font-bold text-[hsl(var(--text-primary))]">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-[hsl(var(--text-secondary))]">
              ({reviews}건)
            </span>
            {career > 0 && (
              <>
                <span className="text-[hsl(var(--text-secondary))]">|</span>
                <span className="text-xs text-[hsl(var(--text-secondary))]">
                  경력 {career}년
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge variant="secondary" className="font-heading font-bold text-xs rounded-full px-3 py-0.5">
          {c.specialty}
        </Badge>
        {tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs text-[hsl(var(--text-secondary))] bg-[hsl(var(--surface))]/10 rounded-full px-2.5 py-0.5"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-secondary))] mb-4">
        <span>응답률 {responseRate}%</span>
        <span className="text-[hsl(var(--text-secondary))]">|</span>
        <span>분당 {price.toLocaleString()}원</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        {c.isOnline && (
          <Button
            asChild
            className="flex-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold font-heading rounded-full text-sm hover:from-[hsl(var(--gold))/0.85] hover:to-[hsl(var(--gold))]"
          >
            <Link href={`/counselors/${c.id}`}>
              바로 상담
            </Link>
          </Button>
        )}
        <Button
          variant="outline"
          asChild
          className={cn(
            'border-2 border-[hsl(var(--gold))] text-[hsl(var(--gold))] bg-transparent rounded-full text-sm font-bold font-heading hover:bg-[hsl(var(--gold))]/10',
            c.isOnline ? 'flex-1' : 'w-full'
          )}
        >
          <Link href={`/counselors/${c.id}`}>
            예약하기
          </Link>
        </Button>
      </div>
    </div>
  );
}
