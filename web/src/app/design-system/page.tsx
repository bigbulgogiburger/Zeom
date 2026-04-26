import { notFound } from 'next/navigation';
import { BreathingOrb, Dot, EmptyState, GlowCard, Portrait, ProgressSteps, Seg, Stars, Timer, WalletChip } from '@/components/design';
import { DesignSystemSegDemo } from './seg-demo';
import { P2Demo } from './p2-demo';
import { Sparkles } from 'lucide-react';

export const metadata = {
  title: '디자인 시스템 카탈로그',
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 space-y-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-heading">디자인 시스템 카탈로그</h1>
        <p className="text-text-secondary text-sm">
          Phase 1 — Primitive 단위 렌더 점검 (개발 환경 전용)
        </p>
      </header>

      <Section title="Dot (P0)" desc="상태 점 — color, pulse">
        <div className="flex flex-wrap items-center gap-4">
          <DotLabel label="gold"><Dot color="gold" /></DotLabel>
          <DotLabel label="success"><Dot color="success" /></DotLabel>
          <DotLabel label="warning"><Dot color="warning" /></DotLabel>
          <DotLabel label="destructive"><Dot color="destructive" /></DotLabel>
          <DotLabel label="jade"><Dot color="jade" /></DotLabel>
          <DotLabel label="muted"><Dot color="muted" /></DotLabel>
          <DotLabel label="pulse"><Dot color="gold" pulse /></DotLabel>
          <DotLabel label="size 12"><Dot color="success" size={12} /></DotLabel>
        </div>
      </Section>

      <Section title="Portrait (P0)" desc="상담사 원형 아바타 — sm/md/lg/xl">
        <div className="flex flex-wrap items-end gap-6">
          {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Portrait counselor={{ name: '김' }} size={size} />
              <span className="text-xs text-text-muted">{size}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Stars (P0)" desc="별점 표시 — 0.5 단위">
        <div className="flex flex-col gap-2">
          <Stars value={5} />
          <Stars value={4.5} />
          <Stars value={3.0} />
          <Stars value={1.5} />
          <Stars value={0} />
          <Stars value={4.7} size={20} />
        </div>
      </Section>

      <Section title="WalletChip (P0)" desc="useWallet 훅 — 로그인 시 잔액 표시">
        <WalletChip hideWhenAnonymous={false} />
      </Section>

      <Section title="Seg (P0)" desc="세그먼트 컨트롤 — items, value, onChange">
        <DesignSystemSegDemo />
      </Section>

      <Section title="GlowCard (P1)" desc=".glow-card 유틸 베이스 — padding sm/md/lg/none">
        <div className="grid gap-4 sm:grid-cols-2">
          {(['sm', 'md', 'lg'] as const).map((p) => (
            <GlowCard key={p} padding={p}>
              <p className="text-sm text-text-secondary">padding={p}</p>
              <h3 className="mt-1 text-lg font-heading text-text-primary">금빛 카드</h3>
            </GlowCard>
          ))}
        </div>
      </Section>

      <Section title="ProgressSteps (P1)" desc="단계 진행 — current index">
        <div className="space-y-4">
          {[0, 1, 2].map((cur) => (
            <ProgressSteps
              key={cur}
              current={cur}
              steps={[
                { key: 'a', label: '예약' },
                { key: 'b', label: '결제' },
                { key: 'c', label: '상담' },
              ]}
            />
          ))}
        </div>
      </Section>

      <Section title="EmptyState (P1)" desc="icon? title body cta? + variant empty/error">
        <div className="grid gap-6 sm:grid-cols-2">
          <EmptyState
            icon={<Sparkles size={36} />}
            title="아직 예약이 없어요"
            body="상담사를 둘러보고 첫 만남을 시작해보세요."
            cta={{ label: '상담사 보기', href: '/counselors' }}
          />
          <EmptyState
            variant="error"
            title="불러오지 못했어요"
            body="네트워크 상태를 확인하고 다시 시도해주세요."
            cta={{ label: '다시 시도', onClick: () => {} }}
          />
        </div>
      </Section>

      <Section title="Timer (P1)" desc="남은 시간 mm:ss — tabular, role=timer, ≤30s에 destructive 색">
        <div className="flex flex-wrap items-center gap-6">
          <Timer start={Date.now()} total={120} />
          <Timer start={Date.now() - 95 * 1000} total={120} />
          <Timer start={Date.now() - 130 * 1000} total={120} />
        </div>
      </Section>

      <Section title="BreathingOrb (P2)" desc=".breathe 유틸 — accent gold/jade/lotus/dancheong">
        <div className="flex flex-wrap items-center gap-8">
          <BreathingOrb accent="gold" />
          <BreathingOrb accent="jade" />
          <BreathingOrb accent="lotus" initial={72} />
          <BreathingOrb accent="dancheong" initial={120} />
        </div>
      </Section>

      <Section title="P2 Interactive" desc="FabBtn / MicLevelMeter / StarRating / TagToggle / ChatPanel">
        <P2Demo />
      </Section>
    </main>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-heading">{title}</h2>
        <p className="text-sm text-text-secondary">{desc}</p>
      </div>
      <div className="rounded-[14px] border border-border-subtle bg-surface p-5">{children}</div>
    </section>
  );
}

function DotLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
      {children}
      <span>{label}</span>
    </span>
  );
}
