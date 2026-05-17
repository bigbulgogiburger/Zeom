'use client';

import dynamic from 'next/dynamic';

// Recharts는 client-only이며 SSR 부담을 피하기 위해 dynamic import (ssr: false)로 분리.
// 14개 admin 페이지 중 차트 사용 페이지(dashboard/analytics)만 lazy load.

export const LineChartCard = dynamic(() => import('./line-chart-card'), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse rounded bg-[hsl(var(--surface-2))]" />,
});

export const BarChartCard = dynamic(() => import('./bar-chart-card'), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse rounded bg-[hsl(var(--surface-2))]" />,
});

export const PieChartCard = dynamic(() => import('./pie-chart-card'), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse rounded bg-[hsl(var(--surface-2))]" />,
});

export type { LineSeries } from './line-chart-card';
export type { BarSeries } from './bar-chart-card';
export type { PieSlice } from './pie-chart-card';
export { CHART_COLORS } from './colors';
