'use client';

import { cn } from '@/lib/utils';
import { trackEvent } from '../../../components/analytics';

export type SpecialtyFilter = {
  key: string;
  label: string;
};

export default function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  isOnlineOnly,
  onOnlineToggle,
}: {
  filters: SpecialtyFilter[];
  activeFilters: Set<string>;
  onFilterChange: (key: string) => void;
  isOnlineOnly: boolean;
  onOnlineToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {filters.map((f) => (
        <button
          key={f.key}
          onClick={() => {
            onFilterChange(f.key);
            trackEvent('search_counselor', { filter: f.key });
          }}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-medium font-heading transition-all duration-300',
            activeFilters.has(f.key)
              ? 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] text-[hsl(var(--background))] font-bold shadow-[0_4px_20px_hsl(var(--gold)/0.15)]'
              : 'border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--text-secondary))] bg-transparent hover:bg-[hsl(var(--gold))]/10 hover:text-[hsl(var(--gold))] hover:border-[hsl(var(--gold))]/30'
          )}
        >
          {f.label}
        </button>
      ))}

      {/* Online toggle */}
      <button
        onClick={onOnlineToggle}
        className={cn(
          'rounded-full px-5 py-2 text-sm font-medium font-heading transition-all duration-300 flex items-center gap-1.5',
          isOnlineOnly
            ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 font-bold'
            : 'border border-[hsl(var(--gold)/0.2)] text-[hsl(var(--text-secondary))] bg-transparent hover:bg-[#22c55e]/10 hover:text-[#22c55e] hover:border-[#22c55e]/30'
        )}
      >
        <span className={cn(
          'w-2 h-2 rounded-full',
          isOnlineOnly ? 'bg-[#22c55e]' : 'bg-[hsl(var(--text-secondary))]'
        )} />
        지금 상담 가능
      </button>
    </div>
  );
}
