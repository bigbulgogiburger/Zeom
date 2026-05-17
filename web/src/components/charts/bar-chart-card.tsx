'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_AXIS_STROKE,
  CHART_COLORS,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_BG,
  CHART_TOOLTIP_BORDER,
  ChartColorIndex,
} from './colors';

export type BarSeries = {
  key: string;
  label: string;
  colorIndex: ChartColorIndex;
};

type BarChartCardProps = {
  data: ReadonlyArray<Record<string, string | number>>;
  xKey: string;
  series: ReadonlyArray<BarSeries>;
  height?: number;
};

export default function BarChartCardImpl({
  data,
  xKey,
  series,
  height = 240,
}: BarChartCardProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={[...data]} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="2 4" vertical={false} />
        <XAxis
          dataKey={xKey}
          stroke={CHART_AXIS_STROKE}
          tick={{ fill: CHART_AXIS_STROKE, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_AXIS_STROKE}
          tick={{ fill: CHART_AXIS_STROKE, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip
          contentStyle={{
            background: CHART_TOOLTIP_BG,
            border: `1px solid ${CHART_TOOLTIP_BORDER}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: CHART_AXIS_STROKE }}
          cursor={{ fill: 'hsl(var(--surface-2) / 0.5)' }}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={CHART_COLORS[s.colorIndex]}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
