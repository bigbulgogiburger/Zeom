'use client';

import Link from 'next/link';
import { Heart, Coins, Briefcase, Activity, Users, HeartCrack } from 'lucide-react';
import {
  Hero,
  CategoryGrid,
  ReviewSlider,
  CounselorCard,
  type CategoryItem,
  type ReviewSliderItem,
} from '@/components/design';
import type { PublicStats, FeaturedReview } from './page';

type Counselor = { id: number; name: string; specialty: string; intro: string };

const HOME_CATEGORIES: CategoryItem[] = [
  { id: 'love', label: '연애', icon: Heart, href: '/counselors?category=love' },
  { id: 'money', label: '금전', icon: Coins, href: '/counselors?category=money' },
  { id: 'job', label: '취업', icon: Briefcase, href: '/counselors?category=job' },
  { id: 'health', label: '건강', icon: Activity, href: '/counselors?category=health' },
  { id: 'family', label: '가족', icon: Users, href: '/counselors?category=family' },
  { id: 'breakup', label: '이별', icon: HeartCrack, href: '/counselors?category=breakup' },
];

function toReviewItems(reviews: FeaturedReview[]): ReviewSliderItem[] {
  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    authorName: r.authorName,
    counselorName: r.counselorName,
  }));
}

interface HomeContentProps {
  counselors: Counselor[];
  stats: PublicStats;
  featuredReviews: FeaturedReview[];
}

export default function HomeContent({
  counselors,
  stats,
  featuredReviews,
}: HomeContentProps) {
  const recommended = counselors.slice(0, 4);
  const reviewItems = toReviewItems(featuredReviews);

  return (
    <main className="pb-20">
      {/* ====== Hero ====== */}
      <Hero
        title="당신의 운명, 꽃처럼 피어나는 순간"
        subtitle="검증된 상담사와 1:1 비밀 상담. 사주·타로·신점 — 전통의 지혜로 길을 밝힙니다."
        ctaLabel="지금 상담받기"
        ctaHref="/counselors"
      />

      {/* ====== Recommended Counselors ====== */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <h2
                className="font-heading font-bold text-2xl sm:text-3xl text-[hsl(var(--text-primary))] m-0"
                style={{ wordBreak: 'keep-all', textWrap: 'balance' as const }}
              >
                추천 상담사
              </h2>
              <p
                className="mt-2 text-sm text-[hsl(var(--text-secondary))]"
                style={{ wordBreak: 'keep-all' }}
              >
                지금 상담 가능한 선생님을 만나보세요
              </p>
            </div>
            <Link
              href="/counselors"
              className="hidden sm:inline-block text-sm font-heading font-bold text-[hsl(var(--gold))] hover:underline"
            >
              전체 보기 →
            </Link>
          </div>

          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((c) => (
                <CounselorCard
                  key={c.id}
                  variant="compact"
                  counselor={{
                    id: c.id,
                    name: c.name,
                    specialty: c.specialty,
                  }}
                  href={`/counselors/${c.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--text-secondary))]">
              상담사 정보를 불러오는 중입니다.
            </p>
          )}
        </div>
      </section>

      {/* ====== Category Grid ====== */}
      <section className="py-12 sm:py-16 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <h2
              className="font-heading font-bold text-2xl sm:text-3xl text-[hsl(var(--text-primary))] m-0"
              style={{ wordBreak: 'keep-all', textWrap: 'balance' as const }}
            >
              어떤 고민이 있으신가요?
            </h2>
            <p
              className="mt-2 text-sm text-[hsl(var(--text-secondary))]"
              style={{ wordBreak: 'keep-all' }}
            >
              관심 분야를 선택해 맞춤 상담사를 찾아보세요
            </p>
          </div>
          <CategoryGrid categories={HOME_CATEGORIES} />
        </div>
      </section>

      {/* ====== Review Slider ====== */}
      {reviewItems.length > 0 && (
        <section className="py-12 sm:py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-end justify-between mb-6 sm:mb-8">
              <div>
                <h2
                  className="font-heading font-bold text-2xl sm:text-3xl text-[hsl(var(--text-primary))] m-0"
                  style={{ wordBreak: 'keep-all', textWrap: 'balance' as const }}
                >
                  실제 이용 후기
                </h2>
                <p
                  className="mt-2 text-sm text-[hsl(var(--text-secondary))] tabular-nums"
                  style={{ wordBreak: 'keep-all' }}
                >
                  평균 {stats.averageRating.toFixed(1)}점 · 후기 {stats.totalReviews.toLocaleString()}개
                </p>
              </div>
            </div>
            <ReviewSlider reviews={reviewItems} />
          </div>
        </section>
      )}

      {/* ====== CTA Footer Banner ====== */}
      <section className="py-10 px-6 text-center">
        <div className="max-w-[640px] mx-auto rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] py-8 px-6">
          <p
            className="text-sm text-[hsl(var(--text-secondary))] mb-3"
            style={{ wordBreak: 'keep-all' }}
          >
            더 많은 검증된 상담사를 만나보세요
          </p>
          <Link
            href="/counselors"
            className="inline-block font-heading font-bold text-base text-[hsl(var(--gold))] hover:underline"
          >
            더 많은 상담사 보기 →
          </Link>
        </div>
      </section>
    </main>
  );
}
