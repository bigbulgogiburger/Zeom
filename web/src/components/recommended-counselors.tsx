'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { API_BASE } from './api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RecommendedCounselor = {
  counselorId: number;
  name: string;
  specialty: string;
  intro: string;
  ratingAvg: number;
  totalSessions: number;
  matchScore: number;
  matchReason: string;
};

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-[#C9A227]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className="w-3.5 h-3.5"
          fill={i < full ? '#C9A227' : i === full && hasHalf ? 'url(#half-widget)' : '#3a3128'}
        >
          <defs>
            <linearGradient id="half-widget">
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="50%" stopColor="#3a3128" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs ml-1 text-[#a49484]">{rating.toFixed(1)}</span>
    </span>
  );
}

export function RecommendedCounselors() {
  const [counselors, setCounselors] = useState<RecommendedCounselor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/recommendations/today?limit=5`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then((data: RecommendedCounselor[]) => {
        setCounselors(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (!loading && counselors.length === 0) return null;

  return (
    <section className="py-12">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
        <div className="text-center mb-8">
          <h2 className="font-heading font-bold text-2xl text-[var(--color-text-on-dark)] mb-2">
            오늘의 추천 상담사
          </h2>
          <p className="text-[#a49484] text-sm">
            높은 만족도를 자랑하는 상담사를 만나보세요
          </p>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-x-auto pb-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="min-w-[240px] bg-black/30 border border-[rgba(201,162,39,0.1)] rounded-2xl p-6 animate-pulse flex-shrink-0"
              >
                <div className="h-5 w-2/3 bg-[#1a1612] rounded mb-3" />
                <div className="h-4 w-1/2 bg-[#1a1612] rounded mb-3" />
                <div className="h-3 w-4/5 bg-[#1a1612] rounded mb-4" />
                <div className="h-9 w-full bg-[#1a1612] rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
            {counselors.map((c, idx) => (
              <div
                key={c.counselorId}
                className={cn(
                  'min-w-[260px] max-w-[300px] snap-start bg-black/30 backdrop-blur-xl rounded-2xl p-6 flex-shrink-0 flex flex-col transition-all duration-300 hover:-translate-y-1',
                  idx === 0
                    ? 'border-2 border-[#C9A227]/40 shadow-[0_0_20px_rgba(201,162,39,0.1)]'
                    : 'border border-[rgba(201,162,39,0.15)]'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading font-bold text-lg text-[var(--color-text-on-dark)] m-0">
                    {c.name}
                  </h3>
                  {idx === 0 && (
                    <Badge className="bg-[#C9A227] text-[#0f0d0a] font-heading font-bold text-[10px] rounded-full px-2 py-0">
                      TOP
                    </Badge>
                  )}
                </div>

                <Badge variant="secondary" className="self-start font-heading font-bold text-xs rounded-full px-3 py-1 mb-2">
                  {c.specialty}
                </Badge>

                <StarRating rating={c.ratingAvg} />

                <p className="text-[#a49484] text-sm mt-3 leading-relaxed flex-1 line-clamp-2">
                  {c.matchReason}
                </p>

                <Link
                  href={`/counselors/${c.counselorId}`}
                  className="mt-4 inline-flex items-center justify-center w-full rounded-full px-6 py-2.5 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading text-sm transition-all hover:shadow-[0_4px_20px_rgba(201,162,39,0.15)] no-underline"
                >
                  상담 예약
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-6">
          <Link
            href="/recommend"
            className="inline-flex items-center justify-center rounded-full px-8 py-3 border border-[rgba(201,162,39,0.3)] text-[#C9A227] font-heading font-bold text-sm bg-transparent hover:bg-[#C9A227]/10 transition-all no-underline"
          >
            나에게 맞는 상담사 찾기
          </Link>
        </div>
      </div>
    </section>
  );
}
