// 부록 C.4 — Recharts 토큰 매핑 단일 출처
// hex 직접 주입 금지. globals.css의 --chart-1~5 토큰 변경 시 자동 추종.

export const CHART_COLORS = [
  'hsl(var(--chart-1))', // gold (43° 70% 46%)
  'hsl(var(--chart-2))', // jade (145° 40% 35%)
  'hsl(var(--chart-3))', // lotus (350° 55% 35%)
  'hsl(var(--chart-4))', // dancheong (35° 70% 45%)
  'hsl(var(--chart-5))', // pink (340° 40% 50%)
] as const;

export type ChartColorIndex = 0 | 1 | 2 | 3 | 4;

export const CHART_GRID_STROKE = 'hsl(var(--border))';
export const CHART_AXIS_STROKE = 'hsl(var(--text-secondary))';
export const CHART_TOOLTIP_BG = 'hsl(var(--card))';
export const CHART_TOOLTIP_BORDER = 'hsl(var(--border))';
