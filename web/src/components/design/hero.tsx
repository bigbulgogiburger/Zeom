import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeroProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}

/**
 * Hero — ZEOM-19 P1-2 home landing.
 * CSS-only radial gold/dancheong background (no <img>) → LCP friendly.
 * Fixed min-height to keep CLS ≤ 0.05.
 */
export function Hero({ title, subtitle, ctaLabel, ctaHref, className }: HeroProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden py-20 sm:py-28 min-h-[480px]',
        className,
      )}
    >
      {/* Decorative radial gradient layer — token only, no hex */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 25% 30%, hsl(var(--gold) / 0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 70%, hsl(var(--dancheong) / 0.08) 0%, transparent 55%)',
        }}
      />
      {/* Soft lotus orb — decorative, hidden under reduced motion */}
      <div
        aria-hidden="true"
        className="motion-reduce:hidden pointer-events-none absolute -z-10 top-1/4 left-[12%] w-72 h-72 rounded-full blur-3xl bg-[hsl(var(--gold)/0.06)]"
      />

      <div className="max-w-[960px] mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
        <h1
          className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-balance text-[hsl(var(--text-primary))] m-0"
          style={{ wordBreak: 'keep-all' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-5 text-base sm:text-lg text-[hsl(var(--text-secondary))] max-w-xl leading-relaxed"
            style={{ wordBreak: 'keep-all' }}
          >
            {subtitle}
          </p>
        )}
        <div className="mt-8">
          <Button asChild size="lg" variant="gold-grad" className="rounded-full font-heading font-bold px-10">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
