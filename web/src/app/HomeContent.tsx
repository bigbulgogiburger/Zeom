'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Card } from '../components/ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <div className="text-[clamp(2rem,5vw,3rem)] font-black font-heading text-primary leading-tight">
        {value}
        {suffix}
      </div>
      <div className="text-sm text-card-foreground mt-1 font-heading font-medium">
        {label}
      </div>
    </div>
  );
}

/* --- Data --- */

const counselorEmojis = ['\u{1FAB7}', '\uD83C\uDF19', '\u2728', '\uD83D\uDD2E', '\uD83C\uDF38', '\u262F\uFE0F'];

const valueProps = [
  {
    emoji: '\u{1FAB7}',
    title: '검증된 상담사',
    desc: '엄선된 전문가가 전통 점술의 지혜로 당신의 길을 밝혀드립니다',
  },
  {
    emoji: '\uD83D\uDD12',
    title: '안전한 결제',
    desc: 'PortOne 통합결제로 안심하고 간편하게 결제하세요',
  },
  {
    emoji: '\uD83D\uDCAC',
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

const trustStats = [
  { target: 3, suffix: '명', label: '전문 상담사' },
  { target: 39, suffix: '슬롯', label: '예약 가능' },
  { target: 24, suffix: '시간', label: '연중무휴' },
  { target: 100, suffix: '%', label: '비밀 보장' },
];

const footerLinks: Record<string, { label: string; href: string }[]> = {
  서비스: [
    { label: '상담사 보기', href: '/counselors' },
    { label: '예약하기', href: '/counselors' },
    { label: '캐시 충전', href: '/wallet' },
  ],
  고객지원: [
    { label: '이메일 문의', href: 'mailto:support@cheonjiyeon.com' },
    { label: 'FAQ', href: '#' },
    { label: '운영시간: 24시간', href: '#' },
  ],
  '법적 고지': [
    { label: '이용약관', href: '#' },
    { label: '개인정보처리방침', href: '#' },
    { label: '사업자 정보', href: '#' },
  ],
};

/* --- Main Component --- */

export default function HomeContent({ counselors }: { counselors: Counselor[] }) {
  const [mounted, setMounted] = useState(false);
  const [statsRef, statsVisible] = useInView();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const featured = counselors.slice(0, 3);

  return (
    <main>
      {/* Section 1 -- Hero (Full Viewport) */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-background relative"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.06) 0%, transparent 70%)' }}
      >
        <h1
          className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(2.5rem,6vw,4.5rem)] font-heading font-black tracking-[0.3em] text-foreground m-0`}
          style={{ animationDelay: '0s' }}
        >
          천지연꽃신당
        </h1>

        <p
          className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(0.9rem,2vw,1.2rem)] text-muted-foreground tracking-[0.5em] mt-6 font-heading`}
          style={{ animationDelay: '0.3s' }}
        >
          天 地 蓮 花 神 堂
        </p>

        <p
          className={`fade-up ${mounted ? 'visible' : ''} text-[clamp(1rem,2.5vw,1.25rem)] text-primary mt-8 font-heading`}
          style={{ animationDelay: '0.6s' }}
        >
          당신의 운명, 꽃처럼 피어나는 순간
        </p>

        <div
          className={`fade-up ${mounted ? 'visible' : ''} flex gap-4 mt-8 flex-wrap justify-center`}
          style={{ animationDelay: '0.9s' }}
        >
          <Button asChild size="lg" className="bg-primary text-primary-foreground font-heading font-bold hover:bg-primary/90 text-base px-8 py-4 h-auto">
            <Link href="/counselors">
              상담 예약하기
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-2 border-foreground/30 text-foreground font-heading font-bold hover:border-primary hover:text-primary text-base px-8 py-4 h-auto bg-transparent">
            <Link href="/counselors">
              상담사 보기
            </Link>
          </Button>
        </div>

        <div
          className={`fade-up scroll-hint ${mounted ? 'visible' : ''} absolute bottom-8 text-muted-foreground text-sm`}
          style={{ animationDelay: '1.5s' }}
        >
          ↓ 스크롤하여 더 알아보기
        </div>
      </section>

      {/* Section 2 -- 가치 제안 (Value Proposition) */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-[1200px] mx-auto">
          <FadeIn>
            <h2 className="text-2xl font-heading font-bold text-center pb-8 m-0 text-foreground">
              전통의 지혜, 현대의 편리함
            </h2>
          </FadeIn>

          <div className="landing-grid-3">
            {valueProps.map((prop, i) => (
              <FadeIn key={prop.title} delay={0.1 * (i + 1)}>
                <Card className="text-center landing-card">
                  <div className="text-5xl mb-4">
                    {prop.emoji}
                  </div>
                  <h3 className="font-heading font-bold text-lg m-0 mb-2">
                    {prop.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {prop.desc}
                  </p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3 -- 이용 절차 (How It Works) */}
      <section className="py-16 px-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1200px] mx-auto">
          <FadeIn>
            <h2 className="text-2xl font-heading font-bold text-center pb-8 m-0 text-foreground">
              간단한 4단계로 시작하세요
            </h2>
          </FadeIn>

          <div className="relative">
            <div className="steps-line" />

            <div className="landing-grid-4">
              {steps.map((step, i) => (
                <FadeIn
                  key={step.num}
                  delay={0.15 * (i + 1)}
                  className="text-center relative z-[1]"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-bg-secondary)] border-2 border-primary mb-4">
                    <span className="text-xl font-heading font-black text-primary">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-base m-0 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 -- 상담사 소개 (Featured Counselors) */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-[1200px] mx-auto">
          <FadeIn>
            <h2 className="text-2xl font-heading font-bold text-center pb-8 m-0 text-foreground">
              지금 상담 가능한 선생님
            </h2>
          </FadeIn>

          {featured.length > 0 ? (
            <>
              <div className="landing-grid-3">
                {featured.map((c, i) => (
                  <FadeIn key={c.id} delay={0.1 * (i + 1)}>
                    <Card className="landing-card">
                      <div className="text-[2.5rem] mb-3">
                        {counselorEmojis[i % counselorEmojis.length]}
                      </div>
                      <h3 className="font-heading font-bold text-xl m-0 mb-1">
                        {c.name}
                      </h3>
                      <div className="text-muted-foreground text-sm font-medium mb-3">
                        {c.specialty}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-4">
                        {c.intro}
                      </p>
                      <Button asChild variant="outline" size="sm" className="font-heading font-bold">
                        <Link href={`/counselors/${c.id}`}>
                          프로필 보기
                        </Link>
                      </Button>
                    </Card>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.5} className="text-center mt-8">
                <Link
                  href="/counselors"
                  className="text-primary font-heading font-bold text-base"
                >
                  전체 상담사 보기 →
                </Link>
              </FadeIn>
            </>
          ) : (
            <FadeIn className="text-center">
              <p className="text-muted-foreground mb-4">
                상담사 정보를 불러오는 중입니다.
              </p>
              <Link
                href="/counselors"
                className="text-primary font-heading font-bold"
              >
                상담사 페이지로 이동 →
              </Link>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Section 5 -- 신뢰 지표 (Trust Metrics) */}
      <section className="py-16 px-6 bg-card">
        <div ref={statsRef} className="max-w-[1200px] mx-auto">
          <div className="landing-grid-stats">
            {trustStats.map((stat) => (
              <CountUpNumber
                key={stat.label}
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                start={statsVisible}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Section 6 -- 최종 CTA */}
      <section
        className="py-16 px-6 bg-background text-center"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.08) 0%, transparent 70%)' }}
      >
        <div className="max-w-[1200px] mx-auto">
          <FadeIn>
            <h2 className="font-heading font-black text-2xl text-primary m-0 mb-4">
              지금 바로 운명의 꽃을 피워보세요
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-[480px] mx-auto">
              첫 상담 예약은 간단합니다. 상담사를 선택하고 원하는 시간에 예약하세요.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-heading font-bold hover:bg-primary/90 text-lg px-12 py-4 h-auto">
              <Link href="/signup">
                무료로 시작하기
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* Section 7 -- Footer */}
      <footer className="py-16 px-6 pb-6 bg-[var(--color-bg-secondary)]">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-8">
            <span className="font-heading font-bold text-foreground text-lg">
              천지연꽃신당
            </span>
          </div>

          <div className="footer-grid">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-heading font-bold text-foreground text-sm m-0 mb-3">
                  {category}
                </h4>
                {links.map((link) => (
                  <Link key={link.label} href={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t border-border mt-8 pt-4">
            <p className="text-muted-foreground text-xs">
              © 2026 천지연꽃신당. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
