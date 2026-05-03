'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

type Strength = 0 | 1 | 2 | 3 | 4;

interface Rubric {
  score: Strength;
  label: string;
  segmentClass: string;
}

const rubric: ReadonlyArray<Rubric> = [
  { score: 0, label: '입력 안 됨', segmentClass: 'bg-[hsl(var(--border-subtle))]' },
  { score: 1, label: '약함', segmentClass: 'bg-[hsl(var(--dancheong))]' },
  { score: 2, label: '보통', segmentClass: 'bg-[hsl(var(--warning))]' },
  { score: 3, label: '강함', segmentClass: 'bg-[hsl(var(--gold-soft))]' },
  { score: 4, label: '매우 강함', segmentClass: 'bg-[hsl(var(--gold))]' },
];

function calculate(password: string): Strength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;
  if (variety >= 2) score += 1;
  if (variety >= 3) score += 1;
  if (/(.)\1{2,}/.test(password)) score = Math.max(0, score - 1);
  return Math.min(4, Math.max(1, score)) as Strength;
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculate(password), [password]);
  const meta = rubric[strength];

  return (
    <div className={cn('mt-2', className)} aria-live="polite">
      <div className="flex gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((seg) => {
          const filled = seg <= strength;
          return (
            <div
              key={seg}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-200 motion-reduce:transition-none',
                filled
                  ? meta.segmentClass
                  : 'bg-[hsl(var(--border-subtle))]',
              )}
            />
          );
        })}
      </div>
      <p
        className={cn(
          'mt-1.5 text-xs',
          strength === 0 && 'text-[hsl(var(--text-muted))]',
          strength === 1 && 'text-[hsl(var(--dancheong))]',
          strength === 2 && 'text-[hsl(var(--warning))]',
          (strength === 3 || strength === 4) && 'text-[hsl(var(--gold))]',
        )}
      >
        비밀번호 강도: {meta.label}
      </p>
    </div>
  );
}
