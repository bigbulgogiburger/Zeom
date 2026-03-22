'use client';

import { cn } from '@/lib/utils';

export type SortOption = {
  key: string;
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { key: 'recommended', label: '추천순' },
  { key: 'rating', label: '평점순' },
  { key: 'reviews', label: '리뷰순' },
  { key: 'price_asc', label: '가격 낮은순' },
  { key: 'price_desc', label: '가격 높은순' },
];

export default function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (sort: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'bg-[hsl(var(--surface))] border border-[hsl(var(--gold)/0.15)] rounded-xl px-4 py-2.5',
        'text-sm font-heading font-medium text-[hsl(var(--text-primary))]',
        'focus:ring-2 focus:ring-[hsl(var(--gold))]/30 focus:border-[hsl(var(--gold))]/40',
        'cursor-pointer min-w-[140px]'
      )}
    >
      {SORT_OPTIONS.map((opt) => (
        <option key={opt.key} value={opt.key}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export { SORT_OPTIONS };
