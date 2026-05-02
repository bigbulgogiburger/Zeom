import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { GlowCard } from './glow-card';
import { cn } from '@/lib/utils';

export interface CategoryItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  className?: string;
}

/**
 * CategoryGrid — 4–6 glow-card tiles for fortune categories.
 */
export function CategoryGrid({ categories, className }: CategoryGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4',
        className,
      )}
    >
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.id}
            href={cat.href}
            className="block transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          >
            <GlowCard
              padding="sm"
              className="h-full min-h-[96px] flex flex-col items-center justify-center text-center gap-2"
            >
              {Icon && (
                <Icon
                  aria-hidden="true"
                  className="w-6 h-6 text-[hsl(var(--gold))]"
                />
              )}
              <span
                className="font-heading font-medium text-sm text-[hsl(var(--text-primary))]"
                style={{ wordBreak: 'keep-all' }}
              >
                {cat.label}
              </span>
            </GlowCard>
          </Link>
        );
      })}
    </div>
  );
}
