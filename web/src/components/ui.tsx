'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

export function StatusBadge({ value }: { value: string }) {
  const v = (value || '').toUpperCase();

  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let className = '';

  if (["PAID", "OPEN", "BOOKED", "AUTH_LOGIN", "AUTH_SIGNUP", "AUTH_ADMIN_LOGIN", "CHARGE", "REFUND"].includes(v)) {
    className = 'bg-[var(--color-success)] text-[var(--color-success-light)] hover:bg-[var(--color-success)]';
  } else if (["PENDING", "USE"].includes(v)) {
    className = 'bg-[var(--color-warning)] text-[var(--color-warning-light)] hover:bg-[var(--color-warning)]';
  } else if (["FAILED", "CANCELED", "PAYMENT_FAILED", "PAYMENT_CANCELED", "CLOSED", "AUTH_LOGIN_FAIL", "AUTH_REFRESH_REUSE_DETECTED"].includes(v)) {
    variant = 'destructive';
  }

  return (
    <Badge variant={variant} className={cn('font-heading font-bold text-xs rounded-full', className)}>
      {v || 'UNKNOWN'}
    </Badge>
  );
}

export function Card({ children, className: extraClass }: { children: React.ReactNode; className?: string }) {
  return (
    <ShadcnCard className={cn(
      'rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[var(--color-bg-card)] shadow-md text-[var(--color-text-on-card)] hover:shadow-[0_8px_32px_rgba(201,162,39,0.12)] hover:-translate-y-0.5 transition-all duration-300',
      extraClass
    )}>
      <CardContent className="p-6 sm:p-8">
        {children}
      </CardContent>
    </ShadcnCard>
  );
}

export function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <Card className="shadow-[0_4px_20px_rgba(201,162,39,0.08)]">
      <div className="text-[var(--color-gold)] text-sm font-medium mb-2 font-heading">
        {title}
      </div>
      <div className="text-3xl font-black leading-tight font-heading">
        {value}
      </div>
      {hint && (
        <div className="text-[var(--color-text-muted-card)] text-xs mt-1">
          {hint}
        </div>
      )}
    </Card>
  );
}

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="m-0 text-3xl leading-tight font-bold font-heading tracking-tight text-[var(--color-text-on-dark)]">
      {children}
    </h2>
  );
}

export function EmptyState({ title, desc }: { title: string; desc?: string }) {
  return (
    <Card>
      <div className="text-center py-6">
        <div className="text-lg font-bold font-heading">
          {title}
        </div>
        {desc && (
          <div className="text-[var(--color-text-muted-card)] mt-2 text-sm leading-relaxed">
            {desc}
          </div>
        )}
      </div>
    </Card>
  );
}

export function InlineError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="text-[var(--color-danger)] text-sm font-medium">
      {message}
    </div>
  );
}

export function InlineSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="status" className="text-[var(--color-success)] text-sm font-medium">
      {message}
    </div>
  );
}

export function ActionButton({
  loading,
  children,
  className: extraClass,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; className?: string }) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading ? true : undefined}
      className={cn(
        'min-h-[48px] px-8 py-3 bg-gradient-to-r from-[#C9A227] to-[#D4A843] text-[#0f0d0a] font-bold font-heading rounded-full hover:from-[#b08d1f] hover:to-[#C9A227]',
        extraClass
      )}
      style={props.style}
    >
      {loading ? '처리 중…' : children}
    </Button>
  );
}

/* ===== FormField ===== */

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
    <div className="mb-6">
      <label className="block mb-2 font-medium text-sm">
        {label}
        {required && (
          <span className="text-[var(--color-danger)] ml-1" aria-hidden="true">*</span>
        )}
      </label>
      {children}
      {error && (
        <div role="alert" className="text-[var(--color-danger)] text-xs mt-1 font-medium">
          {error}
        </div>
      )}
      {hint && !error && (
        <div className="text-[#a49484] text-xs mt-1">
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
      <DialogContent className="bg-[var(--color-bg-card)] text-[var(--color-text-on-card)] border-[rgba(201,162,39,0.15)] rounded-2xl max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-heading font-bold text-lg">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted-card)] text-sm leading-normal">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-2 border-[var(--color-border-card)] text-[var(--color-text-on-card)] bg-transparent font-heading font-bold hover:bg-[var(--color-bg-card-hover)]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            className={cn(
              'font-heading font-bold',
              variant === 'danger'
                ? 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90'
                : 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] hover:bg-[var(--color-gold-hover)]'
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
    <ShadcnCard className="rounded-2xl border border-[rgba(201,162,39,0.15)] bg-[var(--color-bg-card)] shadow-md">
      <CardContent className="p-6 sm:p-8">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton',
              i === 0 ? 'h-5' : 'h-3.5',
              i === lines - 1 ? 'w-3/5' : 'w-full',
              i < lines - 1 ? 'mb-2' : ''
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
        className="font-heading font-bold text-sm rounded-full"
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
              ? 'bg-[var(--color-gold)] text-[var(--color-bg-primary)] hover:bg-[var(--color-gold-hover)]'
              : ''
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
        className="font-heading font-bold text-sm rounded-full"
        aria-label="다음 페이지"
      >
        다음
      </Button>
    </nav>
  );
}
