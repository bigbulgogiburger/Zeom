'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Card } from '../components/ui';
import { Button } from '@/components/ui/button';
import FortuneCard from '@/components/fortune-card';
import type { PublicStats, FeaturedReview } from './page';

type Counselor = { id: number; name: string; specialty: string; intro: string };

/* --- Hooks --- */

function useInView(threshold = 0.15): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function useCountUp(target: number, duration: number, start: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    let raf: number;
    function animate(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);

  return value;
}

/* --- Sub-components --- */

function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      className={`fade-up ${visible ? 'visible' : ''} ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

function CountUpNumber({
  target,
  suffix,
  label,
  start,
}: {
  target: number;
  suffix: string;
  label: string;
  start: boolean;
}) {
  const value = useCountUp(target, 2000, start);
  return (
    <div className="text-center">
      <div className="text-[clamp(2rem,5vw,3rem)] font-black font-heading leading-tight bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] bg-clip-text text-transparent">
        {value}
        {suffix}
      </div>
      <div className="text-sm text-[hsl(var(--text-secondary))] mt-1 font-heading font-medium">
        {label}
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--border-subtle))]'}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}

/* --- Data --- */

const counselorIcons = ['蓮', '月', '星', '卦', '花', '陰'];

const valueProps = [
  {
    icon: '蓮',
    title: '검증된 상담사',
    desc: '엄선된 전문가가 전통 점술의 지혜로 당신의 길을 밝혀드립니다',
  },
  {
    icon: '鎖',
    title: '안전한 결제',
    desc: 'PortOne 통합결제로 안심하고 간편하게 결제하세요',
  },
  {
    icon: '談',
    title: '실시간 상담방',
    desc: '예약 즉시 1:1 비밀 상담방이 자동 개설됩니다',
  },
];

const steps = [
  { num: '01', title: '상담사 선택', desc: '원하는 분야의 전문 상담사를 둘러보세요' },
  { num: '02', title: '시간 예약', desc: '가능한 시간대 중 편한 때를 선택하세요' },
  { num: '03', title: '안전한 결제', desc: 'PortOne 통합결제로 간편하게' },
  { num: '04', title: '1:1 상담 시작', desc: '예약 시간에 상담방이 자동 개설됩니다' },
];

const footerLinks: Record<string, { label: string; href: string }[]> = {
  서비스: [
    { label: '상담사 보기', href: '/counselors' },
    { label: '예약하기', href: '/counselors' },
    { label: '캐시 충전', href: '/wallet' },
  ],
  고객지원: [
    { label: '이메일 문의', href: 'mailto:support@cheonjiyeon.com' },
    { label: 'FAQ', href: '/faq' },
    { label: '운영시간: 24시간', href: '#' },
  ],
  '법적 고지': [
    { label: '이용약관', href: '/terms' },
    { label: '개인정보처리방침', href: '/privacy' },
    { label: '사업자 정보', href: '#' },
  ],
};

/* --- Main Component --- */

export default function HomeContent({
  counselors,
  stats,
  featuredReviews,
}: {
  counselors: Counselor[];
  stats: PublicStats;
  featuredReviews: FeaturedReview[];
}) {
  const [mounted, setMounted] = useState(false);
  const [statsRef, statsVisible] = useInView();

  useEffect(() => {
    document.documentElement.classList.add('js-anim');
    const t = setTimeout(() => setMounted(true), 100);
    return () => {
      clearTimeout(t);
      document.documentElement.classList.remove('js-anim');
    };
  }, []);

  const featured = counselors.slice(0, 3);

  // Build trust stats from real data
  const trustStats = [
    { target: stats.totalCounselors || 0, suffix: '명', label: '전문 상담사' },
    { target: stats.totalConsultations || 0, suffix: '건', label: '누적 상담' },
    { target: stats.averageRating || 0, suffix: '점', label: '평균 평점' },
    { target: stats.totalReviews || 0, suffix: '개', label: '이용 후기' },
  ];

  return (
    <main>
      {/* ====== Section 1 — Hero (Full Viewport, Minimal Statement) ====== */}
      <section
        className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 25% 30%, hsl(var(--gold) / 0.03) 0%, transparent 50%), radial-gradient(ellipse at 75% 70%, hsl(var(--dancheong) / 0.03) 0%, transparent 50%)',
        }}
      >
        {/* Decorative gradient orbs — subtle */}
        <div className="absolute top-1/4 left-[12%] w-72 h-72 bg-[hsl(var(--gold)/0.03)] rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/3 right-[8%] w-56 h-56 bg-[hsl(var(--dancheong)/0.04)] rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite_-3s]" />

        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 flex flex-col items-center relative z-[1] py-20">
          {/* Asymmetric whitespace — extra top margin on desktop */}
          <div className="md:mt-8" />

          <h1
            className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-[0.15em] m-0 bg-gradient-to-r from-[hsl(var(--gold))] via-[hsl(var(--text-primary))] to-[hsl(var(--gold))] bg-clip-text text-transparent text-center font-heading`}
            style={{ animationDelay: '0s' }}
          >
            천지연꽃신당
          </h1>

          <p
            className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(0.75rem,1.5vw,1rem)] text-[hsl(var(--text-secondary))] tracking-[0.4em] mt-4 font-heading text-center`}
            style={{ animationDelay: '0.25s' }}
          >
            天地蓮花神堂
          </p>

          <p
            className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(1rem,2.2vw,1.2rem)] text-[hsl(var(--gold))] mt-8 font-heading font-medium text-center`}
            style={{ animationDelay: '0.5s' }}
          >
            당신의 운명, 꽃처럼 피어나는 순간
          </p>

          <p
            className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(0.85rem,1.6vw,0.95rem)] text-[hsl(var(--text-secondary))] mt-3 font-heading text-center max-w-md leading-relaxed`}
            style={{ animationDelay: '0.65s' }}
          >
            사주, 타로, 신점 ― 전통의 지혜로 삶의 방향을 찾아드립니다
          </p>

          <div
            className={`fade-up ${mounted ? 'visible' : ''} flex justify-center gap-4 mt-10 flex-wrap`}
            style={{ animationDelay: '0.85s' }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-heading font-bold hover:scale-[1.02] active:scale-[0.98] text-base px-8 py-4 h-auto shadow-[0_4px_24px_hsl(var(--gold)/0.25)] hover:shadow-[0_6px_32px_hsl(var(--gold)/0.35)] transition-all"
            >
              <Link href="/fortune">무료 오늘의 운세 보기</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border border-[hsl(var(--border-accent))] text-[hsl(var(--gold))] font-heading font-bold hover:bg-[hsl(var(--gold)/0.08)] text-base px-8 py-4 h-auto bg-transparent transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href="/counselors">상담 예약하기</Link>
            </Button>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className={`fade-up scroll-hint ${mounted ? 'visible' : ''} absolute bottom-8 text-[hsl(var(--text-muted))] text-sm text-center left-0 right-0`}
          style={{ animationDelay: '1.4s' }}
        >
          ↓ 스크롤하여 더 알아보기
        </div>
      </section>

      {/* ====== Section 2 — Fortune Card ====== */}
      <section className="py-16 px-6">
        <FortuneCard />
      </section>

      {/* ====== Section 3 — Value Props: Bento Grid ====== */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-medium bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
                왜 천지연꽃신당인가
              </span>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-heading font-black tracking-tight m-0 mt-4 text-[hsl(var(--text-primary))]">
                전통의 지혜, 현대의 편리함
              </h2>
            </div>
          </FadeIn>

          {/* Bento: first card 2-col left, 2 cards stacked right */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5">
            {/* Large featured card */}
            <FadeIn delay={0.1} className="md:row-span-2">
              <Card className="h-full p-8 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center mb-5">
                  <span className="text-lg font-heading font-black text-[hsl(var(--gold))]">
                    {valueProps[0].icon}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xl m-0 mb-3 text-[hsl(var(--text-primary))]">
                  {valueProps[0].title}
                </h3>
                <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed break-keep">
                  {valueProps[0].desc}
                </p>
              </Card>
            </FadeIn>

            {/* Two stacked cards on the right */}
            {valueProps.slice(1).map((prop, i) => (
              <FadeIn key={prop.title} delay={0.2 + 0.1 * i}>
                <Card className="p-6 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center mb-4">
                    <span className="text-lg font-heading font-black text-[hsl(var(--gold))]">
                      {prop.icon}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base m-0 mb-2 text-[hsl(var(--text-primary))]">
                    {prop.title}
                  </h3>
                  <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed break-keep">
                    {prop.desc}
                  </p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Section 4 — How It Works: Horizontal Steps ====== */}
      <section className="py-24 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-medium bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
                이용 방법
              </span>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-heading font-black tracking-tight m-0 mt-4 text-[hsl(var(--text-primary))]">
                간단한 4단계로 시작하세요
              </h2>
            </div>
          </FadeIn>

          {/* Mobile: vertical timeline | Desktop: 4-column with connecting line */}

          {/* Desktop layout */}
          <div className="hidden md:block relative">
            {/* Connecting line */}
            <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-[hsl(var(--border-accent)/0.4)]" />

            <div className="grid grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <FadeIn key={step.num} delay={0.12 * (i + 1)} className="text-center relative z-[1]">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--gold)/0.6)] mb-5">
                    <span className="text-lg font-heading font-black text-[hsl(var(--gold))]">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-[hsl(var(--text-primary))] text-base m-0 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed break-keep">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Mobile layout — vertical timeline */}
          <div className="md:hidden relative pl-10">
            {/* Vertical line */}
            <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[hsl(var(--border-accent)/0.4)]" />

            <div className="flex flex-col gap-10">
              {steps.map((step, i) => (
                <FadeIn key={step.num} delay={0.12 * (i + 1)} className="relative">
                  {/* Circle on the line */}
                  <div className="absolute -left-10 top-0 w-9 h-9 rounded-full bg-[hsl(var(--background))] border-2 border-[hsl(var(--gold)/0.6)] flex items-center justify-center">
                    <span className="text-xs font-heading font-black text-[hsl(var(--gold))]">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-[hsl(var(--text-primary))] text-base m-0 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed break-keep">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== Section 5 — Featured Counselors: Spotlight Layout ====== */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          <FadeIn>
            <div className="text-center mb-14">
              <span className="inline-block rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-medium bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
                상담사 소개
              </span>
              <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-heading font-black tracking-tight m-0 mt-4 text-[hsl(var(--text-primary))]">
                지금 상담 가능한 선생님
              </h2>
            </div>
          </FadeIn>

          {featured.length >= 3 ? (
            <>
              {/* Spotlight: 1 large left + 2 small stacked right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Large spotlight card */}
                <FadeIn delay={0.1} className="md:row-span-2">
                  <Card className="h-full p-8 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--dancheong)/0.1)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center mb-4">
                      <span className="text-2xl font-heading font-black text-[hsl(var(--gold))]">
                        {counselorIcons[0]}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-xl m-0 mb-1 text-[hsl(var(--text-primary))]">
                      {featured[0].name}
                    </h3>
                    <div className="text-[hsl(var(--text-secondary))] text-sm font-medium mb-3">
                      {featured[0].specialty}
                    </div>
                    <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed mb-5 break-keep">
                      {featured[0].intro}
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full font-heading font-bold px-6 border-[hsl(var(--border-accent))] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Link href={`/counselors/${featured[0].id}`}>프로필 보기</Link>
                    </Button>
                  </Card>
                </FadeIn>

                {/* Two smaller cards stacked */}
                {featured.slice(1, 3).map((c, i) => (
                  <FadeIn key={c.id} delay={0.2 + 0.1 * i}>
                    <Card className="p-6 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--dancheong)/0.1)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center shrink-0">
                          <span className="text-lg font-heading font-black text-[hsl(var(--gold))]">
                            {counselorIcons[(i + 1) % counselorIcons.length]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-base m-0 mb-0.5 text-[hsl(var(--text-primary))]">
                            {c.name}
                          </h3>
                          <div className="text-[hsl(var(--text-secondary))] text-sm font-medium mb-2">
                            {c.specialty}
                          </div>
                          <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed line-clamp-2 mb-3 break-keep">
                            {c.intro}
                          </p>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-full font-heading font-bold px-5 text-xs border-[hsl(var(--border-accent))] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <Link href={`/counselors/${c.id}`}>프로필 보기</Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.5} className="text-center mt-10">
                <Link
                  href="/counselors"
                  className="text-[hsl(var(--gold))] font-heading font-bold text-base hover:underline"
                >
                  전체 상담사 보기 →
                </Link>
              </FadeIn>
            </>
          ) : featured.length > 0 ? (
            <>
              {/* Fallback: simple grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featured.map((c, i) => (
                  <FadeIn key={c.id} delay={0.1 * (i + 1)}>
                    <Card className="p-6 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--dancheong)/0.1)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center mb-3">
                        <span className="text-xl font-heading font-black text-[hsl(var(--gold))]">
                          {counselorIcons[i % counselorIcons.length]}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-xl m-0 mb-1 text-[hsl(var(--text-primary))]">
                        {c.name}
                      </h3>
                      <div className="text-[hsl(var(--text-secondary))] text-sm font-medium mb-3">
                        {c.specialty}
                      </div>
                      <p className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed line-clamp-2 mb-4 break-keep">
                        {c.intro}
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full font-heading font-bold px-6 border-[hsl(var(--border-accent))] text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.08)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <Link href={`/counselors/${c.id}`}>프로필 보기</Link>
                      </Button>
                    </Card>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.5} className="text-center mt-10">
                <Link
                  href="/counselors"
                  className="text-[hsl(var(--gold))] font-heading font-bold text-base hover:underline"
                >
                  전체 상담사 보기 →
                </Link>
              </FadeIn>
            </>
          ) : (
            <FadeIn className="text-center">
              <p className="text-[hsl(var(--text-secondary))] mb-4">
                상담사 정보를 불러오는 중입니다.
              </p>
              <Link
                href="/counselors"
                className="text-[hsl(var(--gold))] font-heading font-bold hover:underline"
              >
                상담사 페이지로 이동 →
              </Link>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ====== Section 6 — Trust Metrics: Horizontal Glass Strip ====== */}
      <section className="py-6 px-6">
        <div
          ref={statsRef}
          className="max-w-[1200px] mx-auto px-6 sm:px-8 rounded-2xl py-10 bg-[hsl(var(--surface)/0.6)] backdrop-blur-xl border border-[hsl(var(--border-accent)/0.2)]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
            {trustStats.map((stat, i) => (
              <div
                key={stat.label}
                className={`py-4 ${i < trustStats.length - 1 ? 'md:border-r md:border-[hsl(var(--border-subtle)/0.5)]' : ''} ${i % 2 === 0 && i < trustStats.length - 1 ? 'border-r border-[hsl(var(--border-subtle)/0.5)] md:border-r' : ''}`}
              >
                <CountUpNumber
                  target={stat.target}
                  suffix={stat.suffix}
                  label={stat.label}
                  start={statsVisible}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Section 7 — Reviews: Staggered Cards ====== */}
      {featuredReviews.length > 0 && (
        <section className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
            <FadeIn>
              <div className="text-center mb-14">
                <span className="inline-block rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.15em] font-medium bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]">
                  고객 후기
                </span>
                <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-heading font-black tracking-tight m-0 mt-4 text-[hsl(var(--text-primary))]">
                  실제 이용 후기
                </h2>
              </div>
            </FadeIn>

            {/* Staggered cards — show up to 3 at once */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {featuredReviews.slice(0, 3).map((review, i) => (
                <FadeIn
                  key={review.id}
                  delay={0.15 * (i + 1)}
                  className={i === 1 ? 'md:mt-8' : i === 2 ? 'md:mt-4' : ''}
                >
                  <Card className="p-6 border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
                    <StarRating rating={review.rating} />
                    <p className="text-[hsl(var(--text-primary))] text-sm sm:text-base leading-relaxed mt-4 mb-5 break-keep">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    <div className="text-sm text-[hsl(var(--text-secondary))]">
                      <span className="font-heading font-bold text-[hsl(var(--text-primary))]">
                        {review.authorName}
                      </span>
                      {review.counselorName && (
                        <span> &middot; {review.counselorName} 상담사</span>
                      )}
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== Section 8 — Final CTA (Full-Bleed) ====== */}
      <section
        className="py-32 md:py-40 px-6 text-center relative overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(var(--gold) / 0.08) 0%, transparent 60%)',
        }}
      >
        {/* Top gold gradient line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.25)] to-transparent" />

        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 text-center relative z-[1]">
          <FadeIn>
            <h2 className="font-heading font-black text-[clamp(2rem,5vw,3.5rem)] tracking-tight text-[hsl(var(--gold))] m-0 mb-4 text-center leading-tight">
              지금 바로 운명의 꽃을
              <br className="hidden sm:block" /> 피워보세요
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-[hsl(var(--text-secondary))] text-lg leading-relaxed mb-10 max-w-[520px] mx-auto text-center break-keep">
              첫 상담 예약은 간단합니다. 상담사를 선택하고 원하는 시간에 예약하세요.
            </p>
          </FadeIn>
          <FadeIn delay={0.4} className="flex justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-heading font-bold hover:scale-[1.02] active:scale-[0.98] text-lg px-14 py-5 h-auto shadow-[0_4px_30px_hsl(var(--gold)/0.25)] hover:shadow-[0_8px_40px_hsl(var(--gold)/0.4)] transition-all duration-500"
            >
              <Link href="/signup">무료로 시작하기</Link>
            </Button>
          </FadeIn>
        </div>

        {/* Bottom gold gradient line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.25)] to-transparent" />
      </section>

      {/* ====== Section 9 — Footer: 2-Column ====== */}
      <footer className="py-14 px-6 bg-[hsl(var(--surface))]">
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8">
          {/* 2-column: brand left | links right */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 mb-10">
            {/* Brand story */}
            <div>
              <span className="font-heading font-bold text-lg text-[hsl(var(--gold))]">
                천지연꽃신당
              </span>
              <p className="text-[hsl(var(--text-muted))] text-sm mt-3 leading-relaxed break-keep max-w-xs">
                전통의 지혜로 당신의 삶에 빛을 더합니다
              </p>
            </div>

            {/* Link groups in row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              {Object.entries(footerLinks).map(([category, links]) => (
                <div key={category}>
                  <h4 className="font-heading font-bold text-[hsl(var(--text-primary))] text-sm m-0 mb-3">
                    {category}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {links.map((link) => (
                      <Link
                        key={link.label}
                        href={link.href}
                        className="text-[hsl(var(--text-muted))] text-sm hover:text-[hsl(var(--gold))] transition-colors no-underline hover:no-underline"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright bar */}
          <div className="border-t border-[hsl(var(--border-subtle))] pt-5">
            <p className="text-[hsl(var(--text-muted))] text-xs text-center">
              © 2026 천지연꽃신당. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
