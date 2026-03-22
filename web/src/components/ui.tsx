'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card as ShadcnCard, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  AlertCircle,
  Package,
  ArrowRight,
  XCircle,
  Check,
  Clock,
  Loader2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

/* ===== StatusBadge ===== */

const STATUS_CONFIG: Record<string, { label: string; type: 'success' | 'warning' | 'destructive' }> = {
  PAID: { label: '결제완료', type: 'success' },
  BOOKED: { label: '예약됨', type: 'success' },
  OPEN: { label: '열림', type: 'success' },
  AUTH_LOGIN: { label: '로그인', type: 'success' },
  AUTH_SIGNUP: { label: '가입', type: 'success' },
  AUTH_ADMIN_LOGIN: { label: '관리자 로그인', type: 'success' },
  CHARGE: { label: '충전', type: 'success' },
  REFUND: { label: '환불', type: 'success' },
  COMPLETED: { label: '완료', type: 'success' },
  CONFIRM: { label: '사용', type: 'warning' },
  PENDING: { label: '대기중', type: 'warning' },
  USE: { label: '사용', type: 'warning' },
  IN_PROGRESS: { label: '진행중', type: 'warning' },
  CANCELED: { label: '취소됨', type: 'destructive' },
  FAILED: { label: '실패', type: 'destructive' },
  PAYMENT_FAILED: { label: '결제실패', type: 'destructive' },
  PAYMENT_CANCELED: { label: '결제취소', type: 'destructive' },
  CLOSED: { label: '종료', type: 'destructive' },
  AUTH_LOGIN_FAIL: { label: '로그인 실패', type: 'destructive' },
  AUTH_REFRESH_REUSE_DETECTED: { label: '토큰 재사용', type: 'destructive' },
};

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-[hsl(var(--success))] text-[hsl(35,20%,88%)] hover:bg-[hsl(var(--success))]',
  warning: 'bg-[hsl(var(--warning))] text-[hsl(24,15%,5%)] hover:bg-[hsl(var(--warning))]',
  destructive: 'bg-[hsl(var(--dancheong))] text-[hsl(35,20%,88%)] hover:bg-[hsl(var(--dancheong))]',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  success: <Check className="size-3" />,
  warning: <Clock className="size-3" />,
  destructive: <XCircle className="size-3" />,
};

export function StatusBadge({ value }: { value: string }) {
  const v = (value || '').toUpperCase();
  const config = STATUS_CONFIG[v];

  const type = config?.type ?? 'warning';
  const label = config?.label ?? (v || 'UNKNOWN');
  const className = STATUS_STYLES[type] ?? '';

  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-heading font-bold text-xs rounded-full inline-flex items-center gap-1',
        className,
      )}
    >
      {STATUS_ICONS[type]}
      {label}
    </Badge>
  );
}

/* ===== Card ===== */

const CARD_VARIANTS = {
  surface: cn(
    'rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]',
    'text-[hsl(var(--text-primary))]',
    'card-hover-glow',
  ),
  glass: cn(
    'rounded-2xl bg-[hsl(var(--surface))/0.6] backdrop-blur-xl',
    'border border-[hsl(var(--border-accent))/0.2]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
    'text-[hsl(var(--text-primary))]',
    'transition-all duration-300',
  ),
  elevated: cn(
    'rounded-2xl bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--background))]',
    'border border-[hsl(var(--border-accent))/0.3]',
    'shadow-[0_8px_32px_hsl(var(--gold)/0.06)]',
    'text-[hsl(var(--text-primary))]',
    'transition-all duration-300',
  ),
};

export function Card({
  children,
  className: extraClass,
  variant = 'surface',
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'surface' | 'glass' | 'elevated';
}) {
  return (
    <ShadcnCard className={cn(CARD_VARIANTS[variant], extraClass)}>
      <CardContent className="p-6 sm:p-8">
        {children}
      </CardContent>
    </ShadcnCard>
  );
}

/* ===== StatCard ===== */

