'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  className?: string;
  ariaLabel?: string;
}

export function SidebarNav({ items, className, ariaLabel = '메뉴' }: SidebarNavProps) {
  const pathname = usePathname();

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const href = event.target.value;
    if (typeof window !== 'undefined') {
      window.location.href = href;
    }
  };

  const activeHref =
    items.find((item) => pathname === item.href)?.href ??
    items.find((item) => pathname.startsWith(item.href + '/'))?.href ??
    items[0]?.href ??
    '';

  return (
    <>
      {/* Mobile: native select fallback */}
      <div className={cn('md:hidden mb-6', className)}>
        <label htmlFor="sidebar-nav-select" className="sr-only">
          {ariaLabel}
        </label>
        <select
          id="sidebar-nav-select"
          value={activeHref}
          onChange={handleSelect}
          className="w-full px-4 py-3 text-sm text-[hsl(var(--text-primary))] bg-[hsl(var(--surface))] border border-[hsl(var(--border-subtle))] rounded-lg"
        >
          {items.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: 240px sticky sidebar */}
      <nav
        aria-label={ariaLabel}
        className={cn(
          'hidden md:block sticky top-24 self-start w-60 max-h-[calc(100dvh-128px)] overflow-y-auto',
          className,
        )}
      >
        <ul className="space-y-1 border-l border-[hsl(var(--border-subtle))]">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === activeHref;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 py-2 pl-4 pr-3 -ml-px border-l text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))] rounded-r-md',
                    isActive
                      ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))] font-medium'
                      : 'border-transparent hover:text-[hsl(var(--gold))]',
                    item.danger && !isActive && 'text-[hsl(var(--dancheong))]',
                    !item.danger && !isActive && 'text-[hsl(var(--text-secondary))]',
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
