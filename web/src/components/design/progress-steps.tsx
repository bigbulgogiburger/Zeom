import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  key: string;
  label: string;
}

interface ProgressStepsProps {
  steps: ReadonlyArray<ProgressStep>;
  current: number;
  className?: string;
}

export function ProgressSteps({ steps, current, className }: ProgressStepsProps) {
  return (
    <ol
      className={cn('progress-steps', className)}
      aria-label={`진행 ${Math.min(current + 1, steps.length)} / ${steps.length}`}
    >
      {steps.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                done && 'bg-gold border-gold text-background',
                active && 'border-gold text-gold animate-pulse',
                !done && !active && 'border-border-subtle text-text-muted',
              )}
              aria-current={active ? 'step' : undefined}
            >
              {done ? <Check size={12} strokeWidth={3} /> : <span className="tabular">{idx + 1}</span>}
            </span>
            <span
              className={cn(
                'text-sm',
                active ? 'text-text-primary font-medium' : 'text-text-secondary',
              )}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'mx-1 h-px w-6 sm:w-10',
                  done ? 'bg-gold' : 'bg-border-subtle',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