export function StatCard({
  title,
  value,
  hint,
  trend,
}: {
  title: string;
  value: string | number;
  hint?: string;
  trend?: 'up' | 'down';
}) {
  return (
    <Card variant="surface">
      <div className="text-[hsl(var(--gold))] text-sm font-medium mb-2 font-heading">
        {title}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-3xl font-black leading-tight font-heading text-[hsl(var(--text-primary))]">
          {value}
        </div>
        {trend === 'up' && (
          <TrendingUp className="size-5 text-[hsl(var(--success))]" />
        )}
        {trend === 'down' && (
          <TrendingDown className="size-5 text-[hsl(var(--destructive))]" />
        )}
      </div>
      {hint && (
        <div className="text-[hsl(var(--text-secondary))] text-xs mt-1">
          {hint}
        </div>
      )}
    </Card>
  );
}

/* ===== PageTitle ===== */

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 text-3xl leading-tight font-bold font-heading tracking-tight text-[hsl(var(--text-primary))]">
      {children}
    </h2>
  );
}

/* ===== EmptyState ===== */

const EMPTY_STATE_ICONS: Record<string, React.ReactNode> = {
  search: <Search className="size-12 text-[hsl(var(--text-muted))]" />,
  error: <AlertCircle className="size-12 text-[hsl(var(--dancheong))]" />,
  empty: <Package className="size-12 text-[hsl(var(--text-muted))]" />,
};

export function EmptyState({
  title,
  desc,
  icon,
  actionLabel,
  actionHref,
  onAction,
  variant = 'empty',
}: {
  title: string;
  desc?: string;
  icon?: string | React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  variant?: 'empty' | 'error';
}) {
  const isError = variant === 'error';

  // Choose icon: if the caller passed a ReactNode, render it directly;
  // if a string matching a known key, use that; otherwise fall back to variant-based default.
  const isIconNode = icon != null && typeof icon !== 'string';
  const iconKey = typeof icon === 'string' && icon in EMPTY_STATE_ICONS ? icon : (isError ? 'error' : 'empty');
  const renderedIcon = isIconNode ? icon : EMPTY_STATE_ICONS[iconKey];

  return (
    <Card variant="surface">
      <div className="text-center py-8 flex flex-col items-center gap-4 max-w-md mx-auto">
        {renderedIcon && <div>{renderedIcon}</div>}
        <div className={cn(
          'text-lg font-bold font-heading',
          isError ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--text-primary))]',
        )}>
          {title}
        </div>
        {desc && (
          <div className="text-[hsl(var(--text-secondary))] text-sm leading-relaxed max-w-[360px]">
            {desc}
          </div>
        )}
        {actionLabel && (onAction || actionHref) && (
          onAction ? (
            <button
              onClick={onAction}
              className={cn(
                'mt-2 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-bold font-heading transition-all border-none cursor-pointer',
                'hover:scale-[1.02] active:scale-[0.97]',
                isError
                  ? 'bg-[hsl(var(--destructive))] text-[hsl(var(--text-primary))] hover:shadow-[0_4px_20px_hsl(var(--destructive)/0.25)]'
                  : 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(43,55%,55%)] text-[hsl(var(--background))] hover:shadow-[0_4px_24px_hsl(var(--gold)/0.25)]',
              )}
            >
              {actionLabel}
              <ArrowRight className="size-4" />
            </button>
          ) : actionHref ? (
            <Link
              href={actionHref}
              className={cn(
                'mt-2 inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-bold font-heading transition-all no-underline',
                'hover:scale-[1.02] active:scale-[0.97]',
                'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(43,55%,55%)] text-[hsl(var(--background))] hover:shadow-[0_4px_24px_hsl(var(--gold)/0.25)]',
              )}
            >
              {actionLabel}
              <ArrowRight className="size-4" />
            </Link>
          ) : null
        )}
      </div>
    </Card>
  );
}

/* ===== InlineError ===== */

export function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="text-[hsl(var(--destructive))] text-sm font-medium">
      {message}
    </div>
  );
}

/* ===== InlineSuccess ===== */

export function InlineSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="status" className="text-[hsl(var(--success))] text-sm font-medium">
      {message}
    </div>
  );
}

/* ===== ActionButton ===== */

const ACTION_BUTTON_VARIANTS = {
  primary: cn(
    'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(43,55%,55%)] text-[hsl(var(--background))]',
    'hover:scale-[1.02] hover:shadow-[0_4px_24px_hsl(var(--gold)/0.25)]',
    'active:scale-[0.97]',
  ),
  ghost: cn(
    'bg-transparent border-2 border-[hsl(var(--border-accent))] text-[hsl(var(--text-primary))]',
    'hover:bg-[hsl(var(--surface-hover))] hover:scale-[1.02]',
    'active:scale-[0.97]',
  ),
  danger: cn(
    'bg-[hsl(var(--destructive))] text-[hsl(var(--text-primary))]',
    'hover:bg-[hsl(var(--destructive))]/90 hover:scale-[1.02]',
    'active:scale-[0.97]',
  ),
};

export function ActionButton({
  loading,
  children,
  className: extraClass,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  className?: string;
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading ? true : undefined}
      className={cn(
        'min-h-[48px] px-8 py-3 font-bold font-heading rounded-full transition-all duration-200',
        ACTION_BUTTON_VARIANTS[variant],
        extraClass,
      )}
      style={props.style}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          처리 중...
        </span>
      ) : children}
    </Button>
  );
}

/* ===== FormField ===== */
/* Note: Focus label color change to gold requires JS state management
   (e.g., onFocus/onBlur on children). Add a `peer` approach or
   wrap input in a container with group-focus-within if needed. */

export function FormField({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 form-group">
      <label className="block mb-2 font-medium text-sm text-[hsl(var(--text-primary))] transition-colors duration-200">
        {label}
        {required && (
          <span className="text-[hsl(var(--lotus))] ml-1" aria-hidden="true">*</span>
        )}
      </label>
      {children}
      {error && (
        <div role="alert" className="flex items-center gap-1.5 text-[hsl(var(--destructive))] text-xs mt-1.5 font-medium">
          <XCircle className="size-3.5 shrink-0" />
          {error}
        </div>
      )}
      {hint && !error && (
        <div className="text-[hsl(var(--text-muted))] text-xs mt-1.5">
          {hint}
        </div>
      )}
    </div>
  );
}

/* ===== ConfirmDialog ===== */

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))] border-[hsl(var(--border-subtle))] rounded-2xl max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-lg text-[hsl(var(--text-primary))]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--text-secondary))] text-sm leading-normal">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-2 border-[hsl(var(--border-subtle))] text-[hsl(var(--text-primary))] bg-transparent font-heading font-bold hover:bg-[hsl(var(--surface-hover))]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              'font-heading font-bold',
              variant === 'danger'
                ? 'bg-[hsl(var(--destructive))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--destructive))]/90'
                : 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] hover:bg-[hsl(var(--gold))]/90',
            )}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ===== SkeletonCard ===== */

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <ShadcnCard className="rounded-2xl border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))]">
      <CardContent className="p-6 sm:p-8">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton rounded',
              i === 0 ? 'h-5' : 'h-3.5',
              i === lines - 1 ? 'w-3/5' : 'w-full',
              i < lines - 1 ? 'mb-2' : '',
            )}
          />
        ))}
      </CardContent>
    </ShadcnCard>
  );
}

/* ===== Pagination ===== */

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="페이지 네비게이션" className="flex gap-2 justify-center items-center mt-8">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="font-heading font-bold text-sm rounded-full text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))]"
        aria-label="이전 페이지"
      >
        이전
      </Button>
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'min-w-9 font-heading font-bold text-sm rounded-full',
            p === page
              ? 'bg-[hsl(var(--gold))] text-[hsl(var(--background))] hover:bg-[hsl(var(--gold))]/90'
              : 'text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))]',
          )}
        >
          {p}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="font-heading font-bold text-sm rounded-full text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--surface-hover))]"
        aria-label="다음 페이지"
      >
        다음
      </Button>
    </nav>
  );
}
